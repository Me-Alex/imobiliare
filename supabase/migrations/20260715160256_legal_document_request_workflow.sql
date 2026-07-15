-- Participant intake is deliberately separate from the controlled legal
-- document. Clients and owners submit facts; only the assigned agent or an
-- administrator can turn those facts into a generated legal document.

create table if not exists public.legal_document_requests (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete restrict,
  document_kind text not null,
  status text not null default 'REQUESTED',
  submitted_data jsonb not null default '{}'::jsonb,
  notes text,
  staff_note text,
  fulfilled_document_id uuid references public.client_documents(id) on delete set null,
  handled_by uuid references public.profiles(id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint legal_document_requests_kind_check check (document_kind in (
    'brokerage_agreement', 'owner_mandate', 'reservation_offer',
    'rental_contract', 'handover_protocol'
  )),
  constraint legal_document_requests_status_check check (status in (
    'REQUESTED', 'IN_REVIEW', 'NEEDS_INFO', 'FULFILLED', 'CANCELLED', 'REJECTED'
  )),
  constraint legal_document_requests_data_object_check
    check (jsonb_typeof(submitted_data) = 'object'),
  constraint legal_document_requests_notes_length_check
    check (notes is null or length(notes) <= 2000),
  constraint legal_document_requests_staff_note_length_check
    check (staff_note is null or length(staff_note) <= 2000),
  constraint legal_document_requests_fulfilled_check check (
    (status = 'FULFILLED' and fulfilled_document_id is not null and handled_by is not null and handled_at is not null)
    or (status <> 'FULFILLED' and fulfilled_document_id is null)
  )
);

create unique index if not exists legal_document_requests_one_active_idx
  on public.legal_document_requests(appointment_id, requester_id, document_kind)
  where status in ('REQUESTED', 'IN_REVIEW', 'NEEDS_INFO');

create index if not exists legal_document_requests_appointment_created_idx
  on public.legal_document_requests(appointment_id, created_at desc);
create index if not exists legal_document_requests_requester_created_idx
  on public.legal_document_requests(requester_id, created_at desc);
create index if not exists legal_document_requests_handler_idx
  on public.legal_document_requests(handled_by, updated_at desc)
  where handled_by is not null;

alter table public.legal_document_requests enable row level security;

create policy legal_document_requests_read
on public.legal_document_requests for select
to authenticated
using (
  requester_id = (select auth.uid())
  or (select public.is_admin_user())
  or (
    (select public.is_agent_user())
    and exists (
      select 1
      from public.appointments appointment
      where appointment.id = legal_document_requests.appointment_id
        and appointment.agent_id = (select auth.uid())
    )
  )
);

create policy legal_document_requests_insert
on public.legal_document_requests for insert
to authenticated
with check (
  requester_id = (select auth.uid())
  and status = 'REQUESTED'
  and fulfilled_document_id is null
  and handled_by is null
  and handled_at is null
  and (
    (
      document_kind in ('brokerage_agreement', 'reservation_offer', 'rental_contract')
      and exists (
        select 1
        from public.appointments appointment
        where appointment.id = legal_document_requests.appointment_id
          and appointment.client_id = (select auth.uid())
      )
    )
    or (
      document_kind in ('owner_mandate', 'reservation_offer', 'rental_contract', 'handover_protocol')
      and exists (
        select 1
        from public.appointments appointment
        join public.properties property on property.id = appointment.property_id
        where appointment.id = legal_document_requests.appointment_id
          and property.owner_id = (select auth.uid())
      )
    )
  )
);

create policy legal_document_requests_update
on public.legal_document_requests for update
to authenticated
using (
  requester_id = (select auth.uid())
  or (select public.is_admin_user())
  or (
    (select public.is_agent_user())
    and exists (
      select 1
      from public.appointments appointment
      where appointment.id = legal_document_requests.appointment_id
        and appointment.agent_id = (select auth.uid())
    )
  )
)
with check (
  requester_id = (select auth.uid())
  or (select public.is_admin_user())
  or (
    (select public.is_agent_user())
    and exists (
      select 1
      from public.appointments appointment
      where appointment.id = legal_document_requests.appointment_id
        and appointment.agent_id = (select auth.uid())
    )
  )
);

revoke all on table public.legal_document_requests from anon, authenticated;
grant select, insert, update on table public.legal_document_requests to authenticated;

create or replace function private.enforce_legal_document_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  is_service boolean := coalesce(current_setting('role', true), '') in ('postgres', 'service_role');
  is_admin boolean := false;
  is_assigned_agent boolean := false;
  requester_is_allowed boolean := false;
  expected_document_type text;
begin
  if is_service then
    new.updated_at := clock_timestamp();
    return new;
  end if;

  if actor is null then
    raise exception 'Authentication is required for document requests';
  end if;

  is_admin := public.is_admin_user();
  select exists (
    select 1
    from public.appointments appointment
    where appointment.id = new.appointment_id
      and appointment.agent_id = actor
  ) and public.is_agent_user()
  into is_assigned_agent;

  if tg_op = 'INSERT' then
    if new.requester_id is distinct from actor then
      raise exception 'A participant can submit only their own document data';
    end if;

    select exists (
      select 1
      from public.appointments appointment
      left join public.properties property on property.id = appointment.property_id
      where appointment.id = new.appointment_id
        and (
          (
            appointment.client_id = actor
            and new.document_kind in ('brokerage_agreement', 'reservation_offer', 'rental_contract')
          )
          or (
            property.owner_id = actor
            and new.document_kind in ('owner_mandate', 'reservation_offer', 'rental_contract', 'handover_protocol')
          )
        )
    ) into requester_is_allowed;

    if not requester_is_allowed then
      raise exception 'The requested document is not available for this participant';
    end if;

    new.status := 'REQUESTED';
    new.fulfilled_document_id := null;
    new.handled_by := null;
    new.handled_at := null;
    new.staff_note := null;
    new.created_at := coalesce(new.created_at, now());
    new.updated_at := clock_timestamp();
    return new;
  end if;

  if new.appointment_id is distinct from old.appointment_id
    or new.requester_id is distinct from old.requester_id
    or new.document_kind is distinct from old.document_kind
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Document request identity is immutable';
  end if;

  if is_admin or is_assigned_agent then
    if new.submitted_data is distinct from old.submitted_data
      or new.notes is distinct from old.notes
    then
      raise exception 'Staff cannot alter participant-submitted data';
    end if;

    if not (
      (old.status = 'REQUESTED' and new.status in ('IN_REVIEW', 'NEEDS_INFO', 'REJECTED'))
      or (old.status = 'IN_REVIEW' and new.status in ('IN_REVIEW', 'NEEDS_INFO', 'FULFILLED', 'REJECTED'))
      or (old.status = 'NEEDS_INFO' and new.status = 'REJECTED')
    ) then
      raise exception 'Invalid staff transition for document request: % -> %', old.status, new.status;
    end if;

    if new.status in ('NEEDS_INFO', 'REJECTED')
      and coalesce(length(trim(new.staff_note)), 0) < 3
    then
      raise exception 'A staff explanation is required for this request status';
    end if;

    new.handled_by := actor;
    new.handled_at := clock_timestamp();

    if new.status = 'FULFILLED' then
      expected_document_type := case new.document_kind
        when 'brokerage_agreement' then 'brokerage_contract'
        when 'owner_mandate' then 'owner_mandate'
        when 'reservation_offer' then 'reservation_offer'
        when 'rental_contract' then 'rental_contract'
        when 'handover_protocol' then 'handover_protocol'
        else null
      end;

      perform 1
      from public.client_documents document
      where document.id = new.fulfilled_document_id
        and document.appointment_id = new.appointment_id
        and document.type = expected_document_type
        and document.uploaded_by = actor::text;
      if not found then
        raise exception 'The fulfilled document does not match the request or its handler';
      end if;
    else
      new.fulfilled_document_id := null;
    end if;
  elsif actor = old.requester_id then
    if old.status not in ('REQUESTED', 'NEEDS_INFO')
      or new.status not in ('REQUESTED', 'CANCELLED')
    then
      raise exception 'The participant can edit or cancel only an open request';
    end if;

    if new.fulfilled_document_id is distinct from old.fulfilled_document_id
      or new.handled_by is distinct from old.handled_by
      or new.handled_at is distinct from old.handled_at
      or new.staff_note is distinct from old.staff_note
    then
      raise exception 'The participant cannot set request handling fields';
    end if;

    -- A corrected submission starts a fresh review cycle. The former staff
    -- note remains available in the immutable event history.
    if new.status = 'REQUESTED' then
      new.handled_by := null;
      new.handled_at := null;
      new.staff_note := null;
    end if;
  else
    raise exception 'Not allowed to update this document request';
  end if;

  new.updated_at := clock_timestamp();
  return new;
end;
$$;

drop trigger if exists enforce_legal_document_request_trigger on public.legal_document_requests;
create trigger enforce_legal_document_request_trigger
before insert or update on public.legal_document_requests
for each row execute function private.enforce_legal_document_request();

revoke all on function private.enforce_legal_document_request() from public, anon, authenticated;

create table if not exists public.legal_document_request_events (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.legal_document_requests(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null check (event_type in (
    'REQUESTED', 'DATA_UPDATED', 'IN_REVIEW', 'NEEDS_INFO',
    'FULFILLED', 'CANCELLED', 'REJECTED'
  )),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists legal_document_request_events_request_idx
  on public.legal_document_request_events(request_id, created_at desc);
create index if not exists legal_document_request_events_actor_idx
  on public.legal_document_request_events(actor_id, created_at desc)
  where actor_id is not null;

alter table public.legal_document_request_events enable row level security;

create policy legal_document_request_events_read
on public.legal_document_request_events for select
to authenticated
using (
  exists (
    select 1
    from public.legal_document_requests request
    where request.id = legal_document_request_events.request_id
      and (
        request.requester_id = (select auth.uid())
        or (select public.is_admin_user())
        or (
          (select public.is_agent_user())
          and exists (
            select 1
            from public.appointments appointment
            where appointment.id = request.appointment_id
              and appointment.agent_id = (select auth.uid())
          )
        )
      )
  )
);

revoke all on table public.legal_document_request_events from anon, authenticated;
grant select on table public.legal_document_request_events to authenticated;

create or replace function private.audit_legal_document_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_event text;
  previous_status text;
  submitted_data_snapshot jsonb;
  participant_notes_snapshot text;
begin
  if tg_op = 'INSERT' then
    next_event := 'REQUESTED';
    previous_status := null;
    submitted_data_snapshot := new.submitted_data;
    participant_notes_snapshot := new.notes;
  else
    previous_status := old.status;
    next_event := case
      when new.status is distinct from old.status then new.status
      else 'DATA_UPDATED'
    end;
    submitted_data_snapshot := case
      when new.submitted_data is distinct from old.submitted_data then new.submitted_data
      else null
    end;
    participant_notes_snapshot := case
      when new.notes is distinct from old.notes then new.notes
      else null
    end;
  end if;

  insert into public.legal_document_request_events(request_id, actor_id, event_type, metadata)
  values (
    new.id,
    (select auth.uid()),
    next_event,
    jsonb_build_object(
      'document_kind', new.document_kind,
      'from_status', previous_status,
      'to_status', new.status,
      'fulfilled_document_id', new.fulfilled_document_id,
      'submitted_data', submitted_data_snapshot,
      'participant_notes', participant_notes_snapshot,
      'staff_note', new.staff_note
    )
  );
  return new;
end;
$$;

drop trigger if exists audit_legal_document_request_trigger on public.legal_document_requests;
create trigger audit_legal_document_request_trigger
after insert or update on public.legal_document_requests
for each row execute function private.audit_legal_document_request();

revoke all on function private.audit_legal_document_request() from public, anon, authenticated;

-- Generated legal files can only be created by the assigned agent or an
-- administrator. Clients retain upload access for supporting evidence only.
drop policy if exists client_documents_insert on public.client_documents;
create policy client_documents_insert
on public.client_documents for insert
to authenticated
with check (
  (select public.is_admin_user())
  or (
    user_id = (select auth.uid())
    and coalesce(uploaded_by, (select auth.uid())::text) = (select auth.uid())::text
    and template_id is null
    and type in ('id_card', 'proof_of_income', 'other')
    and locked_at is null
    and status in ('PENDING', 'UPLOADED')
    and (
      appointment_id is null
      or exists (
        select 1
        from public.appointments appointment
        where appointment.id = client_documents.appointment_id
          and appointment.client_id = (select auth.uid())
      )
    )
  )
  or (
    (select public.is_agent_user())
    and uploaded_by = (select auth.uid())::text
    and exists (
      select 1
      from public.appointments appointment
      where appointment.id = client_documents.appointment_id
        and appointment.agent_id = (select auth.uid())
        and appointment.client_id = client_documents.user_id
    )
  )
);

create or replace function private.enforce_official_document_creator()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  is_service boolean := coalesce(current_setting('role', true), '') in ('postgres', 'service_role');
  expected_kind text;
  appointment_client_id uuid;
  appointment_owner_id uuid;
begin
  if is_service
    or new.template_id is null
    or new.type not in (
      'vizionare_sign', 'brokerage_contract', 'owner_mandate',
      'reservation_offer', 'rental_contract', 'handover_protocol'
    )
  then
    return new;
  end if;

  if public.is_admin_user() then
    return new;
  end if;

  if not public.is_agent_user()
    or not exists (
      select 1
      from public.appointments appointment
      where appointment.id = new.appointment_id
        and appointment.agent_id = actor
    )
  then
    raise exception 'Only the assigned agent or an administrator can generate an official document';
  end if;

  if new.type = 'vizionare_sign' then
    return new;
  end if;

  expected_kind := case new.type
    when 'brokerage_contract' then 'brokerage_agreement'
    when 'owner_mandate' then 'owner_mandate'
    when 'reservation_offer' then 'reservation_offer'
    when 'rental_contract' then 'rental_contract'
    when 'handover_protocol' then 'handover_protocol'
    else null
  end;

  select appointment.client_id, property.owner_id
  into appointment_client_id, appointment_owner_id
  from public.appointments appointment
  left join public.properties property on property.id = appointment.property_id
  where appointment.id = new.appointment_id;

  if expected_kind = 'brokerage_agreement' and not exists (
    select 1 from public.legal_document_requests request
    where request.appointment_id = new.appointment_id
      and request.document_kind = expected_kind
      and request.requester_id = appointment_client_id
      and request.status = 'IN_REVIEW'
      and request.handled_by = actor
  ) then
    raise exception 'The client request must be in review before generation';
  elsif expected_kind in ('owner_mandate', 'handover_protocol') and not exists (
    select 1 from public.legal_document_requests request
    where request.appointment_id = new.appointment_id
      and request.document_kind = expected_kind
      and request.requester_id = appointment_owner_id
      and request.status = 'IN_REVIEW'
      and request.handled_by = actor
  ) then
    raise exception 'The owner confirmation must be in review before generation';
  elsif expected_kind in ('reservation_offer', 'rental_contract') and (
    not exists (
      select 1 from public.legal_document_requests request
      where request.appointment_id = new.appointment_id
        and request.document_kind = expected_kind
        and request.requester_id = appointment_client_id
        and request.status = 'IN_REVIEW'
        and request.handled_by = actor
    )
    or not exists (
      select 1 from public.legal_document_requests request
      where request.appointment_id = new.appointment_id
        and request.document_kind = expected_kind
        and request.requester_id = appointment_owner_id
        and request.status = 'IN_REVIEW'
        and request.handled_by = actor
    )
  ) then
    raise exception 'Both client and owner submissions must be in review before generation';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_official_document_creator_trigger on public.client_documents;
create trigger enforce_official_document_creator_trigger
before insert on public.client_documents
for each row execute function private.enforce_official_document_creator();

revoke all on function private.enforce_official_document_creator() from public, anon, authenticated;

-- One RPC completes every participant submission used by the generated file
-- in the same transaction. It is SECURITY INVOKER, so table grants and RLS
-- remain authoritative.
create or replace function public.fulfill_legal_document_requests(p_document_id uuid)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  document_record public.client_documents%rowtype;
  request_kind text;
  affected integer;
begin
  if actor is null then
    raise exception 'Authentication is required';
  end if;

  select * into document_record
  from public.client_documents document
  where document.id = p_document_id;
  if not found then
    raise exception 'Generated document was not found';
  end if;

  if document_record.uploaded_by is distinct from actor::text then
    raise exception 'Only the document creator can complete its requests';
  end if;

  request_kind := case document_record.type
    when 'brokerage_contract' then 'brokerage_agreement'
    when 'owner_mandate' then 'owner_mandate'
    when 'reservation_offer' then 'reservation_offer'
    when 'rental_contract' then 'rental_contract'
    when 'handover_protocol' then 'handover_protocol'
    else null
  end;
  if request_kind is null then
    raise exception 'This document type does not fulfill participant requests';
  end if;

  update public.legal_document_requests request
  set
    status = 'FULFILLED',
    fulfilled_document_id = document_record.id,
    handled_by = actor,
    handled_at = clock_timestamp(),
    updated_at = clock_timestamp()
  where request.appointment_id = document_record.appointment_id
    and request.document_kind = request_kind
    and request.status = 'IN_REVIEW'
    and request.handled_by = actor;

  get diagnostics affected = row_count;
  if affected = 0 then
    raise exception 'No in-review requests match this document';
  end if;
  return affected;
end;
$$;

revoke all on function public.fulfill_legal_document_requests(uuid) from public, anon;
grant execute on function public.fulfill_legal_document_requests(uuid) to authenticated;
