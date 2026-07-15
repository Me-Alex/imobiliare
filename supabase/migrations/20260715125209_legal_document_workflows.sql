-- Legally controlled document templates and evidence records for Romanian
-- real-estate workflows. Templates are intentionally delivered in
-- REVIEW_REQUIRED state: an administrator must record the legal reviewer
-- before a template can produce a signable document.

create schema if not exists private;
revoke all on schema private from public;

-- ---------------------------------------------------------------------------
-- Agency identity used on every generated legal document.
-- ---------------------------------------------------------------------------

create table if not exists public.agency_legal_profiles (
  id uuid primary key default gen_random_uuid(),
  is_current boolean not null default true,
  status text not null default 'INCOMPLETE',
  legal_name text not null default '',
  trade_name text not null default 'HQS Imobiliare',
  legal_form text not null default '',
  cui text not null default '',
  trade_registry_number text not null default '',
  registered_office text not null default '',
  correspondence_address text,
  email text not null default '',
  phone text not null default '',
  representative_name text not null default '',
  representative_capacity text not null default 'Administrator',
  iban text,
  bank_name text,
  privacy_notice_url text,
  privacy_notice_version text not null default '1.0',
  consumer_notice_version text not null default '1.0',
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agency_legal_profiles_status_check
    check (status in ('INCOMPLETE', 'ACTIVE', 'ARCHIVED')),
  constraint agency_legal_profiles_active_complete_check check (
    status <> 'ACTIVE'
    or (
      length(trim(legal_name)) >= 2
      and length(trim(cui)) >= 2
      and length(trim(trade_registry_number)) >= 2
      and length(trim(registered_office)) >= 5
      and position('@' in email) > 1
      and length(trim(phone)) >= 6
      and length(trim(representative_name)) >= 3
      and privacy_notice_url ~ '^https?://'
    )
  )
);

create unique index if not exists agency_legal_profiles_one_current_idx
  on public.agency_legal_profiles(is_current)
  where is_current;

alter table public.agency_legal_profiles enable row level security;

create policy agency_legal_profiles_read
on public.agency_legal_profiles for select
to authenticated
using (status = 'ACTIVE' or public.is_admin_user());

create policy agency_legal_profiles_admin_insert
on public.agency_legal_profiles for insert
to authenticated
with check (public.is_admin_user() and updated_by = (select auth.uid()));

create policy agency_legal_profiles_admin_update
on public.agency_legal_profiles for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user() and updated_by = (select auth.uid()));

create policy agency_legal_profiles_admin_delete
on public.agency_legal_profiles for delete
to authenticated
using (public.is_admin_user());

revoke all on table public.agency_legal_profiles from anon, authenticated;
grant select, insert, update, delete on table public.agency_legal_profiles to authenticated;

insert into public.agency_legal_profiles(is_current, status, trade_name)
select true, 'INCOMPLETE', 'HQS Imobiliare'
where not exists (select 1 from public.agency_legal_profiles where is_current);

-- ---------------------------------------------------------------------------
-- Template legal control, versioning and statutory metadata.
-- ---------------------------------------------------------------------------

