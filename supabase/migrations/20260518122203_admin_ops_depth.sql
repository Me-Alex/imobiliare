-- Admin operations depth: private document metadata and operational indexes.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'client-documents',
  'client-documents',
  false,
  15728640,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.client_documents add column if not exists storage_bucket text not null default 'client-documents';
alter table public.client_documents add column if not exists storage_path text;
alter table public.client_documents add column if not exists file_name text;
alter table public.client_documents add column if not exists mime_type text;
alter table public.client_documents add column if not exists byte_size bigint;
alter table public.client_documents add column if not exists checksum text;
alter table public.client_documents add column if not exists uploaded_by text;

create index if not exists idx_client_documents_storage_path
  on public.client_documents(storage_bucket, storage_path)
  where storage_path is not null;

create index if not exists idx_admin_provider_jobs_retry_queue
  on public.admin_provider_jobs(status, next_attempt_at, created_at)
  where status in ('QUEUED', 'RETRYING', 'FAILED_PROVIDER');

create index if not exists idx_admin_invoices_client_status
  on public.admin_invoices(client_email, status, created_at desc);

create index if not exists idx_admin_roles_status_email
  on public.admin_roles(status, lower(email));

alter table public.owner_reports add column if not exists scheduled_at timestamptz;
alter table public.owner_reports add column if not exists cadence text;
alter table public.owner_reports add column if not exists next_send_at timestamptz;

create index if not exists idx_owner_reports_next_send
  on public.owner_reports(status, next_send_at)
  where next_send_at is not null;

drop policy if exists "client documents storage own files" on storage.objects;
create policy "client documents storage own files" on storage.objects
  for all
  to authenticated
  using (bucket_id = 'client-documents' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'client-documents' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "client documents admin storage all" on storage.objects;
create policy "client documents admin storage all" on storage.objects
  for all
  to authenticated
  using (bucket_id = 'client-documents' and public.is_admin_user())
  with check (bucket_id = 'client-documents' and public.is_admin_user());
