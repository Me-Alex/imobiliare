-- Document Checklists: Track required documents for each appointment.

CREATE TABLE IF NOT EXISTS public.document_checklists (
  id uuid primary key default gen_random_uuid(),

  -- Reference to appointment
  appointment_id uuid not null references public.appointments_v2(id) on delete cascade,

  -- Document tracking
  document_type text not null,
  required boolean not null default true,

  -- Verification tracking
  uploaded_at timestamptz,
  verified_at timestamptz,
  verified_by uuid references public.staff_members(id) on delete set null,
  rejection_reason text,

  -- Status
  status text not null default 'PENDING'
    check (status in ('PENDING', 'UPLOADED', 'VERIFIED', 'REJECTED')),

  -- Unique constraint: one checklist entry per document type per appointment
  constraint document_checklists_unique_type_per_appointment unique (appointment_id, document_type)
);

-- Indexes
create index if not exists document_checklists_appointment_id_idx on public.document_checklists(appointment_id);
create index if not exists document_checklists_document_type_idx on public.document_checklists(document_type);
create index if not exists document_checklists_status_idx on public.document_checklists(status);

-- Row Level Security
alter table public.document_checklists enable row level security;

-- Drop existing policies
do $$
declare
  policy_name text;
begin
  for policy_name in
    select pol.polname
    from pg_policy pol
    where pol.polrelid = 'public.document_checklists'::regclass
  loop
    execute format('drop policy %I on public.document_checklists', policy_name);
  end loop;
end $$;

-- Participants can view their appointment checklists
create policy document_checklists_participants_read
on public.document_checklists for select
to authenticated
using (
  exists (
    select 1 from public.appointments_v2 apt
    where apt.id = document_checklists.appointment_id
      and (
        apt.client_id = (select auth.uid())
        or apt.agent_id in (
          select sm.id from public.staff_members sm
          where sm.user_id = (select auth.uid())
        )
        or public.is_admin_user()
        or public.is_agent_user()
      )
  )
);

-- Staff can manage checklists
create policy document_checklists_staff_manage
on public.document_checklists for all
to authenticated
using (
  public.is_admin_user()
  or public.is_agent_user()
  or exists (
    select 1 from public.appointments_v2 apt
    join public.staff_members sm on sm.id = apt.agent_id
    where apt.id = document_checklists.appointment_id
      and sm.user_id = (select auth.uid())
  )
)
with check (
  public.is_admin_user()
  or public.is_agent_user()
  or exists (
    select 1 from public.appointments_v2 apt
    join public.staff_members sm on sm.id = apt.agent_id
    where apt.id = document_checklists.appointment_id
      and sm.user_id = (select auth.uid())
  )
);

-- Revoke and grant permissions
revoke all on table public.document_checklists from anon, authenticated;
grant select, insert, update, delete on table public.document_checklists to authenticated;

-- Comments
comment on table public.document_checklists is 'Document checklist items for appointments';
comment on column public.document_checklists.document_type is 'Type of document required (e.g., id_card, proof_of_income, etc.)';
comment on column public.document_checklists.status is 'PENDING, UPLOADED, VERIFIED, REJECTED';
