create or replace function public.admin_secret_is_valid(admin_secret text)
returns boolean
language sql
stable
as $$
  select admin_secret is not null and admin_secret = 'hqs_rpc_20260511_8f4b2c9d7e31';
$$;

grant execute on function public.admin_secret_is_valid(text) to anon, authenticated;
