alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role = any (array['ADMIN'::text, 'AGENT'::text, 'CLIENT'::text]));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text;
  profile_role text;
begin
  profile_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Client HQS'
  );

  profile_role := upper(coalesce(nullif(new.raw_app_meta_data ->> 'role', ''), 'CLIENT'));
  if profile_role not in ('ADMIN', 'AGENT', 'CLIENT') then
    profile_role := 'CLIENT';
  end if;

  insert into public.profiles (id, name, email, full_name, role, is_active)
  values (new.id, profile_name, new.email, profile_name, profile_role, true)
  on conflict (id) do update
    set email = excluded.email,
        name = coalesce(nullif(public.profiles.name, ''), excluded.name),
        full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
        updated_at = now();

  insert into public.client_profiles (user_id, email, full_name)
  values (new.id, new.email, profile_name)
  on conflict (user_id) do update
    set email = excluded.email,
        full_name = coalesce(nullif(public.client_profiles.full_name, ''), excluded.full_name),
        updated_at = now();

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;
