-- Viewing dossiers, private documents and auditable simple electronic signatures.

create schema if not exists private;
revoke all on schema private from public;

-- ---------------------------------------------------------------------------
-- Appointments become the canonical source for viewings created in the app.
-- ---------------------------------------------------------------------------

alter table public.appointments
  add column if not exists client_id uuid references public.profiles(id) on delete set null,
  add column if not exists property_reference text,
  add column if not exists property_title text,
  add column if not exists staff_reference text,
  add column if not exists staff_name text,
  add column if not exists source_id text,
  add column if not exists rating integer,
  add column if not exists feedback text,
  add column if not exists would_proceed boolean;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.appointments'::regclass
      and conname = 'appointments_rating_check'
  ) then
    alter table public.appointments
      add constraint appointments_rating_check
      check (rating is null or rating between 1 and 5);
  end if;
end $$;

create unique index if not exists appointments_source_id_idx
  on public.appointments(source_id)
  where source_id is not null;
create index if not exists appointments_client_id_idx on public.appointments(client_id);
create index if not exists appointments_property_id_idx on public.appointments(property_id);
create index if not exists appointments_start_at_idx on public.appointments(start_at desc);

update public.appointments appointment
set client_id = profile.id
from public.profiles profile
where appointment.client_id is null
  and appointment.client_email is not null
  and lower(appointment.client_email) = lower(profile.email);

alter table public.appointments enable row level security;

do $$
declare
  policy_name text;
begin
  for policy_name in
    select pol.polname
    from pg_policy pol
    where pol.polrelid = 'public.appointments'::regclass
  loop
    execute format('drop policy %I on public.appointments', policy_name);
  end loop;
end $$;

create policy appointments_participants_read
on public.appointments for select
to authenticated
using (
  public.is_admin_user()
  or client_id = (select auth.uid())
  or agent_id = (select auth.uid())
  or (
    client_id is null
    and lower(coalesce(client_email, '')) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  )
  or exists (
    select 1
    from public.properties property
    where property.id = appointments.property_id
      and property.owner_id = (select auth.uid())
  )
);

create policy appointments_client_insert
on public.appointments for insert
to authenticated
with check (
  client_id = (select auth.uid())
  and lower(coalesce(client_email, '')) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  and agent_id is null
  and status in ('PENDING', 'REQUESTED')
);

create policy appointments_client_cancel
on public.appointments for update
to authenticated
using (
  client_id = (select auth.uid())
  and status in ('PENDING', 'REQUESTED', 'CONFIRMED')
)
with check (
  client_id = (select auth.uid())
  and status in ('CANCELED', 'CANCELLED')
);

create policy appointments_client_feedback
on public.appointments for update
to authenticated
using (client_id = (select auth.uid()) and status in ('COMPLETED', 'DONE'))
with check (client_id = (select auth.uid()) and status in ('COMPLETED', 'DONE'));

create policy appointments_agent_update
on public.appointments for update
to authenticated
using (agent_id = (select auth.uid()))
with check (agent_id = (select auth.uid()));

create policy appointments_admin_manage
on public.appointments for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

revoke all on table public.appointments from anon, authenticated;
grant select, insert, delete on table public.appointments to authenticated;
grant update (status, notes, rating, feedback, would_proceed, confirmed_at, start_at, end_at, updated_at)
  on table public.appointments to authenticated;

-- ---------------------------------------------------------------------------
-- Logical document records. Files stay in the existing private Storage bucket.
-- ---------------------------------------------------------------------------

