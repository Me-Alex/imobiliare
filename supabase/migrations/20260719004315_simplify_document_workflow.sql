-- Keep the existing audited document model, but make owner evidence first-class
-- and keep the Deal Room checklist synchronized with the canonical document.

alter table public.client_documents
  drop constraint if exists client_documents_type_check;

alter table public.client_documents
  add constraint client_documents_type_check check (type in (
    'id_card', 'proof_of_income', 'ownership_title', 'land_registry_excerpt',
    'fiscal_certificate', 'energy_certificate', 'vizionare_sign',
    'brokerage_contract', 'owner_mandate', 'reservation_offer',
    'rental_contract', 'handover_protocol', 'addendum',
    'termination_notice', 'other'
  ));

-- Clients and owners can upload only supporting evidence for an appointment
-- in which they participate. Generated legal documents remain staff-only.
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
    user_id = (select auth.uid())
    and uploaded_by = (select auth.uid())::text
    and template_id is null
    and type in (
      'id_card', 'ownership_title', 'land_registry_excerpt',
      'fiscal_certificate', 'energy_certificate', 'other'
    )
    and locked_at is null
    and status in ('PENDING', 'UPLOADED')
    and exists (
      select 1
      from public.appointments appointment
      join public.properties property on property.id = appointment.property_id
      where appointment.id = client_documents.appointment_id
        and property.owner_id = (select auth.uid())
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

create or replace function private.sync_deal_document_requirement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  room public.deal_rooms%rowtype;
  requirement public.deal_document_requirements%rowtype;
  requirement_type text;
  requirement_label text;
  v_responsible_role text;
  responsible_user uuid;
  requirement_status text;
begin
  if new.appointment_id is null or new.status = 'SUPERSEDED' then
    return new;
  end if;

  select deal_room.* into room
  from public.deal_appointments appointment_link
  join public.deal_rooms deal_room on deal_room.id = appointment_link.deal_id
  where appointment_link.appointment_id = new.appointment_id;

  if room.id is null then
    return new;
  end if;

  case new.type
    when 'vizionare_sign' then
      requirement_type := 'viewing_sheet';
      requirement_label := 'Fișă de vizionare';
      v_responsible_role := 'AGENT';
    when 'id_card' then
      if new.user_id <> room.primary_client_id then return new; end if;
      requirement_type := 'client_identity';
      requirement_label := 'Act de identitate client';
      v_responsible_role := 'CLIENT';
    when 'ownership_title' then
      requirement_type := 'ownership_title';
      requirement_label := 'Act de proprietate';
      v_responsible_role := 'OWNER';
    when 'land_registry_excerpt' then
      requirement_type := 'land_registry_excerpt';
      requirement_label := 'Extras de carte funciară pentru informare';
      v_responsible_role := 'OWNER';
    when 'fiscal_certificate' then
      requirement_type := 'fiscal_certificate';
      requirement_label := 'Certificat fiscal';
      v_responsible_role := 'OWNER';
    when 'energy_certificate' then
      requirement_type := 'energy_certificate';
      requirement_label := 'Certificat de performanță energetică';
      v_responsible_role := 'OWNER';
    when 'brokerage_contract' then
      requirement_type := 'brokerage_contract';
      requirement_label := 'Contract de intermediere client';
      v_responsible_role := 'CLIENT';
    when 'owner_mandate' then
      requirement_type := 'owner_mandate';
      requirement_label := 'Mandat de reprezentare proprietar';
      v_responsible_role := 'OWNER';
    when 'reservation_offer' then
      requirement_type := 'reservation_offer';
      requirement_label := 'Ofertă și rezervare';
      v_responsible_role := 'AGENT';
    when 'rental_contract' then
      requirement_type := 'rental_contract';
      requirement_label := 'Contract de închiriere';
      v_responsible_role := 'AGENT';
    when 'handover_protocol' then
      requirement_type := 'handover_protocol';
      requirement_label := 'Proces-verbal de predare-primire';
      v_responsible_role := 'OWNER';
    when 'addendum' then
      requirement_type := 'addendum';
      requirement_label := 'Act adițional';
      v_responsible_role := 'AGENT';
    when 'termination_notice' then
      requirement_type := 'termination_notice';
      requirement_label := 'Încetare contract';
      v_responsible_role := 'AGENT';
    else
      return new;
  end case;

  responsible_user := case v_responsible_role
    when 'CLIENT' then room.primary_client_id
    when 'OWNER' then room.owner_id
    else room.agent_id
  end;
  requirement_status := case
    when new.status in ('SIGNED', 'APPROVED') then 'APPROVED'
    when new.status = 'UPLOADED' then 'UPLOADED'
    when new.status in ('REJECTED', 'DECLINED', 'EXPIRED') then 'REJECTED'
    else 'UNDER_REVIEW'
  end;

  select * into requirement
  from public.deal_document_requirements
  where deal_id = room.id and document_type = requirement_type;

  if requirement.id is null then
    insert into public.deal_document_requirements (
      deal_id, document_id, document_type, label, responsible_role,
      assigned_to, requested_by, status
    ) values (
      room.id, new.id, requirement_type, requirement_label, v_responsible_role,
      responsible_user, coalesce(room.agent_id, room.primary_client_id), requirement_status
    );
  elsif requirement.document_id is null
    or requirement.document_id = new.id
    or exists (
      select 1
      from public.client_documents current_document
      where current_document.id = requirement.document_id
        and (
          current_document.status = 'SUPERSEDED'
          or current_document.created_at <= new.created_at
        )
    )
  then
    update public.deal_document_requirements
    set document_id = new.id,
        label = requirement_label,
        responsible_role = v_responsible_role,
        assigned_to = coalesce(responsible_user, assigned_to),
        status = requirement_status,
        updated_at = now()
    where id = requirement.id;
  end if;

  return new;
end;
$$;

revoke all on function private.sync_deal_document_requirement() from public, anon, authenticated;

drop trigger if exists sync_deal_document_requirement_trigger on public.client_documents;
create trigger sync_deal_document_requirement_trigger
after insert or update of status, signed_at, locked_at on public.client_documents
for each row execute function private.sync_deal_document_requirement();

-- Reconcile existing documents once. DISTINCT ON keeps only the latest active
-- version for each requirement and deal.
with mapped as (
  select distinct on (appointment_link.deal_id, mapping.document_type)
    appointment_link.deal_id,
    document.id as document_id,
    mapping.document_type,
    mapping.label,
    mapping.responsible_role,
    case mapping.responsible_role
      when 'CLIENT' then room.primary_client_id
      when 'OWNER' then room.owner_id
      else room.agent_id
    end as assigned_to,
    coalesce(room.agent_id, room.primary_client_id) as requested_by,
    case
      when document.status in ('SIGNED', 'APPROVED') then 'APPROVED'
      when document.status = 'UPLOADED' then 'UPLOADED'
      when document.status in ('REJECTED', 'DECLINED', 'EXPIRED') then 'REJECTED'
      else 'UNDER_REVIEW'
    end as requirement_status
  from public.client_documents document
  join public.deal_appointments appointment_link
    on appointment_link.appointment_id = document.appointment_id
  join public.deal_rooms room on room.id = appointment_link.deal_id
  cross join lateral (
    select
      case document.type
        when 'vizionare_sign' then 'viewing_sheet'
        when 'id_card' then 'client_identity'
        else document.type
      end as document_type,
      case document.type
        when 'vizionare_sign' then 'Fișă de vizionare'
        when 'id_card' then 'Act de identitate client'
        when 'ownership_title' then 'Act de proprietate'
        when 'land_registry_excerpt' then 'Extras de carte funciară pentru informare'
        when 'fiscal_certificate' then 'Certificat fiscal'
        when 'energy_certificate' then 'Certificat de performanță energetică'
        when 'brokerage_contract' then 'Contract de intermediere client'
        when 'owner_mandate' then 'Mandat de reprezentare proprietar'
        when 'reservation_offer' then 'Ofertă și rezervare'
        when 'rental_contract' then 'Contract de închiriere'
        when 'handover_protocol' then 'Proces-verbal de predare-primire'
        when 'addendum' then 'Act adițional'
        when 'termination_notice' then 'Încetare contract'
      end as label,
      case document.type
        when 'id_card' then 'CLIENT'
        when 'ownership_title' then 'OWNER'
        when 'land_registry_excerpt' then 'OWNER'
        when 'fiscal_certificate' then 'OWNER'
        when 'energy_certificate' then 'OWNER'
        when 'owner_mandate' then 'OWNER'
        when 'handover_protocol' then 'OWNER'
        else 'AGENT'
      end as responsible_role
  ) mapping
  where document.status <> 'SUPERSEDED'
    and document.type in (
      'vizionare_sign', 'id_card', 'ownership_title', 'land_registry_excerpt',
      'fiscal_certificate', 'energy_certificate', 'brokerage_contract',
      'owner_mandate', 'reservation_offer', 'rental_contract',
      'handover_protocol', 'addendum', 'termination_notice'
    )
    and (document.type <> 'id_card' or document.user_id = room.primary_client_id)
  order by appointment_link.deal_id, mapping.document_type, document.created_at desc
)
insert into public.deal_document_requirements (
  deal_id, document_id, document_type, label, responsible_role,
  assigned_to, requested_by, status
)
select
  deal_id, document_id, document_type, label, responsible_role,
  assigned_to, requested_by, requirement_status
from mapped
on conflict (deal_id, document_type) do update
set document_id = excluded.document_id,
    label = excluded.label,
    responsible_role = excluded.responsible_role,
    assigned_to = coalesce(excluded.assigned_to, public.deal_document_requirements.assigned_to),
    status = excluded.status,
    updated_at = now();

comment on function private.sync_deal_document_requirement() is
  'Keeps Deal Room requirements synchronized with the latest canonical client document.';
