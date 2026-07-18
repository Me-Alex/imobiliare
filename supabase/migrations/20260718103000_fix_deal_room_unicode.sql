-- Keep generated Romanian Deal Room labels valid regardless of client/console encoding.
-- Unicode escape literals make this migration ASCII-only while storing proper UTF-8.

create or replace function private.log_deal_document_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.deal_events (deal_id, actor_id, event_type, summary, metadata)
  values (
    new.deal_id,
    (select auth.uid()),
    case when tg_op = 'INSERT' then 'DOCUMENT_REQUESTED' else 'DOCUMENT_UPDATED' end,
    case when tg_op = 'INSERT'
      then 'Document solicitat: ' || new.label
      else 'Document actualizat: ' || new.label || U&' \00B7 ' || new.status
    end,
    jsonb_build_object('requirement_id', new.id, 'document_id', new.document_id, 'status', new.status)
  );
  return new;
end;
$$;

create or replace function private.seed_deal_requirements(p_deal_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  room public.deal_rooms%rowtype;
begin
  select * into room from public.deal_rooms where id = p_deal_id;
  if room.id is null then return; end if;

  insert into public.deal_document_requirements
    (deal_id, document_type, label, responsible_role, assigned_to, requested_by)
  values
    (room.id, 'viewing_sheet', U&'Fi\0219\0103 de vizionare', 'AGENT', room.agent_id, room.agent_id),
    (room.id, 'client_identity', 'Act de identitate client', 'CLIENT', room.primary_client_id, room.agent_id),
    (room.id, 'ownership_title', 'Act de proprietate', 'OWNER', room.owner_id, room.agent_id),
    (room.id, 'land_registry_excerpt', U&'Extras de carte funciar\0103 pentru informare', 'OWNER', room.owner_id, room.agent_id),
    (room.id, 'fiscal_certificate', 'Certificat fiscal', 'OWNER', room.owner_id, room.agent_id),
    (room.id, 'energy_certificate', U&'Certificat de performan\021B\0103 energetic\0103', 'OWNER', room.owner_id, room.agent_id)
  on conflict (deal_id, document_type) do nothing;
end;
$$;

create or replace function private.sync_deal_from_appointment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  room_id uuid;
  property_row public.properties%rowtype;
begin
  if new.property_id is null or new.client_id is null then
    return new;
  end if;

  select * into property_row from public.properties where id = new.property_id;
  select deal_id into room_id
  from public.deal_appointments
  where appointment_id = new.id;

  if room_id is null then
    insert into public.deal_rooms (
      property_id, initial_appointment_id, primary_client_id, owner_id, agent_id,
      title, stage, next_step, next_step_owner_id, next_step_due_at, created_by
    ) values (
      new.property_id, new.id, new.client_id, property_row.owner_id, coalesce(new.agent_id, property_row.agent_id),
      U&'Tranzac\021Bie \00B7 ' || coalesce(property_row.title, new.property_title, 'Proprietate'),
      case when new.status in ('COMPLETED', 'DONE') then 'QUALIFIED' else 'VIEWING' end,
      case when new.status in ('COMPLETED', 'DONE')
        then U&'Colecteaz\0103 feedback \0219i decide urm\0103toarea etap\0103'
        else U&'Confirm\0103 participarea la vizionare'
      end,
      coalesce(new.agent_id, property_row.agent_id, new.client_id),
      coalesce(new.start_at, new.requested_at),
      coalesce(new.agent_id, new.client_id)
    )
    on conflict (initial_appointment_id) do update set
      primary_client_id = excluded.primary_client_id,
      owner_id = excluded.owner_id,
      agent_id = coalesce(excluded.agent_id, public.deal_rooms.agent_id),
      updated_at = now()
    returning id into room_id;

    insert into public.deal_appointments (deal_id, appointment_id)
    values (room_id, new.id)
    on conflict (appointment_id) do nothing;
  else
    update public.deal_rooms
    set primary_client_id = new.client_id,
        owner_id = property_row.owner_id,
        agent_id = coalesce(new.agent_id, property_row.agent_id, agent_id),
        updated_at = now()
    where id = room_id;
  end if;

  insert into public.deal_participants (deal_id, profile_id, participant_role, attendance_status)
  select room_id, participant.profile_id, participant.role, participant.attendance
  from (values
    (new.client_id, 'CLIENT'::text, case when new.status = 'CHECKED_IN' then 'PRESENT' else 'CONFIRMED' end),
    (property_row.owner_id, 'OWNER'::text, 'NOT_APPLICABLE'::text),
    (coalesce(new.agent_id, property_row.agent_id), 'AGENT'::text, case when new.status = 'CHECKED_IN' then 'PRESENT' else 'CONFIRMED' end)
  ) as participant(profile_id, role, attendance)
  where participant.profile_id is not null
  on conflict (deal_id, profile_id) do update set
    participant_role = excluded.participant_role,
    attendance_status = case
      when excluded.attendance_status = 'PRESENT' then 'PRESENT'
      else public.deal_participants.attendance_status
    end,
    confirmed_at = case
      when excluded.attendance_status in ('CONFIRMED', 'PRESENT') then coalesce(public.deal_participants.confirmed_at, now())
      else public.deal_participants.confirmed_at
    end;

  perform private.seed_deal_requirements(room_id);
  return new;
end;
$$;

update public.deal_rooms as room
set title = U&'Tranzac\021Bie \00B7 ' || coalesce(property.title, 'Proprietate'),
    next_step = case
      when room.stage = 'QUALIFIED' then U&'Colecteaz\0103 feedback \0219i decide urm\0103toarea etap\0103'
      when room.stage = 'VIEWING' then U&'Confirm\0103 participarea la vizionare'
      else room.next_step
    end,
    updated_at = now()
from public.properties as property
where property.id = room.property_id
  and (
    encode(convert_to(room.title, 'UTF8'), 'hex') like '5472616e7a6163c48c%'
    or encode(convert_to(coalesce(room.next_step, ''), 'UTF8'), 'hex') like '%c48c%'
  );

update public.deal_document_requirements
set label = case document_type
  when 'viewing_sheet' then U&'Fi\0219\0103 de vizionare'
  when 'client_identity' then 'Act de identitate client'
  when 'ownership_title' then 'Act de proprietate'
  when 'land_registry_excerpt' then U&'Extras de carte funciar\0103 pentru informare'
  when 'fiscal_certificate' then 'Certificat fiscal'
  when 'energy_certificate' then U&'Certificat de performan\021B\0103 energetic\0103'
  else label
end,
updated_at = now()
where document_type in (
  'viewing_sheet', 'client_identity', 'ownership_title',
  'land_registry_excerpt', 'fiscal_certificate', 'energy_certificate'
);

update public.deal_events as event
set summary = case event.event_type
  when 'DOCUMENT_REQUESTED' then 'Document solicitat: ' || requirement.label
  when 'DOCUMENT_UPDATED' then 'Document actualizat: ' || requirement.label || U&' \00B7 ' || requirement.status
  else event.summary
end
from public.deal_document_requirements as requirement
where event.metadata ->> 'requirement_id' = requirement.id::text
  and event.event_type in ('DOCUMENT_REQUESTED', 'DOCUMENT_UPDATED');
