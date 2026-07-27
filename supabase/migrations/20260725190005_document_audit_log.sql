-- Document Audit Log: Immutable audit trail for document actions.

CREATE TABLE IF NOT EXISTS public.document_audit_log (
  id uuid primary key default gen_random_uuid(),

  -- Reference to document
  document_id uuid not null references public.document_uploads(id) on delete cascade,

  -- Action tracking
  action text not null
    check (action in ('VIEW', 'DOWNLOAD', 'VERIFY', 'REJECT', 'DELETE')),

  -- Actor information
  performed_by uuid references auth.users(id) on delete set null,
  performed_at timestamptz not null default now(),

  -- Audit information
  ip_address inet,
  user_agent text,

  -- Additional metadata
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object')
);

-- Indexes
create index if not exists document_audit_log_document_id_idx on public.document_audit_log(document_id);
create index if not exists document_audit_log_performed_by_idx on public.document_audit_log(performed_by);
create index if not exists document_audit_log_performed_at_idx on public.document_audit_log(performed_at desc);
create index if not exists document_audit_log_action_idx on public.document_audit_log(action);

-- Row Level Security
alter table public.document_audit_log enable row level security;

-- Drop existing policies
do $$
declare
  policy_name text;
begin
  for policy_name in
    select pol.polname
    from pg_policy pol
    where pol.polrelid = 'public.document_audit_log'::regclass
  loop
    execute format('drop policy %I on public.document_audit_log', policy_name);
  end loop;
end $$;

-- Participants can view audit logs for their documents
create policy document_audit_log_participants_read
on public.document_audit_log for select
to authenticated
using (
  exists (
    select 1 from public.document_uploads du
    join public.appointments_v2 apt on apt.id = du.appointment_id
    where du.id = document_audit_log.document_id
      and (
        du.uploaded_by = (select auth.uid())
        or apt.client_id = (select auth.uid())
        or apt.agent_id in (
          select sm.id from public.staff_members sm
          where sm.user_id = (select auth.uid())
        )
      )
  )
  or public.is_admin_user()
  or public.is_agent_user()
);

-- Only service role can insert audit logs (via API/triggers)
create policy document_audit_log_service_insert
on public.document_audit_log for insert
to authenticated
with check (
  performed_by = (select auth.uid())
  or public.is_admin_user()
);

-- Audit logs cannot be updated or deleted (immutable)
-- No update or delete policies - keeping the log immutable

-- Revoke and grant permissions
revoke all on table public.document_audit_log from anon, authenticated;
grant select, insert on table public.document_audit_log to authenticated;

-- Comments
comment on table public.document_audit_log is 'Immutable audit log for document actions';
comment on column public.document_audit_log.action is 'VIEW, DOWNLOAD, VERIFY, REJECT, DELETE';
comment on column public.document_audit_log.metadata is 'Additional context about the action (e.g., reason for rejection)';
