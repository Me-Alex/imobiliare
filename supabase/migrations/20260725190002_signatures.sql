-- Signatures: Electronic signature records for documents.

CREATE TABLE IF NOT EXISTS public.signatures (
  id uuid primary key default gen_random_uuid(),

  -- Reference to appointment
  appointment_id uuid not null references public.appointments_v2(id) on delete cascade,

  -- Document tracking
  document_type text not null,

  -- Signer information
  signer_id uuid not null references auth.users(id) on delete cascade,
  signer_name text not null,
  signer_role text not null check (signer_role in ('CLIENT', 'AGENT')),

  -- Signature details
  method text check (method in ('TYPED', 'DRAWN')),
  signature_text text,  -- For TYPED signatures
  signature_image_url text,  -- For DRAWN signatures

  -- Consent and timing
  consent_accepted_at timestamptz,
  signed_at timestamptz not null default now(),

  -- Audit information
  ip_address inet,
  user_agent text,

  -- Unique constraint: one signature per document type per signer per appointment
  constraint signatures_unique_per_signer_document unique (appointment_id, document_type, signer_id)
);

-- Indexes
create index if not exists signatures_appointment_id_idx on public.signatures(appointment_id);
create index if not exists signatures_signer_id_idx on public.signatures(signer_id);
create index if not exists signatures_document_type_idx on public.signatures(document_type);
create index if not exists signatures_signed_at_idx on public.signatures(signed_at desc);

-- Row Level Security
alter table public.signatures enable row level security;

-- Drop existing policies
do $$
declare
  policy_name text;
begin
  for policy_name in
    select pol.polname
    from pg_policy pol
    where pol.polrelid = 'public.signatures'::regclass
  loop
    execute format('drop policy %I on public.signatures', policy_name);
  end loop;
end $$;

-- Participants can view their own signatures
create policy signatures_own_read
on public.signatures for select
to authenticated
using (
  signer_id = (select auth.uid())
  or public.is_admin_user()
  or public.is_agent_user()
  or exists (
    select 1 from public.appointments_v2 apt
    where apt.id = signatures.appointment_id
      and apt.client_id = (select auth.uid())
  )
);

-- Users can insert their own signatures
create policy signatures_own_insert
on public.signatures for insert
to authenticated
with check (
  signer_id = (select auth.uid())
);

-- Users can update their own signatures (if not yet signed)
create policy signatures_own_update
on public.signatures for update
to authenticated
using (
  signer_id = (select auth.uid())
  and signed_at = created_at  -- Can only update if not yet signed
)
with check (
  signer_id = (select auth.uid())
);

-- Staff can view all signatures for their appointments
create policy signatures_staff_read
on public.signatures for select
to authenticated
using (
  exists (
    select 1 from public.appointments_v2 apt
    join public.staff_members sm on sm.id = apt.agent_id
    where apt.id = signatures.appointment_id
      and sm.user_id = (select auth.uid())
  )
  or public.is_admin_user()
  or public.is_agent_user()
);

-- Revoke and grant permissions
revoke all on table public.signatures from anon, authenticated;
grant select, insert, update on table public.signatures to authenticated;
grant delete on table public.signatures to authenticated;

-- Comments
comment on table public.signatures is 'Electronic signature records for appointment documents';
comment on column public.signatures.method is 'TYPED (text signature) or DRAWN (drawn image)';
comment on column public.signatures.signer_role is 'CLIENT or AGENT';
