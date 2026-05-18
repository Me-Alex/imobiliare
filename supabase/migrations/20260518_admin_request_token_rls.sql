create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_roles ar
    where ar.status = 'ACTIVE'
      and (
        ar.user_id = auth.uid()
        or lower(ar.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  );
$$;

revoke all on function public.is_admin_user() from public;
grant execute on function public.is_admin_user() to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'admin_audit_log',
    'admin_bulk_imports',
    'admin_commissions',
    'admin_document_templates',
    'admin_document_versions',
    'admin_invoices',
    'admin_modules',
    'admin_notification_outbox',
    'admin_provider_events',
    'admin_provider_jobs',
    'admin_roles',
    'analytics_attribution',
    'appointment_slots',
    'appointments',
    'calendar_sync_events',
    'client_activity',
    'client_documents',
    'client_favorites',
    'client_notifications',
    'client_profiles',
    'cms_entries',
    'lead_history',
    'leads',
    'owner_reports',
    'properties',
    'property_media',
    'property_offers',
    'zone_poi'
  ] loop
    if to_regclass('public.' || table_name) is not null then
      execute format('drop policy if exists "admin request token all" on public.%I', table_name);
      execute format(
        'create policy "admin request token all" on public.%I for all to authenticated using (public.is_admin_user()) with check (public.is_admin_user())',
        table_name
      );
    end if;
  end loop;
end $$;

drop policy if exists "admin property media storage all" on storage.objects;
create policy "admin property media storage all" on storage.objects
  for all to authenticated
  using (bucket_id = 'property-media' and public.is_admin_user())
  with check (bucket_id = 'property-media' and public.is_admin_user());
