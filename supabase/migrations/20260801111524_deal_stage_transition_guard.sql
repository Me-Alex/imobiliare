-- Guard Deal Room stage changes behind an audited RPC.
-- UI checks are useful for clarity, but process invariants must also live in
-- the database so staff/admin updates cannot skip accepted offers, documents
-- or pending signatures.

create or replace function public.update_deal_next_step(
  p_deal_id uuid,
  p_stage text,
  p_next_step text default null,
  p_owner_id uuid default null,
  p_due_at timestamptz default null
)
returns public.deal_rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.deal_rooms%rowtype;
  v_uid uuid := (select auth.uid());
  v_stage text := upper(trim(coalesce(p_stage, '')));
  v_next_step text := nullif(left(trim(coalesce(p_next_step, '')), 500), '');
  v_is_admin boolean := false;
  v_has_accepted_offer boolean := false;
  v_requirement_count integer := 0;
  v_incomplete_requirements integer := 0;
  v_blocked_requirements integer := 0;
  v_pending_signatures integer := 0;
begin
  if v_uid is null then
    raise exception 'Autentificare necesara pentru actualizarea Deal Room.';
  end if;

  if v_stage not in ('NEW', 'QUALIFIED', 'VIEWING', 'OFFER', 'CONTRACT', 'CLOSED_WON', 'CLOSED_LOST') then
    raise exception 'Etapa Deal Room este invalida: %', p_stage;
  end if;

  select *
    into v_room
  from public.deal_rooms
  where id = p_deal_id
  for update;

  if v_room.id is null or not private.can_access_deal(v_room.id) then
    raise exception 'Nu ai acces la acest Deal Room.';
  end if;

  v_is_admin := public.is_admin_user();

  if not v_is_admin and v_room.agent_id is distinct from v_uid then
    raise exception 'Doar agentul responsabil sau administratorul poate schimba etapa tranzactiei.';
  end if;

  if p_owner_id is not null
    and not exists (
      select 1
      from (
        values
          (v_room.primary_client_id),
          (v_room.owner_id),
          (v_room.agent_id)
      ) as direct_member(profile_id)
      where direct_member.profile_id = p_owner_id
    )
    and not exists (
      select 1
      from public.deal_participants participant
      where participant.deal_id = v_room.id
        and participant.profile_id = p_owner_id
    )
  then
    raise exception 'Responsabilul selectat nu este participant in Deal Room.';
  end if;

  select exists (
    select 1
    from public.property_offers offer
    where offer.deal_id = v_room.id
      and offer.status = 'ACCEPTED'
  )
  into v_has_accepted_offer;

  if v_stage in ('CONTRACT', 'CLOSED_WON') and not v_has_accepted_offer then
    raise exception 'Accepta o oferta inainte de etapa Contract.';
  end if;

  with requirement_state as (
    select
      requirement.id,
      requirement.status as requirement_status,
      document.status as document_status,
      count(signer.id) filter (
        where signer.required
          and signer.status = 'PENDING'
      )::integer as pending_signatures
    from public.deal_document_requirements requirement
    left join public.client_documents document on document.id = requirement.document_id
    left join public.document_signers signer on signer.document_id = document.id
    where requirement.deal_id = v_room.id
    group by requirement.id, requirement.status, document.status
  )
  select
    count(*)::integer,
    count(*) filter (
      where requirement_status = 'REJECTED'
        or coalesce(document_status, '') in ('REJECTED', 'DECLINED', 'EXPIRED')
    )::integer,
    count(*) filter (
      where not (
        requirement_status in ('APPROVED', 'WAIVED')
        or coalesce(document_status, '') in ('SIGNED', 'APPROVED')
      )
    )::integer,
    coalesce(sum(pending_signatures), 0)::integer
  into v_requirement_count, v_blocked_requirements, v_incomplete_requirements, v_pending_signatures
  from requirement_state;

  if v_stage = 'CONTRACT' and v_blocked_requirements > 0 then
    raise exception 'Corecteaza documentele respinse inainte de etapa Contract.';
  end if;

  if v_stage = 'CLOSED_WON' then
    if v_requirement_count = 0 then
      raise exception 'Creeaza checklistul de documente inainte de finalizarea tranzactiei.';
    end if;
    if v_blocked_requirements > 0 then
      raise exception 'Exista documente respinse sau expirate in Deal Room.';
    end if;
    if v_pending_signatures > 0 then
      raise exception 'Exista semnaturi obligatorii in asteptare.';
    end if;
    if v_incomplete_requirements > 0 then
      raise exception 'Finalizeaza toate documentele obligatorii inainte de inchidere.';
    end if;
  end if;

  update public.deal_rooms
  set stage = v_stage,
      next_step = v_next_step,
      next_step_owner_id = p_owner_id,
      next_step_due_at = p_due_at,
      updated_at = now()
  where id = v_room.id
  returning * into v_room;

  return v_room;
end;
$$;

revoke all on function public.update_deal_next_step(uuid, text, text, uuid, timestamptz) from public, anon;
grant execute on function public.update_deal_next_step(uuid, text, text, uuid, timestamptz) to authenticated;

comment on function public.update_deal_next_step(uuid, text, text, uuid, timestamptz) is
  'Role-aware Deal Room stage update with accepted-offer and document-completion guards.';