alter table public.client_documents
  alter column type set default 'other',
  add column if not exists appointment_id uuid references public.appointments(id) on delete cascade,
  add column if not exists property_id uuid references public.properties(id) on delete set null,
  add column if not exists template_id uuid references public.admin_document_templates(id) on delete set null,
  add column if not exists version integer not null default 1,
  add column if not exists visibility text not null default 'PRIVATE',
  add column if not exists locked_at timestamptz,
  add column if not exists signed_at timestamptz,
  add column if not exists signature_level text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.client_documents'::regclass
      and conname = 'client_documents_type_check'
  ) then
    alter table public.client_documents
      add constraint client_documents_type_check
      check (type in ('id_card', 'proof_of_income', 'vizionare_sign', 'rental_contract', 'other'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.client_documents'::regclass
      and conname = 'client_documents_status_check'
  ) then
    alter table public.client_documents
      add constraint client_documents_status_check
      check (status in (
        'DRAFT', 'PENDING', 'UPLOADED', 'READY_TO_SIGN', 'PARTIALLY_SIGNED',
        'SIGNED', 'DECLINED', 'APPROVED', 'REJECTED', 'EXPIRED', 'SUPERSEDED'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.client_documents'::regclass
      and conname = 'client_documents_visibility_check'
  ) then
    alter table public.client_documents
      add constraint client_documents_visibility_check
      check (visibility in ('PRIVATE', 'PARTICIPANTS', 'AGENT', 'OWNER'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.client_documents'::regclass
      and conname = 'client_documents_version_check'
  ) then
    alter table public.client_documents
      add constraint client_documents_version_check check (version > 0);
  end if;
end $$;

create index if not exists client_documents_appointment_id_idx
  on public.client_documents(appointment_id, created_at desc);
create index if not exists client_documents_property_id_idx
  on public.client_documents(property_id);
create unique index if not exists client_documents_storage_path_idx
  on public.client_documents(storage_bucket, storage_path)
  where storage_path is not null;

alter table public.client_documents enable row level security;

do $$
declare
  policy_name text;
begin
  for policy_name in
    select pol.polname
    from pg_policy pol
    where pol.polrelid = 'public.client_documents'::regclass
  loop
    execute format('drop policy %I on public.client_documents', policy_name);
  end loop;
end $$;

create policy client_documents_participants_read
on public.client_documents for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.is_admin_user()
  or (
    visibility in ('PARTICIPANTS', 'AGENT')
    and exists (
      select 1 from public.appointments appointment
      where appointment.id = client_documents.appointment_id
        and appointment.agent_id = (select auth.uid())
    )
  )
  or (
    visibility in ('PARTICIPANTS', 'OWNER')
    and exists (
      select 1
      from public.appointments appointment
      join public.properties property on property.id = appointment.property_id
      where appointment.id = client_documents.appointment_id
        and property.owner_id = (select auth.uid())
    )
  )
);

create policy client_documents_client_insert
on public.client_documents for insert
to authenticated
with check (
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
);

create policy client_documents_agent_insert
on public.client_documents for insert
to authenticated
with check (
  uploaded_by = (select auth.uid())::text
  and exists (
    select 1 from public.appointments appointment
    where appointment.id = client_documents.appointment_id
      and appointment.agent_id = (select auth.uid())
      and appointment.client_id = client_documents.user_id
  )
);

create policy client_documents_agent_update
on public.client_documents for update
to authenticated
using (
  locked_at is null
  and exists (
    select 1 from public.appointments appointment
    where appointment.id = client_documents.appointment_id
      and appointment.agent_id = (select auth.uid())
  )
)
with check (
  locked_at is null
  and exists (
    select 1 from public.appointments appointment
    where appointment.id = client_documents.appointment_id
      and appointment.agent_id = (select auth.uid())
  )
);

create policy client_documents_client_delete
on public.client_documents for delete
to authenticated
using (
  user_id = (select auth.uid())
  and locked_at is null
  and status in ('DRAFT', 'PENDING', 'UPLOADED', 'READY_TO_SIGN')
);

create policy client_documents_admin_manage
on public.client_documents for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

revoke all on table public.client_documents from anon, authenticated;
grant select, insert, update, delete on table public.client_documents to authenticated;

-- ---------------------------------------------------------------------------
-- Signers and immutable audit events.
-- ---------------------------------------------------------------------------

create table if not exists public.document_signers (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.client_documents(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  signer_role text not null,
  status text not null default 'PENDING',
  required boolean not null default true,
  signature_name text,
  signature_method text,
  consent_text text,
  document_checksum text,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint document_signers_role_check check (signer_role in ('CLIENT', 'OWNER', 'AGENT', 'ADMIN')),
  constraint document_signers_status_check check (status in ('PENDING', 'SIGNED', 'DECLINED')),
  constraint document_signers_method_check check (
    signature_method is null or signature_method in ('TYPED', 'EXTERNAL_PROVIDER')
  ),
  constraint document_signers_identity_unique unique (document_id, user_id, signer_role)
);

create index if not exists document_signers_user_id_idx
  on public.document_signers(user_id, status);
create index if not exists document_signers_document_id_idx
  on public.document_signers(document_id);

create table if not exists public.document_events (
  id bigint generated by default as identity primary key,
  document_id uuid not null references public.client_documents(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint document_events_type_check check (
    event_type in ('CREATED', 'UPLOADED', 'SENT_FOR_SIGNATURE', 'SIGNED', 'DECLINED', 'COMPLETED')
  )
);

create index if not exists document_events_document_id_idx
  on public.document_events(document_id, created_at desc);

alter table public.document_signers enable row level security;
alter table public.document_events enable row level security;

create policy document_signers_participants_read
on public.document_signers for select
to authenticated
using (
  user_id = (select auth.uid())
  or document_id in (select document.id from public.client_documents document)
);

create policy document_signers_sign_own
on public.document_signers for update
to authenticated
using (user_id = (select auth.uid()) and status = 'PENDING')
with check (user_id = (select auth.uid()) and status in ('SIGNED', 'DECLINED'));

create policy document_signers_admin_manage
on public.document_signers for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy document_events_participants_read
on public.document_events for select
to authenticated
using (document_id in (select document.id from public.client_documents document));

create policy document_events_admin_manage
on public.document_events for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

revoke all on table public.document_signers from anon, authenticated;
grant select on table public.document_signers to authenticated;
grant update (status, signature_name, signature_method, consent_text, signed_at, updated_at)
  on table public.document_signers to authenticated;

revoke all on table public.document_events from anon, authenticated;
grant select on table public.document_events to authenticated;
grant usage, select on sequence public.document_events_id_seq to authenticated;

-- Create the required signer list from trusted appointment relationships.
create or replace function private.create_document_signers()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  appointment_client_id uuid;
  appointment_agent_id uuid;
  property_owner_id uuid;
begin
  insert into public.document_events(document_id, actor_id, event_type, metadata)
  values (
    new.id,
    (select auth.uid()),
    case when new.storage_path is null then 'CREATED' else 'UPLOADED' end,
    jsonb_build_object('type', new.type, 'status', new.status, 'version', new.version, 'checksum', new.checksum)
  );

  if new.type not in ('vizionare_sign', 'rental_contract') then
    return new;
  end if;

  select appointment.client_id, appointment.agent_id, property.owner_id
  into appointment_client_id, appointment_agent_id, property_owner_id
  from public.appointments appointment
  left join public.properties property on property.id = appointment.property_id
  where appointment.id = new.appointment_id;

  appointment_client_id := coalesce(appointment_client_id, new.user_id);

  if appointment_client_id is not null then
    insert into public.document_signers(document_id, user_id, signer_role)
    values (new.id, appointment_client_id, 'CLIENT')
    on conflict (document_id, user_id, signer_role) do nothing;
  end if;

  if new.type = 'vizionare_sign' and appointment_agent_id is not null then
    insert into public.document_signers(document_id, user_id, signer_role)
    values (new.id, appointment_agent_id, 'AGENT')
    on conflict (document_id, user_id, signer_role) do nothing;
  end if;

  if new.type = 'rental_contract' and property_owner_id is not null then
    insert into public.document_signers(document_id, user_id, signer_role)
    values (new.id, property_owner_id, 'OWNER')
    on conflict (document_id, user_id, signer_role) do nothing;
  end if;

  insert into public.document_events(document_id, actor_id, event_type, metadata)
  values (
    new.id,
    (select auth.uid()),
    'SENT_FOR_SIGNATURE',
    jsonb_build_object('required_signers', (
      select count(*) from public.document_signers signer
      where signer.document_id = new.id and signer.required
    ))
  );

  return new;
end;
$$;

create or replace function private.prepare_document_signature()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  stored_checksum text;
begin
  if new.status = 'SIGNED' and old.status <> 'SIGNED' then
    if coalesce(length(trim(new.signature_name)), 0) < 3 then
      raise exception 'Signature name is required';
    end if;

    if coalesce(length(trim(new.consent_text)), 0) < 10 then
      raise exception 'Signature consent is required';
    end if;

    select document.checksum
    into stored_checksum
    from public.client_documents document
    where document.id = new.document_id
      and document.locked_at is null;

    if not found then
      raise exception 'Document is not available for signature';
    end if;

    new.signed_at := clock_timestamp();
    new.updated_at := clock_timestamp();
    new.signature_method := coalesce(new.signature_method, 'TYPED');
    new.document_checksum := stored_checksum;
  elsif new.status = 'DECLINED' and old.status <> 'DECLINED' then
    new.signed_at := null;
    new.updated_at := clock_timestamp();
  end if;

  return new;
end;
$$;

create or replace function private.finalize_document_signature()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  remaining_signers integer;
begin
  if new.status = old.status then
    return new;
  end if;

  insert into public.document_events(document_id, actor_id, event_type, metadata)
  values (
    new.document_id,
    new.user_id,
    case when new.status = 'SIGNED' then 'SIGNED' else 'DECLINED' end,
    jsonb_build_object(
      'signer_role', new.signer_role,
      'signature_method', new.signature_method,
      'document_checksum', new.document_checksum
    )
  );

  if new.status = 'DECLINED' then
    update public.client_documents
    set status = 'DECLINED', updated_at = clock_timestamp()
    where id = new.document_id and locked_at is null;
    return new;
  end if;

  select count(*)
  into remaining_signers
  from public.document_signers signer
  where signer.document_id = new.document_id
    and signer.required
    and signer.status <> 'SIGNED';

  if remaining_signers = 0 then
    update public.client_documents
    set status = 'SIGNED', signed_at = clock_timestamp(), locked_at = clock_timestamp(),
        signature_level = 'SIMPLE', updated_at = clock_timestamp()
    where id = new.document_id and locked_at is null;

    insert into public.document_events(document_id, actor_id, event_type, metadata)
    values (new.document_id, new.user_id, 'COMPLETED', jsonb_build_object('signature_level', 'SIMPLE'));
  else
    update public.client_documents
    set status = 'PARTIALLY_SIGNED', updated_at = clock_timestamp()
    where id = new.document_id and locked_at is null;
  end if;

  return new;
end;
$$;

drop trigger if exists create_document_signers_trigger on public.client_documents;
create trigger create_document_signers_trigger
after insert on public.client_documents
for each row execute function private.create_document_signers();

drop trigger if exists prepare_document_signature_trigger on public.document_signers;
create trigger prepare_document_signature_trigger
before update of status on public.document_signers
for each row execute function private.prepare_document_signature();

drop trigger if exists finalize_document_signature_trigger on public.document_signers;
create trigger finalize_document_signature_trigger
after update of status on public.document_signers
for each row execute function private.finalize_document_signature();

revoke all on function private.create_document_signers() from public, anon, authenticated;
revoke all on function private.prepare_document_signature() from public, anon, authenticated;
revoke all on function private.finalize_document_signature() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Reuse the existing version and template tables.
-- ---------------------------------------------------------------------------

alter table public.admin_document_versions
  add column if not exists storage_bucket text,
  add column if not exists storage_path text,
  add column if not exists mime_type text,
  add column if not exists byte_size bigint,
  add column if not exists checksum text;

create unique index if not exists admin_document_versions_document_version_idx
  on public.admin_document_versions(client_document_id, version)
  where client_document_id is not null;

create or replace function private.create_document_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.storage_path is null then
    return new;
  end if;

  insert into public.admin_document_versions(
    template_id, client_document_id, property_id, title, version, status,
    storage_bucket, storage_path, mime_type, byte_size, checksum, created_by, metadata
  ) values (
    new.template_id, new.id, new.property_id, new.title, new.version, new.status,
    new.storage_bucket, new.storage_path, new.mime_type, new.byte_size, new.checksum,
    coalesce(new.uploaded_by, new.user_id::text),
    jsonb_build_object('appointment_id', new.appointment_id, 'visibility', new.visibility)
  )
  on conflict (client_document_id, version) where client_document_id is not null do nothing;

  return new;
end;
$$;

drop trigger if exists create_document_version_trigger on public.client_documents;
create trigger create_document_version_trigger
after insert on public.client_documents
for each row execute function private.create_document_version();

revoke all on function private.create_document_version() from public, anon, authenticated;

drop policy if exists "owners read own document versions" on public.admin_document_versions;
create policy document_versions_participants_read
on public.admin_document_versions for select
to authenticated
using (
  client_document_id in (select document.id from public.client_documents document)
  and status in ('DRAFT', 'PENDING', 'UPLOADED', 'READY_TO_SIGN', 'PARTIALLY_SIGNED', 'SIGNED', 'APPROVED')
);

drop policy if exists document_templates_active_read on public.admin_document_templates;
create policy document_templates_active_read
on public.admin_document_templates for select
to authenticated
using (status = 'ACTIVE');

revoke all on table public.admin_document_templates from anon, authenticated;
grant select, insert, update, delete on table public.admin_document_templates to authenticated;

revoke all on table public.admin_document_versions from anon, authenticated;
grant select, insert, update, delete on table public.admin_document_versions to authenticated;

insert into public.admin_document_templates(name, type, body, required_fields, status, created_by)
select
  'Fisa de vizionare standard',
  'viewing_report',
  E'FISA DE VIZIONARE\n\nClient: {{client_name}}\nE-mail: {{client_email}}\nProprietate: {{property_title}}\nData: {{viewing_date}}\nInterval: {{viewing_time}}\nAgent: {{agent_name}}\n\nPrin semnare, clientul confirma efectuarea vizionarii la data si ora indicate si faptul ca informatiile de mai sus sunt corecte.\n\nObservatii:\n{{notes}}\n\nSemnatura electronica simpla si jurnalul de audit sunt pastrate separat de acest PDF.',
  '["client_name", "client_email", "property_title", "viewing_date", "viewing_time", "agent_name"]'::jsonb,
  'ACTIVE',
  'system'
where not exists (
  select 1 from public.admin_document_templates
  where type = 'viewing_report' and status = 'ACTIVE'
);

insert into public.admin_document_templates(name, type, body, required_fields, status, created_by)
select
  'Contract de inchiriere - model de lucru',
  'rental_contract',
  E'CONTRACT DE INCHIRIERE - MODEL DE LUCRU\n\nParti:\nPROPRIETAR: {{owner_name}}\nLOCATAR: {{client_name}} ({{client_email}})\n\nProprietate: {{property_title}}\nAdresa: {{property_address}}\n\nDurata, chiria, garantia, obligatiile partilor si conditiile de incetare se completeaza si se verifica de parti inainte de semnare.\n\nAcest model trebuie verificat juridic si completat cu toate clauzele aplicabile tranzactiei.\n\nSemnatura electronica simpla si jurnalul de audit sunt pastrate separat de acest PDF.',
  '["owner_name", "client_name", "client_email", "property_title", "property_address"]'::jsonb,
  'ACTIVE',
  'system'
where not exists (
  select 1 from public.admin_document_templates
  where type = 'rental_contract' and status = 'ACTIVE'
);

-- ---------------------------------------------------------------------------
-- Storage access follows the document table's RLS and files are immutable.
-- ---------------------------------------------------------------------------

drop policy if exists "client documents storage own files" on storage.objects;
drop policy if exists "client documents admin storage all" on storage.objects;

create policy client_documents_storage_insert
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'client-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy client_documents_storage_read
on storage.objects for select
to authenticated
using (
  bucket_id = 'client-documents'
  and exists (
    select 1 from public.client_documents document
    where document.storage_bucket = storage.objects.bucket_id
      and document.storage_path = storage.objects.name
  )
);

create policy client_documents_storage_delete
on storage.objects for delete
to authenticated
using (
  bucket_id = 'client-documents'
  and (
    public.is_admin_user()
    or (
      (storage.foldername(name))[1] = (select auth.uid())::text
      and (
        not exists (
          select 1 from public.client_documents document
          where document.storage_bucket = storage.objects.bucket_id
            and document.storage_path = storage.objects.name
        )
        or exists (
          select 1 from public.client_documents document
          where document.storage_bucket = storage.objects.bucket_id
            and document.storage_path = storage.objects.name
            and document.user_id = (select auth.uid())
            and document.locked_at is null
        )
      )
    )
  )
);

-- Remove an existing unauthenticated contract insertion path before the new
-- document workflow is used for production contracts.
drop policy if exists "contracts public insert" on public.listing_contracts;
revoke insert on table public.listing_contracts from anon;

-- Data API grants are explicit because new Supabase projects no longer expose
-- newly created public tables automatically.
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.document_signers to service_role;
grant select, insert, update, delete on table public.document_events to service_role;
grant usage, select on sequence public.document_events_id_seq to service_role;

comment on column public.client_documents.signature_level is
  'SIMPLE means an in-app acknowledgement with identity, timestamp and checksum; it is not a qualified eIDAS signature.';
