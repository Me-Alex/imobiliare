-- Role-specific account profiles and property ownership.
-- Client/Owner is user-selectable. Agent/Admin remains staff-managed.

alter table public.profiles
  add column if not exists bio text,
  add column if not exists company_name text,
  add column if not exists license_number text,
  add column if not exists notification_preferences jsonb not null default '{"newProperties":true,"priceAlerts":true,"viewingUpdates":true,"weeklyNewsletter":false,"specialOffers":false}'::jsonb,
  add column if not exists display_preferences jsonb not null default '{"currency":"EUR","defaultSort":"newest","defaultType":"all"}'::jsonb;

alter table public.profiles drop constraint if exists profiles_role_check;

update public.profiles
set role = upper(trim(role))
where role is distinct from upper(trim(role));

update public.profiles
set role = 'CLIENT'
where role is null or role not in ('CLIENT', 'OWNER', 'AGENT', 'ADMIN');

alter table public.profiles alter column role set default 'CLIENT';
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('CLIENT', 'OWNER', 'AGENT', 'ADMIN'));

create or replace function public.current_account_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid())
    and coalesce(p.is_active, true)
  limit 1;
$$;

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (
      exists (
        select 1
        from public.profiles p
        where p.id = (select auth.uid())
          and p.role = 'ADMIN'
          and coalesce(p.is_active, true)
      )
      or exists (
        select 1
        from public.admin_roles ar
        where upper(ar.status) = 'ACTIVE'
          and lower(ar.role) in ('admin', 'manager')
          and (
            ar.user_id = (select auth.uid())
            or lower(ar.email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
          )
      )
    );
$$;

create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    -- Trusted database/service operations have no end-user JWT.
    if (select auth.uid()) is null then
      return new;
    end if;

    if public.is_admin_user() then
      return new;
    end if;

    if (select auth.uid()) = old.id
      and old.role in ('CLIENT', 'OWNER')
      and new.role in ('CLIENT', 'OWNER') then
      return new;
    end if;

    raise exception 'Not authorized to change account role';
  end if;

  return new;
end;
$$;

-- Recover intended owner accounts from trusted existing metadata.
update public.profiles p
set role = 'OWNER', updated_at = now()
from auth.users u
where u.id = p.id
  and upper(coalesce(
    nullif(u.raw_user_meta_data ->> 'account_type', ''),
    nullif(u.raw_user_meta_data ->> 'role', '')
  )) in ('OWNER', 'PROPRIETAR')
  and not exists (
    select 1
    from public.admin_roles ar
    where upper(ar.status) = 'ACTIVE'
      and lower(ar.role) in ('admin', 'manager')
      and (ar.user_id = p.id or lower(ar.email) = lower(p.email))
  );

-- Staff roles are assigned only from the protected staff registry.
update public.profiles p
set role = 'AGENT', updated_at = now()
from public.admin_roles ar
where upper(ar.status) = 'ACTIVE'
  and lower(ar.role) = 'agent'
  and (ar.user_id = p.id or lower(ar.email) = lower(p.email));

update public.profiles p
set role = 'ADMIN', updated_at = now()
from public.admin_roles ar
where upper(ar.status) = 'ACTIVE'
  and lower(ar.role) in ('admin', 'manager')
  and (ar.user_id = p.id or lower(ar.email) = lower(p.email));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text;
  profile_role text;
  requested_role text;
  app_role text;
  profile_phone text;
  profile_avatar text;
begin
  profile_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Client HQS'
  );
  profile_phone := nullif(trim(new.raw_user_meta_data ->> 'phone'), '');
  profile_avatar := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'picture'), '')
  );

  requested_role := upper(coalesce(
    nullif(new.raw_user_meta_data ->> 'account_type', ''),
    nullif(new.raw_user_meta_data ->> 'role', ''),
    'CLIENT'
  ));
  app_role := upper(coalesce(nullif(new.raw_app_meta_data ->> 'role', ''), ''));

  if app_role in ('ADMIN', 'AGENT') then
    profile_role := app_role;
  elsif requested_role in ('OWNER', 'PROPRIETAR') then
    profile_role := 'OWNER';
  else
    profile_role := 'CLIENT';
  end if;

  insert into public.profiles (id, name, email, full_name, phone, avatar_url, role, is_active)
  values (new.id, profile_name, new.email, profile_name, profile_phone, profile_avatar, profile_role, true)
  on conflict (id) do update
    set email = coalesce(nullif(public.profiles.email, ''), excluded.email),
        name = coalesce(nullif(public.profiles.name, ''), excluded.name),
        full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
        phone = coalesce(public.profiles.phone, excluded.phone),
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
        role = coalesce(nullif(public.profiles.role, ''), excluded.role),
        is_active = coalesce(public.profiles.is_active, excluded.is_active),
        updated_at = now();

  insert into public.client_profiles (user_id, email, full_name, phone)
  values (new.id, new.email, profile_name, profile_phone)
  on conflict (user_id) do update
    set email = coalesce(nullif(public.client_profiles.email, ''), excluded.email),
        full_name = coalesce(nullif(public.client_profiles.full_name, ''), excluded.full_name),
        phone = coalesce(nullif(public.client_profiles.phone, ''), excluded.phone),
        updated_at = now();

  return new;
