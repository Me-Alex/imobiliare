-- Harden legacy secret-gated admin RPCs. Admin writes now go through
-- authenticated service-role API routes with RBAC and audit logging.
do $$
declare
  fn text;
  signatures text[] := array[
    'public.admin_secret_is_valid(text)',
    'public.admin_permission_snapshot(text, text)',
    'public.admin_list_platform(text)',
    'public.admin_update_offer_status(text, uuid, text, numeric)',
    'public.admin_upsert_cms_entry(text, jsonb)',
    'public.admin_add_lead_history(text, jsonb)',
    'public.admin_upsert_role(text, jsonb)',
    'public.admin_upsert_zone_poi(text, jsonb)',
    'public.admin_update_client_document_status(text, uuid, text)',
    'public.admin_add_client_notification(text, jsonb)',
    'public.admin_log_audit_event(text, jsonb)',
    'public.admin_log_event(text, text, text, text, uuid, jsonb)',
    'public.admin_mutate_lead(text, text, jsonb)',
    'public.admin_mutate_client_profile(text, text, jsonb)',
    'public.admin_mutate_appointment(text, text, jsonb)',
    'public.admin_mutate_appointment_slot(text, text, jsonb)',
    'public.admin_mutate_offer(text, text, jsonb)',
    'public.admin_review_client_document(text, text, jsonb)',
    'public.admin_mutate_zone_poi(text, text, jsonb)',
    'public.admin_queue_notification(text, text, jsonb)',
    'public.admin_update_appointment_status(text, uuid, text)'
  ];
begin
  foreach fn in array signatures loop
    if to_regprocedure(fn) is not null then
      execute format('revoke all on function %s from public, anon, authenticated', fn);
      execute format('grant execute on function %s to service_role', fn);
    end if;
  end loop;
end $$;

revoke insert, update, delete on table public.appointments from anon;

do $$
begin
  if exists (
    select 1
    from public.admin_roles
    where email in ('admin', 'manager', 'agent')
      and email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ) then
    delete from public.admin_roles
    where email in ('admin', 'manager', 'agent')
      and email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$';
  end if;
end $$;
