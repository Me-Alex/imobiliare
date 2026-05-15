create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text;
  profile_role text;
  profile_phone text;
begin
  profile_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Client HQS'
  );

  profile_phone := nullif(trim(new.raw_user_meta_data ->> 'phone'), '');

  profile_role := upper(coalesce(nullif(new.raw_app_meta_data ->> 'role', ''), 'CLIENT'));
  if profile_role not in ('ADMIN', 'AGENT', 'CLIENT') then
    profile_role := 'CLIENT';
  end if;

  insert into public.profiles (id, name, email, full_name, role, is_active)
  values (new.id, profile_name, new.email, profile_name, profile_role, true)
  on conflict (id) do update
    set email = coalesce(nullif(public.profiles.email, ''), excluded.email),
        name = coalesce(nullif(public.profiles.name, ''), excluded.name),
        full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
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

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

with auth_backfill as (
  select
    u.id,
    u.email,
    coalesce(
      nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
      nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
      'Client HQS'
    ) as full_name,
    nullif(trim(u.raw_user_meta_data ->> 'phone'), '') as phone,
    case
      when upper(coalesce(nullif(u.raw_app_meta_data ->> 'role', ''), 'CLIENT')) in ('ADMIN', 'AGENT', 'CLIENT')
        then upper(coalesce(nullif(u.raw_app_meta_data ->> 'role', ''), 'CLIENT'))
      else 'CLIENT'
    end as role
  from auth.users u
)
insert into public.profiles (id, name, email, full_name, role, is_active)
select id, full_name, email, full_name, role, true
from auth_backfill
on conflict (id) do update
  set email = coalesce(nullif(public.profiles.email, ''), excluded.email),
      name = coalesce(nullif(public.profiles.name, ''), excluded.name),
      full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
      role = coalesce(nullif(public.profiles.role, ''), excluded.role),
      is_active = coalesce(public.profiles.is_active, excluded.is_active),
      updated_at = now();

with auth_backfill as (
  select
    u.id,
    u.email,
    coalesce(
      nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
      nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
      'Client HQS'
    ) as full_name,
    nullif(trim(u.raw_user_meta_data ->> 'phone'), '') as phone
  from auth.users u
)
insert into public.client_profiles (user_id, email, full_name, phone)
select id, email, full_name, phone
from auth_backfill
on conflict (user_id) do update
  set email = coalesce(nullif(public.client_profiles.email, ''), excluded.email),
      full_name = coalesce(nullif(public.client_profiles.full_name, ''), excluded.full_name),
      phone = coalesce(nullif(public.client_profiles.phone, ''), excluded.phone),
      updated_at = now();

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
