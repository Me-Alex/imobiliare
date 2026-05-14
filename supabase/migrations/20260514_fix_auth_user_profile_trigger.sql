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

  profile_role := upper(coalesce(nullif(new.raw_app_meta_data ->> 'role', ''), 'AGENT'));
  if profile_role not in ('ADMIN', 'AGENT') then
    profile_role := 'AGENT';
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