alter table public.admin_document_templates
  add column if not exists version integer not null default 1,
  add column if not exists legal_version text,
  add column if not exists legal_basis jsonb not null default '[]'::jsonb,
  add column if not exists field_schema jsonb not null default '{}'::jsonb,
  add column if not exists signer_roles text[] not null default '{}'::text[],
  add column if not exists signature_requirement text not null default 'SIMPLE',
  add column if not exists consumer_withdrawal_required boolean not null default false,
  add column if not exists legal_review_status text not null default 'REVIEW_REQUIRED',
  add column if not exists legal_reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists legal_reviewer_name text,
  add column if not exists legal_reviewed_at timestamptz,
  add column if not exists effective_from date,
  add column if not exists effective_until date,
  add column if not exists supersedes_id uuid references public.admin_document_templates(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.admin_document_templates'::regclass
      and conname = 'admin_document_templates_version_check'
  ) then
    alter table public.admin_document_templates
      add constraint admin_document_templates_version_check check (version > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.admin_document_templates'::regclass
      and conname = 'admin_document_templates_signature_requirement_check'
  ) then
    alter table public.admin_document_templates
      add constraint admin_document_templates_signature_requirement_check
      check (signature_requirement in ('SIMPLE', 'ADVANCED_OR_QUALIFIED', 'QUALIFIED'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.admin_document_templates'::regclass
      and conname = 'admin_document_templates_review_status_check'
  ) then
    alter table public.admin_document_templates
      add constraint admin_document_templates_review_status_check
      check (legal_review_status in ('REVIEW_REQUIRED', 'APPROVED', 'REJECTED'));
  end if;
end $$;

create unique index if not exists admin_document_templates_legal_version_idx
  on public.admin_document_templates(type, legal_version)
  where legal_version is not null;

create or replace function private.validate_legal_template()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.legal_review_status = 'APPROVED' then
    if new.legal_reviewed_by is null
      or new.legal_reviewed_at is null
      or coalesce(length(trim(new.legal_reviewer_name)), 0) < 3
      or coalesce(length(trim(new.body)), 0) < 200
      or jsonb_array_length(new.required_fields) = 0
      or jsonb_array_length(new.legal_basis) = 0
      or coalesce(length(trim(new.legal_version)), 0) = 0
    then
      raise exception 'Approved templates require reviewer, legal basis, version and complete content';
    end if;
  end if;

  if new.effective_until is not null
    and new.effective_from is not null
    and new.effective_until < new.effective_from
  then
    raise exception 'Template effective interval is invalid';
  end if;

  new.updated_at := clock_timestamp();
  return new;
end;
$$;

drop trigger if exists validate_legal_template_trigger on public.admin_document_templates;
create trigger validate_legal_template_trigger
before insert or update on public.admin_document_templates
for each row execute function private.validate_legal_template();

revoke all on function private.validate_legal_template() from public, anon, authenticated;

-- Existing short templates remain in history, but cannot be selected for new
-- legal documents.
update public.admin_document_templates
set status = 'ARCHIVED', legal_review_status = 'REJECTED'
where type in ('viewing_report', 'rental_contract')
  and legal_version is null;

-- ---------------------------------------------------------------------------
-- Generated-document snapshots and immutable legal consent evidence.
-- ---------------------------------------------------------------------------

alter table public.client_documents
  add column if not exists template_name text,
  add column if not exists template_version integer,
  add column if not exists legal_version text,
  add column if not exists template_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists document_data jsonb not null default '{}'::jsonb,
  add column if not exists legal_basis_snapshot jsonb not null default '[]'::jsonb,
  add column if not exists signature_requirement text not null default 'SIMPLE',
  add column if not exists consumer_contract boolean not null default false,
  add column if not exists withdrawal_notice_version text,
  add column if not exists fiscal_registration_due_at date,
  add column if not exists retention_until date,
  add column if not exists jurisdiction text not null default 'RO';

alter table public.client_documents
  drop constraint if exists client_documents_type_check;

alter table public.client_documents
  add constraint client_documents_type_check check (type in (
    'id_card', 'proof_of_income', 'vizionare_sign', 'brokerage_contract',
    'owner_mandate', 'reservation_offer', 'rental_contract',
    'handover_protocol', 'addendum', 'termination_notice', 'other'
  ));

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.client_documents'::regclass
      and conname = 'client_documents_signature_requirement_check'
  ) then
    alter table public.client_documents
      add constraint client_documents_signature_requirement_check
      check (signature_requirement in ('SIMPLE', 'ADVANCED_OR_QUALIFIED', 'QUALIFIED'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.client_documents'::regclass
      and conname = 'client_documents_jurisdiction_check'
  ) then
    alter table public.client_documents
      add constraint client_documents_jurisdiction_check check (jurisdiction = 'RO');
  end if;
end $$;

alter table public.document_signers
  add column if not exists consent_version text,
  add column if not exists auth_assurance text not null default 'SUPABASE_SESSION',
  add column if not exists signature_evidence jsonb not null default '{}'::jsonb;

alter table public.document_signers
  drop constraint if exists document_signers_method_check;

alter table public.document_signers
  add constraint document_signers_method_check check (
    signature_method is null
    or signature_method in ('TYPED', 'ADVANCED', 'QUALIFIED', 'EXTERNAL_PROVIDER')
  );

grant update (
  status, signature_name, signature_method, consent_text, consent_version,
  signed_at, updated_at
) on table public.document_signers to authenticated;

alter table public.document_events
  drop constraint if exists document_events_type_check;

alter table public.document_events
  add constraint document_events_type_check check (event_type in (
    'CREATED', 'UPLOADED', 'GENERATED', 'VALIDATED', 'CONSENT_RECORDED',
    'APPROVED', 'SENT_FOR_SIGNATURE', 'SIGNED', 'DECLINED', 'COMPLETED',
    'SUPERSEDED', 'EXPIRED', 'EXTERNAL_SIGNATURE_ATTACHED'
  ));

create table if not exists public.legal_document_consents (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.client_documents(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete restrict,
  consent_type text not null,
  notice_version text not null,
  consent_text text not null,
  consent_text_sha256 text not null,
  accepted boolean not null,
  accepted_at timestamptz not null default now(),
  auth_assurance text not null default 'SUPABASE_SESSION',
  metadata jsonb not null default '{}'::jsonb,
  constraint legal_document_consents_type_check check (consent_type in (
    'DOCUMENT_CONTENT', 'PRIVACY_NOTICE', 'WITHDRAWAL_NOTICE',
    'IMMEDIATE_SERVICE_REQUEST', 'LOSS_OF_WITHDRAWAL_ACKNOWLEDGEMENT'
  )),
  constraint legal_document_consents_checksum_check
    check (consent_text_sha256 ~ '^[0-9a-f]{64}$'),
  constraint legal_document_consents_unique
    unique (document_id, user_id, consent_type, notice_version)
);

create index if not exists legal_document_consents_document_idx
  on public.legal_document_consents(document_id, accepted_at desc);
create index if not exists legal_document_consents_user_idx
  on public.legal_document_consents(user_id, accepted_at desc);

alter table public.legal_document_consents enable row level security;

create policy legal_document_consents_read
on public.legal_document_consents for select
to authenticated
using (
  user_id = (select auth.uid())
  or document_id in (select document.id from public.client_documents document)
);

create policy legal_document_consents_insert
on public.legal_document_consents for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and accepted
  and exists (
    select 1 from public.client_documents document
    where document.id = legal_document_consents.document_id
      and document.locked_at is null
  )
);

revoke all on table public.legal_document_consents from anon, authenticated;
grant select, insert on table public.legal_document_consents to authenticated;

create or replace function private.audit_legal_document_consent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.user_id <> (select auth.uid()) then
    raise exception 'Consent identity mismatch';
  end if;

  insert into public.document_events(document_id, actor_id, event_type, metadata)
  values (
    new.document_id,
    new.user_id,
    'CONSENT_RECORDED',
    jsonb_build_object(
      'consent_type', new.consent_type,
      'notice_version', new.notice_version,
      'consent_text_sha256', new.consent_text_sha256,
      'auth_assurance', new.auth_assurance
    )
  );
  return new;
end;
$$;

drop trigger if exists audit_legal_document_consent_trigger on public.legal_document_consents;
create trigger audit_legal_document_consent_trigger
after insert on public.legal_document_consents
for each row execute function private.audit_legal_document_consent();

revoke all on function private.audit_legal_document_consent() from public, anon, authenticated;

create or replace function private.validate_legal_document_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  template_record public.admin_document_templates%rowtype;
  required_key text;
  expected_document_type text;
begin
  if new.type not in (
    'vizionare_sign', 'brokerage_contract', 'owner_mandate',
    'reservation_offer', 'rental_contract', 'handover_protocol'
  ) then
    return new;
  end if;

  -- Manually uploaded files may be evidence attachments, but never become
  -- signable contracts without a controlled template snapshot.
  if new.template_id is null then
    if new.status not in ('DRAFT', 'UPLOADED') then
      raise exception 'Manual legal documents cannot enter the signing workflow';
    end if;
    return new;
  end if;

  select * into template_record
  from public.admin_document_templates template
  where template.id = new.template_id
    and template.status = 'ACTIVE';

  if not found then
    raise exception 'Legal template is missing or inactive';
  end if;

  expected_document_type := case template_record.type
    when 'viewing_report' then 'vizionare_sign'
    when 'brokerage_agreement' then 'brokerage_contract'
    when 'owner_mandate' then 'owner_mandate'
    when 'reservation_offer' then 'reservation_offer'
    when 'rental_contract' then 'rental_contract'
    when 'handover_protocol' then 'handover_protocol'
    else null
  end;

  if expected_document_type is null or new.type <> expected_document_type then
    raise exception 'Document type does not match its legal template';
  end if;

  if new.template_name is distinct from template_record.name
    or new.template_version is distinct from template_record.version
    or new.legal_version is distinct from template_record.legal_version
    or new.signature_requirement is distinct from template_record.signature_requirement
    or new.legal_basis_snapshot is distinct from template_record.legal_basis
    or new.template_snapshot ->> 'body' is distinct from template_record.body
  then
    raise exception 'Legal template snapshot does not match the approved source';
  end if;

  for required_key in
    select jsonb_array_elements_text(template_record.required_fields)
  loop
    if coalesce(length(trim(new.document_data ->> required_key)), 0) = 0 then
      raise exception 'Required legal field is missing: %', required_key;
    end if;
  end loop;

  perform 1
  from public.agency_legal_profiles agency
  where agency.is_current and agency.status = 'ACTIVE';
  if not found then
    raise exception 'The agency legal profile is incomplete';
  end if;

  if template_record.legal_review_status <> 'APPROVED' and new.status <> 'DRAFT' then
    raise exception 'Unreviewed legal templates can only create drafts';
  end if;

  if template_record.signature_requirement <> 'SIMPLE' and new.status <> 'DRAFT' then
    raise exception 'This document requires an external advanced or qualified signature workflow';
  end if;

  if template_record.legal_review_status = 'APPROVED'
    and template_record.signature_requirement = 'SIMPLE'
    and new.status not in ('DRAFT', 'READY_TO_SIGN')
  then
    raise exception 'Invalid initial status for a reviewed simple-signature document';
  end if;

  if new.type = 'rental_contract' and new.fiscal_registration_due_at is null then
    raise exception 'Rental contracts require a fiscal registration reminder';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_legal_document_insert_trigger on public.client_documents;
create trigger validate_legal_document_insert_trigger
before insert on public.client_documents
for each row execute function private.validate_legal_document_insert();

revoke all on function private.validate_legal_document_insert() from public, anon, authenticated;

create or replace function private.protect_legal_document_snapshot()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.template_id is not null and (
    new.template_id is distinct from old.template_id
    or new.template_name is distinct from old.template_name
    or new.template_version is distinct from old.template_version
    or new.legal_version is distinct from old.legal_version
    or new.template_snapshot is distinct from old.template_snapshot
    or new.document_data is distinct from old.document_data
    or new.legal_basis_snapshot is distinct from old.legal_basis_snapshot
    or new.signature_requirement is distinct from old.signature_requirement
    or new.consumer_contract is distinct from old.consumer_contract
    or new.withdrawal_notice_version is distinct from old.withdrawal_notice_version
    or new.jurisdiction is distinct from old.jurisdiction
    or new.checksum is distinct from old.checksum
    or new.storage_bucket is distinct from old.storage_bucket
    or new.storage_path is distinct from old.storage_path
  ) then
    raise exception 'Legal document snapshots are immutable; create a new version instead';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_legal_document_snapshot_trigger on public.client_documents;
create trigger protect_legal_document_snapshot_trigger
before update on public.client_documents
for each row execute function private.protect_legal_document_snapshot();

revoke all on function private.protect_legal_document_snapshot() from public, anon, authenticated;

-- Required signers are derived only from trusted appointment/property
-- relationships, never from JSON supplied by a browser.
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
    jsonb_build_object(
      'type', new.type,
      'status', new.status,
      'version', new.version,
      'checksum', new.checksum,
      'legal_version', new.legal_version,
      'signature_requirement', new.signature_requirement
    )
  );

  if new.type not in (
    'vizionare_sign', 'brokerage_contract', 'owner_mandate',
    'reservation_offer', 'rental_contract', 'handover_protocol'
  ) then
    return new;
  end if;

  select appointment.client_id, appointment.agent_id, property.owner_id
  into appointment_client_id, appointment_agent_id, property_owner_id
  from public.appointments appointment
  left join public.properties property on property.id = appointment.property_id
  where appointment.id = new.appointment_id;

  appointment_client_id := coalesce(appointment_client_id, new.user_id);

  if new.type in (
    'vizionare_sign', 'brokerage_contract', 'reservation_offer',
    'rental_contract', 'handover_protocol'
  ) and appointment_client_id is not null then
    insert into public.document_signers(document_id, user_id, signer_role)
    values (new.id, appointment_client_id, 'CLIENT')
    on conflict (document_id, user_id, signer_role) do nothing;
  end if;

  if new.type in ('vizionare_sign', 'brokerage_contract', 'owner_mandate')
    and appointment_agent_id is not null then
    insert into public.document_signers(document_id, user_id, signer_role)
    values (new.id, appointment_agent_id, 'AGENT')
    on conflict (document_id, user_id, signer_role) do nothing;
  end if;

  if new.type in (
    'owner_mandate', 'reservation_offer', 'rental_contract', 'handover_protocol'
  ) and property_owner_id is not null then
    insert into public.document_signers(document_id, user_id, signer_role)
    values (new.id, property_owner_id, 'OWNER')
    on conflict (document_id, user_id, signer_role) do nothing;
  end if;

  insert into public.document_events(document_id, actor_id, event_type, metadata)
  values (
    new.id,
    (select auth.uid()),
    case when new.status = 'READY_TO_SIGN' then 'SENT_FOR_SIGNATURE' else 'GENERATED' end,
    jsonb_build_object(
      'required_signers', (
        select count(*) from public.document_signers signer
        where signer.document_id = new.id and signer.required
      ),
      'legal_review_required', new.status = 'DRAFT'
    )
  );

  return new;