end;
$$;

revoke all on function public.current_account_role() from public;
revoke all on function public.is_admin_user() from public;
revoke all on function public.prevent_profile_role_change() from public;
revoke all on function public.handle_new_user() from public;
grant execute on function public.current_account_role() to authenticated;
grant execute on function public.is_admin_user() to authenticated;

alter table public.profiles enable row level security;

do $$
declare
  policy_name text;
begin
  for policy_name in
    select pol.polname
    from pg_policy pol
    where pol.polrelid = 'public.profiles'::regclass
  loop
    execute format('drop policy %I on public.profiles', policy_name);
  end loop;
end $$;

create policy profiles_select_own_or_admin
on public.profiles for select
to authenticated
using ((select auth.uid()) = id or public.is_admin_user());

create policy profiles_insert_own
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id and role in ('CLIENT', 'OWNER'));

create policy profiles_update_own_or_admin
on public.profiles for update
to authenticated
using ((select auth.uid()) = id or public.is_admin_user())
with check ((select auth.uid()) = id or public.is_admin_user());

create policy profiles_delete_admin
on public.profiles for delete
to authenticated
using (public.is_admin_user());

revoke all on table public.profiles from anon, authenticated;
grant select, insert, update, delete on table public.profiles to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.properties'::regclass
      and conname = 'properties_owner_id_fkey'
  ) then
    alter table public.properties
      add constraint properties_owner_id_fkey
      foreign key (owner_id) references public.profiles(id) on delete set null;
  end if;
end $$;

update public.properties prop
set owner_id = profile.id
from public.profiles profile
where prop.owner_id is null
  and prop.owner_email is not null
  and lower(prop.owner_email) = lower(profile.email)
  and profile.role = 'OWNER';

create index if not exists properties_owner_id_idx on public.properties(owner_id);
create index if not exists properties_agent_id_idx on public.properties(agent_id);

alter table public.properties enable row level security;

do $$
declare
  policy_name text;
begin
  for policy_name in
    select pol.polname
    from pg_policy pol
    where pol.polrelid = 'public.properties'::regclass
  loop
    execute format('drop policy %I on public.properties', policy_name);
  end loop;
end $$;

create policy properties_public_read_published
on public.properties for select
to anon, authenticated
using (status = 'PUBLISHED');

create policy properties_owner_read_own
on public.properties for select
to authenticated
using (
  public.current_account_role() = 'OWNER'
  and (
    owner_id = (select auth.uid())
    or lower(coalesce(owner_email, '')) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  )
);

create policy properties_owner_insert_own
on public.properties for insert
to authenticated
with check (
  public.current_account_role() = 'OWNER'
  and owner_id = (select auth.uid())
  and agent_id is null
);

create policy properties_owner_update_own
on public.properties for update
to authenticated
using (public.current_account_role() = 'OWNER' and owner_id = (select auth.uid()))
with check (public.current_account_role() = 'OWNER' and owner_id = (select auth.uid()));

create policy properties_owner_delete_own
on public.properties for delete
to authenticated
using (public.current_account_role() = 'OWNER' and owner_id = (select auth.uid()));

create policy properties_agent_read_assigned
on public.properties for select
to authenticated
using (public.current_account_role() = 'AGENT' and agent_id = (select auth.uid()));

create policy properties_agent_insert_assigned
on public.properties for insert
to authenticated
with check (public.current_account_role() = 'AGENT' and agent_id = (select auth.uid()));

create policy properties_agent_update_assigned
on public.properties for update
to authenticated
using (public.current_account_role() = 'AGENT' and agent_id = (select auth.uid()))
with check (public.current_account_role() = 'AGENT' and agent_id = (select auth.uid()));

create policy properties_agent_delete_assigned
on public.properties for delete
to authenticated
using (public.current_account_role() = 'AGENT' and agent_id = (select auth.uid()));

create policy properties_admin_manage_all
on public.properties for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

revoke all on table public.properties from anon, authenticated;
grant select on table public.properties to anon;
grant select, insert, update, delete on table public.properties to authenticated;

comment on column public.profiles.role is
  'Account role: CLIENT and OWNER are self-selectable; AGENT and ADMIN are staff-managed.';
