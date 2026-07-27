-- Document Uploads: File upload records for client documents.

CREATE TABLE IF NOT EXISTS public.document_uploads (
  id uuid primary key default gen_random_uuid(),

  -- Reference to appointment
  appointment_id uuid not null references public.appointments_v2(id) on delete cascade,

  -- Document information
  document_type text not null,
  file_name text,
  file_size bigint,
  mime_type text,
  storage_path text,
  storage_bucket text not null default 'client-documents',

  -- Upload tracking
  uploaded_by uuid references auth.users(id) on delete set null,
  uploaded_at timestamptz not null default now(),

  -- Verification tracking
  verified_at timestamptz,
  verified_by uuid references public.staff_members(id) on delete set null,
  rejection_reason text,

  -- Status
  status text not null default 'PENDING'
    check (status in ('PENDING', 'APPROVED', 'REJECTED')),

  -- File integrity
  checksum text
);

-- Indexes
create index if not exists document_uploads_appointment_id_idx on public.document_uploads(appointment_id);
create index if not exists document_uploads_uploaded_by_idx on public.document_uploads(uploaded_by);
create index if not exists document_uploads_document_type_idx on public.document_uploads(document_type);
create index if not exists document_uploads_status_idx on public.document_uploads(status);
create index if not exists document_uploads_storage_bucket_path_idx on public.document_uploads(storage_bucket, storage_path) where storage_path is not null;

-- Row Level Security
alter table public.document_uploads enable row level security;

-- Drop existing policies
do $$
declare
  policy_name text;
begin
  for policy_name in
    select pol.polname
    from pg_policy pol
    where pol.polrelid = 'public.document_uploads'::regclass
  loop
    execute format('drop policy %I on public.document_uploads', policy_name);
  end loop;
end $$;

-- Participants can view uploads for their appointments
create policy document_uploads_participants_read
on public.document_uploads for select
to authenticated
using (
  uploaded_by = (select auth.uid())
  or public.is_admin_user()
  or public.is_agent_user()
  or exists (
    select 1 from public.appointments_v2 apt
    where apt.id = document_uploads.appointment_id
      and (
        apt.client_id = (select auth.uid())
        or apt.agent_id in (
          select sm.id from public.staff_members sm
          where sm.user_id = (select auth.uid())
        )
      )
  )
);

-- Users can upload their own documents
create policy document_uploads_own_insert
on public.document_uploads for insert
to authenticated
with check (
  uploaded_by = (select auth.uid())
  and status = 'PENDING'
);

-- Users can update their own pending uploads
create policy document_uploads_own_update
on public.document_uploads for update
to authenticated
using (
  uploaded_by = (select auth.uid())
  and status = 'PENDING'
)
with check (
  uploaded_by = (select auth.uid())
  and status = 'PENDING'
);

-- Staff can verify/reject uploads
create policy document_uploads_staff_manage
on public.document_uploads for update
to authenticated
using (
  public.is_admin_user()
  or public.is_agent_user()
  or exists (
    select 1 from public.appointments_v2 apt
    join public.staff_members sm on sm.id = apt.agent_id
    where apt.id = document_uploads.appointment_id
      and sm.user_id = (select auth.uid())
  )
);

-- Revoke and grant permissions
revoke all on table public.document_uploads from anon, authenticated;
grant select, insert, update on table public.document_uploads to authenticated;
grant delete on table public.document_uploads to authenticated;

-- Comments
comment on table public.document_uploads is 'Document upload records for appointment documents';
comment on column public.document_uploads.storage_bucket is 'Supabase Storage bucket name';
comment on column public.document_uploads.checksum is 'SHA256 checksum for file integrity verification';
