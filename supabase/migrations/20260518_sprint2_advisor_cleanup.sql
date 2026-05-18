-- Cleanup after Sprint 2 advisors: remove duplicate index, avoid broad public object listing,
-- and add admin-token policies/indexes for older admin module tables.

drop index if exists public.idx_client_notifications_user_unread;

drop policy if exists "property media public object read" on storage.objects;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'admin_activities',
    'admin_documents',
    'admin_notifications',
    'admin_owners',
    'admin_payment_plans',
    'admin_projects',
    'admin_runtime_config',
    'admin_settings',
    'admin_team_users'
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

create index if not exists idx_admin_commissions_invoice_id on public.admin_commissions(invoice_id);
create index if not exists idx_admin_commissions_property_id on public.admin_commissions(property_id);
create index if not exists idx_admin_document_versions_client_document_id on public.admin_document_versions(client_document_id);
create index if not exists idx_admin_document_versions_property_id on public.admin_document_versions(property_id);
create index if not exists idx_admin_document_versions_template_id on public.admin_document_versions(template_id);
create index if not exists idx_admin_invoices_property_id on public.admin_invoices(property_id);
create index if not exists idx_admin_roles_user_id on public.admin_roles(user_id);
create index if not exists idx_analytics_attribution_lead_id on public.analytics_attribution(lead_id);
create index if not exists idx_analytics_attribution_property_id on public.analytics_attribution(property_id);
create index if not exists idx_calendar_sync_events_appointment_id on public.calendar_sync_events(appointment_id);
create index if not exists idx_client_favorites_property_id on public.client_favorites(property_id);
create index if not exists idx_owner_reports_property_id on public.owner_reports(property_id);
create index if not exists idx_property_offers_property_id on public.property_offers(property_id);
create index if not exists idx_property_offers_user_id on public.property_offers(user_id);
