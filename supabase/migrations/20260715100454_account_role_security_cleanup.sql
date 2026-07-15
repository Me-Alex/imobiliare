-- Tighten explicit function grants and consolidate property policies so each
-- database role evaluates one policy per action.

revoke execute on function public.current_account_role() from anon;
revoke execute on function public.is_admin_user() from anon;
revoke execute on function public.prevent_profile_role_change() from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;

drop index if exists public.properties_agent_id_idx;

drop policy if exists properties_public_read_published on public.properties;
drop policy if exists properties_owner_read_own on public.properties;
drop policy if exists properties_owner_insert_own on public.properties;
drop policy if exists properties_owner_update_own on public.properties;
drop policy if exists properties_owner_delete_own on public.properties;
drop policy if exists properties_agent_read_assigned on public.properties;
drop policy if exists properties_agent_insert_assigned on public.properties;
drop policy if exists properties_agent_update_assigned on public.properties;
drop policy if exists properties_agent_delete_assigned on public.properties;
drop policy if exists properties_admin_manage_all on public.properties;

create policy properties_public_read_published
on public.properties for select
to anon
using (status = 'PUBLISHED');

create policy properties_authenticated_read
on public.properties for select
to authenticated
using (
  status = 'PUBLISHED'
  or public.is_admin_user()
  or (
    public.current_account_role() = 'OWNER'
    and (
      owner_id = (select auth.uid())
      or lower(coalesce(owner_email, '')) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
    )
  )
  or (public.current_account_role() = 'AGENT' and agent_id = (select auth.uid()))
);

create policy properties_authenticated_insert
on public.properties for insert
to authenticated
with check (
  public.is_admin_user()
  or (
    public.current_account_role() = 'OWNER'
    and owner_id = (select auth.uid())
    and agent_id is null
  )
  or (
    public.current_account_role() = 'AGENT'
    and agent_id = (select auth.uid())
  )
);

create policy properties_authenticated_update
on public.properties for update
to authenticated
using (
  public.is_admin_user()
  or (public.current_account_role() = 'OWNER' and owner_id = (select auth.uid()))
  or (public.current_account_role() = 'AGENT' and agent_id = (select auth.uid()))
)
with check (
  public.is_admin_user()
  or (public.current_account_role() = 'OWNER' and owner_id = (select auth.uid()))
  or (public.current_account_role() = 'AGENT' and agent_id = (select auth.uid()))
);

create policy properties_authenticated_delete
on public.properties for delete
to authenticated
using (
  public.is_admin_user()
  or (public.current_account_role() = 'OWNER' and owner_id = (select auth.uid()))
  or (public.current_account_role() = 'AGENT' and agent_id = (select auth.uid()))
);
