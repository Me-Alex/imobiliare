-- Deal Room offer actions.
-- Keep negotiation status changes behind one audited RPC instead of exposing
-- broad client-side updates on property_offers.

create or replace function public.transition_deal_offer(
  p_offer_id uuid,
  p_next_status text,
  p_actor text default null,
  p_note text default null
)
returns public.property_offers
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_offer public.property_offers%rowtype;
  v_room public.deal_rooms%rowtype;
  v_uid uuid := (select auth.uid());
  v_actor text;
  v_note text := nullif(left(trim(coalesce(p_note, '')), 1000), '');
  v_next_status text := upper(trim(coalesce(p_next_status, '')));
  v_allowed boolean := false;
begin
  if v_uid is null then
    raise exception 'Autentificare necesara pentru actualizarea ofertei.';
  end if;

  if v_next_status not in ('ACCEPTED', 'REJECTED', 'WITHDRAWN', 'COUNTERED', 'EXPIRED') then
    raise exception 'Status oferta invalid: %', p_next_status;
  end if;

  select *
    into v_offer
  from public.property_offers
  where id = p_offer_id
  for update;

  if v_offer.id is null or v_offer.deal_id is null then
    raise exception 'Oferta nu este conectata la un Deal Room.';
  end if;

  select *
    into v_room
  from public.deal_rooms
  where id = v_offer.deal_id
  for update;

  if v_room.id is null or not private.can_access_deal(v_room.id) then
    raise exception 'Nu ai acces la aceasta oferta.';
  end if;

  v_actor := case
    when public.is_admin_user() then 'ADMIN'
    when v_room.agent_id = v_uid then 'AGENT'
    when v_room.owner_id = v_uid then 'OWNER'
    when v_room.primary_client_id = v_uid or v_offer.user_id = v_uid then 'CLIENT'
    else coalesce((
      select participant.participant_role
      from public.deal_participants participant
      where participant.deal_id = v_room.id
        and participant.profile_id = v_uid
      limit 1
    ), 'PARTICIPANT')
  end;

  if v_offer.status in ('ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED') then
    raise exception 'Oferta este deja finalizata (%).', v_offer.status;
  end if;

  v_allowed := case
    when v_next_status = 'WITHDRAWN' then
      v_actor = 'CLIENT'
      and v_offer.offer_kind = 'OFFER'
      and v_offer.status in ('SUBMITTED', 'COUNTERED')
      and (v_offer.created_by = v_uid or v_offer.user_id = v_uid or v_room.primary_client_id = v_uid)
    when v_next_status = 'COUNTERED' then
      v_offer.status = 'SUBMITTED'
      and (
        (v_offer.offer_kind = 'OFFER' and v_actor in ('OWNER', 'AGENT', 'ADMIN'))
        or (v_offer.offer_kind = 'COUNTER_OFFER' and v_actor in ('CLIENT', 'AGENT', 'ADMIN'))
      )
    when v_next_status in ('ACCEPTED', 'REJECTED') then
      v_offer.status = 'SUBMITTED'
      and (
        (v_offer.offer_kind = 'OFFER' and v_actor in ('OWNER', 'AGENT', 'ADMIN'))
        or (v_offer.offer_kind = 'COUNTER_OFFER' and v_actor in ('CLIENT', 'AGENT', 'ADMIN'))
      )
    when v_next_status = 'EXPIRED' then
      public.is_admin_user()
    else false
  end;

  if not v_allowed then
    raise exception 'Actiunea % nu este permisa pentru rolul % si starea curenta %.',
      v_next_status, v_actor, v_offer.status;
  end if;

  update public.property_offers
  set status = v_next_status,
      updated_at = now(),
      negotiation_history = coalesce(negotiation_history, '[]'::jsonb)
        || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
          'actor_id', v_uid,
          'actor_role', v_actor,
          'from_status', v_offer.status,
          'to_status', v_next_status,
          'note', v_note,
          'at', now()
        )))
  where id = v_offer.id
  returning * into v_offer;

  if v_next_status = 'ACCEPTED' then
    update public.property_offers
    set status = 'REJECTED',
        updated_at = now(),
        negotiation_history = coalesce(negotiation_history, '[]'::jsonb)
          || jsonb_build_array(jsonb_build_object(
            'actor_id', v_uid,
            'actor_role', v_actor,
            'from_status', status,
            'to_status', 'REJECTED',
            'reason', 'Superseded by accepted offer',
            'at', now()
          ))
    where deal_id = v_room.id
      and id <> v_offer.id
      and status not in ('ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED');

    update public.deal_rooms
    set stage = 'CONTRACT',
        next_step = 'Oferta a fost acceptata. Agentul pregateste contractele si lista finala de documente.',
        next_step_owner_id = coalesce(v_room.agent_id, v_uid),
        updated_at = now()
    where id = v_room.id;
  elsif v_next_status = 'COUNTERED' then
    update public.deal_rooms
    set stage = 'OFFER',
        next_step = case
          when v_actor = 'CLIENT' then 'Proprietarul sau agentul trebuie sa raspunda la oferta revizuita.'
          else 'Clientul trebuie sa raspunda la contraoferta.'
        end,
        next_step_owner_id = case
          when v_actor = 'CLIENT' then coalesce(v_room.owner_id, v_room.agent_id)
          else v_room.primary_client_id
        end,
        updated_at = now()
    where id = v_room.id;
  elsif v_next_status in ('REJECTED', 'WITHDRAWN', 'EXPIRED') then
    update public.deal_rooms
    set stage = 'OFFER',
        next_step = case v_next_status
          when 'WITHDRAWN' then 'Oferta a fost retrasa. Clientul poate trimite o oferta noua.'
          when 'EXPIRED' then 'Oferta a expirat. Stabiliti daca se reia negocierea.'
          else 'Oferta a fost respinsa. Stabiliti daca se reia negocierea sau se inchide tranzactia.'
        end,
        next_step_owner_id = coalesce(v_room.agent_id, v_room.primary_client_id),
        updated_at = now()
    where id = v_room.id;
  end if;

  return v_offer;
end;
$$;

revoke all on function public.transition_deal_offer(uuid, text, text, text) from public, anon;
grant execute on function public.transition_deal_offer(uuid, text, text, text) to authenticated;

comment on function public.transition_deal_offer(uuid, text, text, text) is
  'Audited Deal Room offer transition with role-aware negotiation rules.';