end;
$$;

revoke all on function private.create_document_signers() from public, anon, authenticated;

-- Typed signing is accepted only for templates explicitly configured for a
-- simple electronic signature. Contracts requiring stronger assurance must
-- return through the external-provider evidence path.
create or replace function private.prepare_document_signature()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  stored_checksum text;
  required_level text;
  document_status text;
begin
  if new.status = 'SIGNED' and old.status <> 'SIGNED' then
    if coalesce(length(trim(new.signature_name)), 0) < 3 then
      raise exception 'Signature name is required';
    end if;

    if coalesce(length(trim(new.consent_text)), 0) < 10 then
      raise exception 'Signature consent is required';
    end if;

    select document.checksum, document.signature_requirement, document.status
    into stored_checksum, required_level, document_status
    from public.client_documents document
    where document.id = new.document_id
      and document.locked_at is null;

    if not found or document_status not in ('READY_TO_SIGN', 'PARTIALLY_SIGNED') then
      raise exception 'Document is not available for signature';
    end if;

    new.signature_method := coalesce(new.signature_method, 'TYPED');
    if required_level <> 'SIMPLE'
      and new.signature_method not in ('ADVANCED', 'QUALIFIED', 'EXTERNAL_PROVIDER')
    then
      raise exception 'This document requires an advanced or qualified signature provider';
    end if;

    new.signed_at := clock_timestamp();
    new.updated_at := clock_timestamp();
    new.document_checksum := stored_checksum;
    new.auth_assurance := case
      when new.signature_method = 'QUALIFIED' then 'QUALIFIED_TRUST_SERVICE'
      when new.signature_method in ('ADVANCED', 'EXTERNAL_PROVIDER') then 'EXTERNAL_PROVIDER'
      else 'SUPABASE_SESSION'
    end;
  elsif new.status = 'DECLINED' and old.status <> 'DECLINED' then
    new.signed_at := null;
    new.updated_at := clock_timestamp();
  end if;

  return new;
