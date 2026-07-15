-- The caller only needs their own RLS-visible profile row, so this helper does
-- not require elevated privileges.
create or replace function public.current_account_role()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid())
    and coalesce(p.is_active, true)
  limit 1;
$$;

revoke execute on function public.current_account_role() from public, anon;
grant execute on function public.current_account_role() to authenticated;
