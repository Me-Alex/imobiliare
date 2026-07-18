-- Production follow-up for the initial Deal Room migration. Fresh databases
-- already receive these indexes from the original migration; IF NOT EXISTS
-- keeps both paths equivalent.
drop index if exists public.leads_property_id_idx;

create index if not exists crm_follow_ups_created_by_idx
  on public.crm_follow_ups (created_by);
create index if not exists deal_rooms_created_by_idx
  on public.deal_rooms (created_by);
create index if not exists deal_document_requirements_requested_by_idx
  on public.deal_document_requirements (requested_by);