end;
$$;

revoke all on function private.prepare_document_signature() from public, anon, authenticated;

create or replace function private.finalize_document_signature()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  remaining_signers integer;
  achieved_level text;
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
      'document_checksum', new.document_checksum,
      'auth_assurance', new.auth_assurance
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
    select case
      when bool_or(signer.signature_method = 'QUALIFIED') then 'QUALIFIED'
      when bool_or(signer.signature_method in ('ADVANCED', 'EXTERNAL_PROVIDER')) then 'ADVANCED'
      else 'SIMPLE'
    end
    into achieved_level
    from public.document_signers signer
    where signer.document_id = new.document_id and signer.required;

    update public.client_documents
    set status = 'SIGNED', signed_at = clock_timestamp(), locked_at = clock_timestamp(),
        signature_level = achieved_level, updated_at = clock_timestamp()
    where id = new.document_id and locked_at is null;

    insert into public.document_events(document_id, actor_id, event_type, metadata)
    values (
      new.document_id,
      new.user_id,
      'COMPLETED',
      jsonb_build_object('signature_level', achieved_level)
    );
  else
    update public.client_documents
    set status = 'PARTIALLY_SIGNED', updated_at = clock_timestamp()
    where id = new.document_id and locked_at is null;
  end if;

  return new;
end;
$$;

revoke all on function private.finalize_document_signature() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Romanian legal-document templates. They are detailed, statute-aware drafts,
-- but remain blocked from signing until a named legal reviewer approves them.
-- ---------------------------------------------------------------------------

