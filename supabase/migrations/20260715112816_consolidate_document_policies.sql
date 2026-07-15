-- Consolidate permissive policies where the same access rules can safely be
-- expressed in one policy per action.

drop index if exists public.appointments_property_id_idx;

-- Appointments: participant SELECT already includes admins. Keep client and
-- agent UPDATE transitions separate so clients cannot promote their own status.
drop policy if exists appointments_admin_manage on public.appointments;
drop policy if exists appointments_client_insert on public.appointments;

create policy appointments_insert
on public.appointments for insert
to authenticated
with check (
  public.is_admin_user()
  or (
    client_id = (select auth.uid())
    and lower(coalesce(client_email, '')) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
    and agent_id is null
    and status in ('PENDING', 'REQUESTED')
  )
);

create policy appointments_admin_update
on public.appointments for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy appointments_admin_delete
on public.appointments for delete
to authenticated
using (public.is_admin_user());

-- Client documents: combine client, agent and admin branches without widening
-- any role's access.
drop policy if exists client_documents_admin_manage on public.client_documents;
drop policy if exists client_documents_client_insert on public.client_documents;
drop policy if exists client_documents_agent_insert on public.client_documents;
drop policy if exists client_documents_agent_update on public.client_documents;
drop policy if exists client_documents_client_delete on public.client_documents;

create policy client_documents_insert
on public.client_documents for insert
to authenticated
with check (
  public.is_admin_user()
  or (
    user_id = (select auth.uid())
    and coalesce(uploaded_by, (select auth.uid())::text) = (select auth.uid())::text
    and locked_at is null
    and status in ('DRAFT', 'PENDING', 'UPLOADED', 'READY_TO_SIGN')
    and (
      appointment_id is null
      or exists (
        select 1 from public.appointments appointment
        where appointment.id = client_documents.appointment_id
          and appointment.client_id = (select auth.uid())
      )
    )
  )
  or (
    uploaded_by = (select auth.uid())::text
    and exists (
      select 1 from public.appointments appointment
      where appointment.id = client_documents.appointment_id
        and appointment.agent_id = (select auth.uid())
        and appointment.client_id = client_documents.user_id
    )
  )
);

create policy client_documents_update
on public.client_documents for update
to authenticated
using (
  public.is_admin_user()
  or (
    locked_at is null
    and exists (
      select 1 from public.appointments appointment
      where appointment.id = client_documents.appointment_id
        and appointment.agent_id = (select auth.uid())
    )
  )
)
with check (
  public.is_admin_user()
  or (
    locked_at is null
    and exists (
      select 1 from public.appointments appointment
      where appointment.id = client_documents.appointment_id
        and appointment.agent_id = (select auth.uid())
    )
  )
);

create policy client_documents_delete
on public.client_documents for delete
to authenticated
using (
  public.is_admin_user()
  or (
    user_id = (select auth.uid())
    and locked_at is null
    and status in ('DRAFT', 'PENDING', 'UPLOADED', 'READY_TO_SIGN')
  )
);

-- Active templates and visible versions have a single SELECT policy; write
-- access remains admin-only.
drop policy if exists "admin request token all" on public.admin_document_templates;
drop policy if exists document_templates_active_read on public.admin_document_templates;

create policy document_templates_read
on public.admin_document_templates for select
to authenticated
using (status = 'ACTIVE' or public.is_admin_user());

create policy document_templates_admin_insert
on public.admin_document_templates for insert
to authenticated
with check (public.is_admin_user());

create policy document_templates_admin_update
on public.admin_document_templates for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy document_templates_admin_delete
on public.admin_document_templates for delete
to authenticated
using (public.is_admin_user());

drop policy if exists "admin request token all" on public.admin_document_versions;
drop policy if exists document_versions_participants_read on public.admin_document_versions;

create policy document_versions_read
on public.admin_document_versions for select
to authenticated
using (
  public.is_admin_user()
  or (
    client_document_id in (select document.id from public.client_documents document)
    and status in ('DRAFT', 'PENDING', 'UPLOADED', 'READY_TO_SIGN', 'PARTIALLY_SIGNED', 'SIGNED', 'APPROVED')
  )
);

create policy document_versions_admin_insert
on public.admin_document_versions for insert
to authenticated
with check (public.is_admin_user());

create policy document_versions_admin_update
on public.admin_document_versions for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy document_versions_admin_delete
on public.admin_document_versions for delete
to authenticated
using (public.is_admin_user());

-- Audit rows and signer rows are written by trusted triggers. Admins already
-- read them through the document participant policies.
drop policy if exists document_signers_admin_manage on public.document_signers;
drop policy if exists document_events_admin_manage on public.document_events;