insert into public.admin_document_templates(
  name, type, body, required_fields, status, created_by, version,
  legal_version, legal_basis, field_schema, signer_roles,
  signature_requirement, consumer_withdrawal_required,
  legal_review_status, effective_from
) values
(
  'Fișă de vizionare și confirmare de prezentare',
  'viewing_report',
  $template$
FIȘĂ DE VIZIONARE ȘI CONFIRMARE DE PREZENTARE

Versiune juridică: {{legal_version}}
Număr dosar: {{document_reference}}

1. IDENTIFICAREA AGENȚIEI
{{agency_legal_name}}, CUI {{agency_cui}}, nr. Registrul Comerțului {{agency_trade_registry}}, cu sediul în {{agency_registered_office}}, e-mail {{agency_email}}, telefon {{agency_phone}}, reprezentată de {{agency_representative}}, prin agentul {{agent_name}}.

2. IDENTIFICAREA CLIENTULUI
{{client_name}}, e-mail {{client_email}}, telefon {{client_phone}}, identificat(ă) cu {{client_id_document}}, domiciliat(ă) în {{client_address}}.

3. IMOBILUL PREZENTAT
Denumire/referință: {{property_title}} / {{property_reference}}
Adresă: {{property_address}}
Data și intervalul vizionării: {{viewing_date}}, {{viewing_time}}

4. OBIECTUL DOCUMENTULUI
Prezentul înscris confirmă exclusiv faptul material al prezentării și vizionării imobilului indicat. El nu transferă drepturi asupra imobilului, nu reprezintă ofertă de vânzare ori închiriere, promisiune, rezervare sau contract de intermediere și nu creează singur obligația de plată a unui comision. Orice servicii remunerate, valoarea comisionului, TVA-ul și momentul exigibilității sunt stabilite numai printr-un contract de intermediere distinct, acceptat expres de client.

5. DECLARAȚII
Clientul confirmă că datele vizionării sunt corecte și se obligă să nu fotografieze ori distribuie documente sau date personale observate în imobil fără acordul persoanelor îndreptățite. Agentul declară că informațiile comunicate provin din documentele și declarațiile puse la dispoziția agenției și că verificarea juridică finală se realizează de profesioniștii competenți înaintea tranzacției.

6. PROTECȚIA DATELOR
Datele sunt prelucrate pentru organizarea și dovedirea vizionării, gestionarea solicitării și apărarea drepturilor părților. Nota de informare aplicabilă este disponibilă la {{privacy_notice_url}}, versiunea {{privacy_notice_version}}. Datele nu sunt utilizate pentru marketing fără un temei juridic distinct.

7. OBSERVAȚII
{{notes}}

Semnat electronic la data înregistrată în jurnalul de audit. Tipul semnăturii și hash-ul exact al fișierului sunt consemnate separat în pachetul probator.
  $template$,
  '["agency_legal_name","agency_cui","agency_trade_registry","agency_registered_office","agency_email","agency_phone","agency_representative","client_name","client_email","client_phone","client_id_document","client_address","property_title","property_reference","property_address","viewing_date","viewing_time","agent_name","privacy_notice_url","privacy_notice_version"]'::jsonb,
  'ACTIVE', 'system', 1, 'RO-VIEWING-1.0',
  '[{"act":"Codul civil","articles":"1178-1179, 2096-2102"},{"act":"Regulamentul (UE) 2016/679","articles":"5, 6, 13"},{"act":"Legea 365/2002","articles":"7-9"}]'::jsonb,
  '{"schema_version":1,"source":"application"}'::jsonb,
  array['CLIENT','AGENT'], 'SIMPLE', false, 'REVIEW_REQUIRED', current_date
),
(
  'Contract de intermediere imobiliară – client',
  'brokerage_agreement',
  $template$
CONTRACT DE INTERMEDIERE IMOBILIARĂ – CLIENT

Versiune juridică: {{legal_version}} | Număr: {{document_reference}}

1. PĂRȚILE
INTERMEDIAR: {{agency_legal_name}}, CUI {{agency_cui}}, nr. Registrul Comerțului {{agency_trade_registry}}, sediul {{agency_registered_office}}, e-mail {{agency_email}}, telefon {{agency_phone}}, reprezentată de {{agency_representative}}, denumită „Agenția”.
BENEFICIAR: {{client_name}}, identificat(ă) cu {{client_id_document}}, domiciliul {{client_address}}, e-mail {{client_email}}, telefon {{client_phone}}, denumit(ă) „Clientul”.

2. OBIECTUL
Agenția se obligă să identifice și să prezinte oportunități, să faciliteze comunicarea și negocierea și să pună Clientul în legătură cu proprietarul ori reprezentantul acestuia pentru tranzacția de tip {{transaction_type}}. Proprietatea urmărită/referința: {{property_title}}, {{property_address}}, cod {{property_reference}}. Agenția nu garantează încheierea tranzacției și nu înlocuiește notarul, avocatul, expertul tehnic, evaluatorul ori consultantul fiscal.

3. DURATA ȘI CARACTERUL CONTRACTULUI
Contractul se încheie de la {{contract_start_date}} până la {{contract_end_date}} și este {{exclusivity_type}}. Prelungirea se realizează numai prin acord expres, pe suport durabil.

4. SERVICIILE AGENȚIEI
Agenția organizează vizionări, comunică informațiile disponibile, transmite ofertele, facilitează negocierea și, la cerere, coordonează accesul la profesioniști autorizați. Agenția informează fără întârziere Clientul despre împrejurările relevante cunoscute care pot influența tranzacția.

5. COMISIONUL ȘI EXIGIBILITATEA
Comisionul este {{commission_value}} {{commission_unit}}, la care {{vat_treatment}}. Valoarea estimată/explicată Clientului: {{commission_example}}. Comisionul devine datorat numai la {{commission_due_event}}, dacă tranzacția rezultă din intermedierea dovedită a Agenției. Termenul de plată este {{commission_payment_term}}. Nu se datorează alte taxe decât cele descrise expres în prezentul contract sau acceptate ulterior în scris.

6. OBLIGAȚIILE CLIENTULUI
Clientul furnizează date corecte, comunică existența reprezentării de către alt intermediar și informează Agenția dacă negociază ori încheie tranzacția privind o proprietate prezentată. Orice clauză de protecție a intermedierii operează numai pentru proprietățile identificate în anexă, pentru perioada {{protection_period}}, și nu împiedică libertatea Clientului de a refuza tranzacția.

7. VERIFICAREA IMOBILULUI
Înaintea asumării obligației de cumpărare/închiriere, Clientul va verifica titlul, sarcinile, situația cadastrală și fiscală, autorizațiile, starea tehnică, costurile și regulile asociației, cu profesioniștii competenți. Informațiile comerciale comunicate de Agenție nu înlocuiesc aceste verificări.

8. CONTRACT LA DISTANȚĂ/ÎN AFARA SEDIULUI
Dacă Clientul este consumator și contractul este încheiat la distanță sau în afara spațiilor comerciale, acesta primește informarea privind dreptul de retragere de 14 zile. Începerea serviciilor în această perioadă are loc numai la cererea expresă a Clientului. În cazul retragerii după începerea solicitată a serviciilor, poate fi datorată numai suma proporțională legală. Pierderea dreptului de retragere după executarea completă operează numai în condițiile legii și ale acordului expres consemnat separat.

9. ÎNCETARE, RĂSPUNDERE ȘI LITIGII
Contractul încetează la termen, prin acord, retragere legală, denunțare cu preaviz de {{termination_notice}} sau reziliere pentru neexecutare culpabilă după notificare și termen rezonabil de remediere. Răspunderea fiecărei părți este limitată la prejudiciul direct dovedit, fără excluderea răspunderii care nu poate fi limitată prin lege. Părțile încearcă soluționarea amiabilă; consumatorul poate utiliza mecanismele legale și instanțele competente.

10. DATE PERSONALE ȘI COMUNICĂRI
Nota de informare: {{privacy_notice_url}}, versiunea {{privacy_notice_version}}. Comunicările contractuale se transmit la adresele de e-mail declarate și se confirmă pe un suport care poate fi stocat și reprodus.

11. DISPOZIȚII FINALE
Anexele privind proprietățile prezentate, informarea precontractuală și consimțămintele fac parte din contract. Modificările se fac prin act adițional. Clientul confirmă că a putut citi clauzele înainte de acceptare și a primit o copie durabilă.
  $template$,
  '["agency_legal_name","agency_cui","agency_trade_registry","agency_registered_office","agency_email","agency_phone","agency_representative","client_name","client_id_document","client_address","client_email","client_phone","transaction_type","property_title","property_address","property_reference","contract_start_date","contract_end_date","exclusivity_type","commission_value","commission_unit","vat_treatment","commission_example","commission_due_event","commission_payment_term","protection_period","termination_notice","privacy_notice_url","privacy_notice_version"]'::jsonb,
  'ACTIVE', 'system', 1, 'RO-BROKERAGE-CLIENT-1.0',
  '[{"act":"Codul civil","articles":"2096-2102"},{"act":"OUG 34/2014","articles":"6-16"},{"act":"OG 21/1992","articles":"9-10"},{"act":"Legea 193/2000","articles":"1-4"},{"act":"Legea 365/2002","articles":"7-9"}]'::jsonb,
  '{"schema_version":1,"source":"application"}'::jsonb,
  array['CLIENT','AGENT'], 'ADVANCED_OR_QUALIFIED', true, 'REVIEW_REQUIRED', current_date
),
(
  'Mandat de reprezentare a proprietarului',
  'owner_mandate',
  $template$
CONTRACT DE INTERMEDIERE ȘI MANDAT DE REPREZENTARE – PROPRIETAR

Versiune juridică: {{legal_version}} | Număr: {{document_reference}}

1. PĂRȚILE
AGENȚIA: {{agency_legal_name}}, CUI {{agency_cui}}, nr. Registrul Comerțului {{agency_trade_registry}}, sediul {{agency_registered_office}}, e-mail {{agency_email}}, telefon {{agency_phone}}, reprezentată de {{agency_representative}}.
PROPRIETAR/MANDANT: {{owner_name}}, identificat(ă) cu {{owner_id_document}}, domiciliul/sediul {{owner_address}}, e-mail {{owner_email}}, telefon {{owner_phone}}.

2. IMOBILUL ȘI TITLUL DECLARAT
Imobil: {{property_title}}, adresa {{property_address}}, nr. cadastral/CF {{property_cadastral}}, dobândit/deținut în baza {{ownership_title}}. Proprietarul declară că informațiile și documentele furnizate sunt complete și comunică sarcinile, litigiile, coproprietarii, drepturile terților și limitările cunoscute: {{property_encumbrances}}.

3. MANDATUL
Proprietarul împuternicește Agenția să promoveze imobilul, să răspundă solicitărilor, să organizeze vizionări și să transmită oferte pentru {{transaction_type}}. Mandatul nu include dreptul de a semna în numele Proprietarului contractul de vânzare, închiriere, promisiunea ori acceptarea unei oferte și nu permite încasarea sumelor decât prin împuternicire specială separată.

4. PREȚ, DURATĂ ȘI EXCLUSIVITATE
Preț/chirie solicitat(ă): {{asking_price}} {{currency}}. Contractul este {{exclusivity_type}}, valabil între {{contract_start_date}} și {{contract_end_date}}. Canalele de promovare aprobate: {{marketing_channels}}. Utilizarea fotografiilor, planurilor și descrierilor se face numai pentru executarea prezentului mandat și pe durata acestuia.

5. COMISION
Comision: {{commission_value}} {{commission_unit}}, {{vat_treatment}}, datorat la {{commission_due_event}} și plătibil în {{commission_payment_term}}. Exemplul valoric comunicat: {{commission_example}}. Orice cheltuială suplimentară necesită aprobarea scrisă prealabilă a Proprietarului.

6. OBLIGAȚII
Agenția păstrează confidențialitatea, informează Proprietarul despre activitate și transmite ofertele fără alterare. Proprietarul permite accesul convenit, menține informațiile actualizate, prezintă actele necesare și nu ascunde defecte ori situații juridice relevante. Proprietarul decide liber acceptarea sau refuzarea oricărei oferte.

7. DREPTURILE CONSUMATORULUI
Dacă Proprietarul este consumator și contractul este încheiat la distanță sau în afara sediului, se aplică informarea și dreptul legal de retragere. Cererea de începere imediată a promovării și eventuala confirmare privind pierderea dreptului după executarea completă sunt consimțăminte distincte, înregistrate în jurnal.

8. ÎNCETARE ȘI PREDAREA MATERIALELOR
Încetarea se poate produce la termen, prin acord, retragere legală, denunțare cu preaviz {{termination_notice}} sau reziliere pentru neexecutare. La încetare, Agenția oprește promovarea într-un termen rezonabil și restituie cheile/documentele originale pe bază de proces-verbal. Perioada de protecție, dacă este convenită, este {{protection_period}} și privește exclusiv persoanele identificate în rapoartele de vizionare.

9. DATE PERSONALE, LITIGII, EXEMPLARE
Informarea GDPR: {{privacy_notice_url}}, versiunea {{privacy_notice_version}}. Părțile încearcă soluționarea amiabilă, fără a limita drepturile consumatorului sau competența legală. Contractul și anexele sunt transmise pe suport durabil fiecărei părți.
  $template$,
  '["agency_legal_name","agency_cui","agency_trade_registry","agency_registered_office","agency_email","agency_phone","agency_representative","owner_name","owner_id_document","owner_address","owner_email","owner_phone","property_title","property_address","property_cadastral","ownership_title","property_encumbrances","transaction_type","asking_price","currency","exclusivity_type","contract_start_date","contract_end_date","marketing_channels","commission_value","commission_unit","vat_treatment","commission_due_event","commission_payment_term","commission_example","termination_notice","protection_period","privacy_notice_url","privacy_notice_version"]'::jsonb,
  'ACTIVE', 'system', 1, 'RO-OWNER-MANDATE-1.0',
  '[{"act":"Codul civil","articles":"2009-2071, 2096-2102"},{"act":"OUG 34/2014","articles":"6-16"},{"act":"OG 21/1992","articles":"9-10"},{"act":"Regulamentul (UE) 2016/679","articles":"5, 6, 13"}]'::jsonb,
  '{"schema_version":1,"source":"application"}'::jsonb,
  array['OWNER','AGENT'], 'ADVANCED_OR_QUALIFIED', true, 'REVIEW_REQUIRED', current_date
),
(
  'Ofertă și acord de rezervare',
  'reservation_offer',
  $template$
OFERTĂ ȘI ACORD DE REZERVARE

Versiune juridică: {{legal_version}} | Număr: {{document_reference}}

1. PĂRȚILE ȘI IMOBILUL
OFERTANT: {{client_name}}, identificat(ă) cu {{client_id_document}}, domiciliul {{client_address}}, e-mail {{client_email}}, telefon {{client_phone}}.
PROPRIETAR/DESTINATAR: {{owner_name}}, identificat(ă) cu {{owner_id_document}}, domiciliul {{owner_address}}, e-mail {{owner_email}}, telefon {{owner_phone}}.
IMOBIL: {{property_title}}, {{property_address}}, nr. cadastral/CF {{property_cadastral}}.

2. OFERTA
Ofertantul propune prețul/chiria de {{offered_price}} {{currency}}, în următoarele condiții esențiale: {{offer_conditions}}. Oferta este valabilă până la {{offer_valid_until}} și poate fi acceptată numai expres, integral și în termen. O modificare reprezintă contraofertă.

3. REZERVAREA ȘI SUMA
Suma de rezervare este {{reservation_amount}} {{currency}}, plătită prin {{reservation_payment_method}} și păstrată de {{reservation_holder}}. Natura juridică și destinația sumei: {{reservation_legal_nature}}. Suma se restituie integral în cazurile: {{refund_conditions}}. Suma poate fi reținută/compensată numai în cazurile expres descrise și permise de lege: {{retention_conditions}}. Nicio sumă nu se încasează de Agenție fără drept și document justificativ.

4. CONDIȚII PREALABILE
Continuarea tranzacției este condiționată de verificarea titlului și sarcinilor, documentelor cadastrale și fiscale, situației tehnice, finanțării și, după caz, aprobărilor necesare. Termen pentru verificări: {{due_diligence_deadline}}. Profesionistul desemnat/notarul: {{notary_or_lawyer}}.

5. EFECTE ȘI LIMITĂRI
Prezentul document nu transferă proprietatea și nu înlocuiește contractul autentic sau promisiunea pentru care legea ori părțile solicită altă formă. Agenția facilitează comunicarea, dar nu garantează finalizarea și nu poate accepta oferta în numele proprietarului fără procură specială.

6. ÎNCETARE ȘI LITIGII
Rezervarea încetează la {{reservation_end_event}}. Părțile vor documenta restituirea sau imputarea sumei. Orice neînțelegere se încearcă a fi soluționată amiabil, apoi de instanța competentă, fără limitarea drepturilor consumatorului.

7. DATE ȘI COPII
Informarea GDPR aplicabilă: {{privacy_notice_url}}, versiunea {{privacy_notice_version}}. Fiecare parte primește documentul și anexele pe suport durabil.
  $template$,
  '["client_name","client_id_document","client_address","client_email","client_phone","owner_name","owner_id_document","owner_address","owner_email","owner_phone","property_title","property_address","property_cadastral","offered_price","currency","offer_conditions","offer_valid_until","reservation_amount","reservation_payment_method","reservation_holder","reservation_legal_nature","refund_conditions","retention_conditions","due_diligence_deadline","notary_or_lawyer","reservation_end_event","privacy_notice_url","privacy_notice_version"]'::jsonb,
  'ACTIVE', 'system', 1, 'RO-RESERVATION-1.0',
  '[{"act":"Codul civil","articles":"1166-1323, 1669"},{"act":"OG 21/1992","articles":"9-10"},{"act":"Legea 193/2000","articles":"1-4"}]'::jsonb,
  '{"schema_version":1,"source":"application"}'::jsonb,
  array['CLIENT','OWNER'], 'ADVANCED_OR_QUALIFIED', false, 'REVIEW_REQUIRED', current_date
),
(
  'Contract de închiriere locuință',
  'rental_contract',
  $template$
CONTRACT DE ÎNCHIRIERE A LOCUINȚEI

Versiune juridică: {{legal_version}} | Număr: {{document_reference}}

1. PĂRȚILE
LOCATOR: {{owner_name}}, identificat(ă) cu {{owner_id_document}}, domiciliul {{owner_address}}, e-mail {{owner_email}}, telefon {{owner_phone}}, cont de plată {{owner_payment_account}}.
LOCATAR: {{client_name}}, identificat(ă) cu {{client_id_document}}, domiciliul {{client_address}}, e-mail {{client_email}}, telefon {{client_phone}}.

2. OBIECTUL ȘI DREPTUL LOCATORULUI
Locatorul dă în folosință Locatarului imobilul situat în {{property_address}}, descris ca {{property_description}}, nr. cadastral/CF {{property_cadastral}}, împreună cu bunurile din inventarul anexat. Locatorul declară că are dreptul de a închiria în baza {{ownership_title}} și comunică limitările/sarcinile relevante: {{property_encumbrances}}.

3. DESTINAȚIA ȘI PERSOANELE CARE LOCUIESC
Destinația este exclusiv {{rental_purpose}}. Persoane acceptate: {{occupants}}. Schimbarea destinației, cesiunea sau subînchirierea se realizează numai în condițiile legii și cu acordul prealabil scris al Locatorului. Reguli convenite privind animalele de companie: {{pets_policy}}.

4. DURATA ȘI PREDAREA
Durata este de la {{lease_start_date}} până la {{lease_end_date}}. Predarea se face la {{handover_date}}, prin proces-verbal cu starea imobilului, inventar, fotografii, contoare și chei. Prelungirea necesită acord expres sau operează în condițiile legii.

5. CHIRIA
Chiria este {{rent_amount}} {{currency}} pe lună, scadentă în ziua {{rent_due_day}}, plătibilă prin {{rent_payment_method}} în contul/locul indicat. Cursul aplicabil, dacă plata se exprimă în valută și se execută în lei: {{exchange_rate_rule}}. Modificarea chiriei se face numai prin acord scris sau mecanismul clar: {{rent_adjustment_rule}}.

6. GARANȚIA
Garanția este {{deposit_amount}} {{currency}}. Ea garantează obligațiile dovedite, nu înlocuiește automat ultima chirie și se restituie în termen de {{deposit_return_term}} de la predarea finală, minus sumele certe, exigibile și documentate pentru chirie/utilități restante ori prejudicii peste uzura normală. Locatorul transmite justificarea reținerilor și restituie diferența.

7. UTILITĂȚI ȘI CHELTUIELI
Locatarul suportă: {{tenant_costs}}. Locatorul suportă: {{landlord_costs}}. Indexurile inițiale sunt consemnate în procesul-verbal. Părțile transmit documentele de plată și regularizează sumele la încetare.

8. OBLIGAȚIILE LOCATORULUI
Locatorul predă imobilul în stare corespunzătoare folosinței, asigură folosința liniștită, efectuează reparațiile care îi revin potrivit legii și informează despre vicii și riscuri cunoscute. Accesul pentru verificări/reparații se face cu preaviz de {{inspection_notice}}, la ore rezonabile, exceptând urgențele reale.

9. OBLIGAȚIILE LOCATARULUI
Locatarul plătește la termen, folosește prudent imobilul, respectă regulile condominiului, notifică prompt defecțiunile, permite reparațiile necesare și restituie imobilul la încetare, ținând cont de uzura normală. Modificările constructive și schimbarea yalei se fac numai cu acord, cu excepția măsurilor urgente de siguranță comunicate Locatorului.

10. REPARAȚII, VICII ȘI RĂSPUNDERE
Reparațiile de întreținere curentă rezultate din folosirea obișnuită revin Locatarului în limitele legii; reparațiile necesare menținerii imobilului în stare de folosință revin Locatorului, dacă deteriorarea nu este imputabilă Locatarului. Partea care constată o problemă notifică și oferă un termen rezonabil de remediere.

11. ÎNCETAREA
Contractul încetează la termen, prin acord, denunțare în condițiile legii cu preaviz {{termination_notice}}, imposibilitate de folosință sau reziliere pentru neexecutare semnificativă după notificare și termen de remediere, când legea nu permite încetarea imediată. Evacuarea și recuperarea sumelor se realizează numai prin procedurile legale; nicio clauză nu autorizează autoevacuarea, întreruperea abuzivă a utilităților ori confiscarea bunurilor.

12. NOTIFICĂRI, DATE ȘI ÎNREGISTRARE FISCALĂ
Notificările se transmit la datele declarate și se confirmă pe suport durabil. Datele sunt prelucrate pentru executarea și apărarea contractului; informarea: {{privacy_notice_url}}, versiunea {{privacy_notice_version}}. Partea căreia îi revine obligația fiscală va înregistra contractul și modificările în termenul legal aplicabil; termen orientativ calculat de platformă: {{fiscal_registration_due_date}}.

13. DISPOZIȚII FINALE
Procesul-verbal de predare-primire, inventarul, fotografiile acceptate și actele adiționale fac parte din contract. Clauzele se interpretează potrivit legii române, fără a elimina drepturile imperative. Fiecare parte primește o copie integrală și verificabilă.
  $template$,
  '["owner_name","owner_id_document","owner_address","owner_email","owner_phone","owner_payment_account","client_name","client_id_document","client_address","client_email","client_phone","property_address","property_description","property_cadastral","ownership_title","property_encumbrances","rental_purpose","occupants","pets_policy","lease_start_date","lease_end_date","handover_date","rent_amount","currency","rent_due_day","rent_payment_method","exchange_rate_rule","rent_adjustment_rule","deposit_amount","deposit_return_term","tenant_costs","landlord_costs","inspection_notice","termination_notice","privacy_notice_url","privacy_notice_version","fiscal_registration_due_date"]'::jsonb,
  'ACTIVE', 'system', 1, 'RO-LEASE-1.0',
  '[{"act":"Codul civil","articles":"1777-1835"},{"act":"Codul fiscal","articles":"83 alin. (6), 120 alin. (6^1)"},{"act":"Ordinul ANAF 114/2019, modificat prin Ordinul 161/2025","articles":"procedura de înregistrare"},{"act":"Legea 365/2002","articles":"7-10"}]'::jsonb,
  '{"schema_version":1,"source":"application"}'::jsonb,
  array['CLIENT','OWNER'], 'ADVANCED_OR_QUALIFIED', false, 'REVIEW_REQUIRED', current_date
),
(
  'Proces-verbal de predare-primire și inventar',
  'handover_protocol',
  $template$
PROCES-VERBAL DE PREDARE-PRIMIRE ȘI INVENTAR

Versiune juridică: {{legal_version}} | Număr: {{document_reference}}
Anexă la contractul din {{rental_contract_date}}

1. PĂRȚILE ȘI IMOBILUL
PREDĂTOR/LOCATOR: {{owner_name}}, identificat(ă) cu {{owner_id_document}}.
PRIMITOR/LOCATAR: {{client_name}}, identificat(ă) cu {{client_id_document}}.
IMOBIL: {{property_address}}, nr. cadastral/CF {{property_cadastral}}.
Predarea are loc la {{handover_date_time}}.

2. STAREA IMOBILULUI
Starea generală, finisaje și instalații: {{property_condition}}.
Defecte, urme de uzură și lucrări restante constatate împreună: {{existing_defects}}.
Fotografiile acceptate sunt identificate prin: {{photo_evidence_reference}}.

3. CONTOARE
Electricitate – serie/index: {{electricity_meter}}
Gaz – serie/index: {{gas_meter}}
Apă rece – serie/index: {{cold_water_meter}}
Apă caldă – serie/index: {{hot_water_meter}}
Energie termică/alte contoare: {{other_meters}}

4. CHEI ȘI MIJLOACE DE ACCES
Se predau: {{keys_and_access_devices}}. Duplicatele rămase și persoanele care le dețin: {{remaining_key_holders}}.

5. INVENTAR
{{inventory}}

6. DOCUMENTE ȘI SUME
Documente/manuale predate: {{delivered_documents}}.
Chirie/garanție/sume confirmate la predare: {{handover_payments}}. Confirmarea plății nu înlocuiește documentul fiscal sau bancar aplicabil.

7. DECLARAȚII FINALE
Părțile au verificat împreună elementele de mai sus. Mențiunile din prezentul proces-verbal constituie reper pentru evaluarea stării la restituire, cu luarea în considerare a uzurii normale. Orice completare ulterioară se face prin anexă datată și acceptată de ambele părți.

Observații: {{notes}}
  $template$,
  '["rental_contract_date","owner_name","owner_id_document","client_name","client_id_document","property_address","property_cadastral","handover_date_time","property_condition","existing_defects","photo_evidence_reference","electricity_meter","gas_meter","cold_water_meter","hot_water_meter","other_meters","keys_and_access_devices","remaining_key_holders","inventory","delivered_documents","handover_payments"]'::jsonb,
  'ACTIVE', 'system', 1, 'RO-HANDOVER-1.0',
  '[{"act":"Codul civil","articles":"1786-1804"},{"act":"Legea 365/2002","articles":"7-10"}]'::jsonb,
  '{"schema_version":1,"source":"application"}'::jsonb,
  array['CLIENT','OWNER'], 'ADVANCED_OR_QUALIFIED', false, 'REVIEW_REQUIRED', current_date
)
on conflict (type, legal_version) where legal_version is not null do update
set
  name = excluded.name,
  body = excluded.body,
  required_fields = excluded.required_fields,
  legal_basis = excluded.legal_basis,
  field_schema = excluded.field_schema,
  signer_roles = excluded.signer_roles,
  signature_requirement = excluded.signature_requirement,
  consumer_withdrawal_required = excluded.consumer_withdrawal_required,
  status = 'ACTIVE',
  updated_at = clock_timestamp();
