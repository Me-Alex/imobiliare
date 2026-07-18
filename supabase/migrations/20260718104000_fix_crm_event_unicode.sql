-- Store CRM and Deal Room audit messages with deterministic UTF-8 text.

create or replace function private.track_lead_response()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'NEW' and new.status is distinct from old.status then
    new.first_response_at := coalesce(new.first_response_at, now());
  end if;
  if new.status is distinct from old.status or new.agent_id is distinct from old.agent_id then
    new.last_contact_at := coalesce(new.last_contact_at, now());
    insert into public.lead_history (lead_id, status, score, assigned_to, note, next_follow_up)
    values (
      new.id,
      new.status,
      new.score,
      new.agent_id::text,
      case
        when new.status is distinct from old.status then U&'Etap\0103 actualizat\0103 automat \00EEn CRM.'
        else 'Lead repartizat unui agent.'
      end,
      new.next_follow_up_at
    );
  end if;
  return new;
end;
$$;

create or replace function private.log_deal_room_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_summary text;
begin
  if tg_op = 'INSERT' then
    event_summary := 'Deal Room creat';
  elsif new.stage is distinct from old.stage then
    event_summary := U&'Etapa a fost schimbat\0103 din ' || old.stage || U&' \00EEn ' || new.stage;
  elsif new.status is distinct from old.status then
    event_summary := U&'Starea tranzac\021Biei a fost schimbat\0103 \00EEn ' || new.status;
  elsif new.next_step is distinct from old.next_step
     or new.next_step_owner_id is distinct from old.next_step_owner_id
     or new.next_step_due_at is distinct from old.next_step_due_at then
    event_summary := U&'Urm\0103torul pas al tranzac\021Biei a fost actualizat';
  else
    return new;
  end if;

  insert into public.deal_events (deal_id, actor_id, event_type, summary, metadata)
  values (
    new.id,
    (select auth.uid()),
    case when tg_op = 'INSERT' then 'DEAL_CREATED' else 'DEAL_UPDATED' end,
    event_summary,
    jsonb_build_object('stage', new.stage, 'status', new.status, 'next_step', new.next_step)
  );
  return new;
end;
$$;

create or replace function private.log_deal_offer_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.deal_id is null then
    return new;
  end if;

  insert into public.deal_events (deal_id, actor_id, event_type, summary, metadata)
  values (
    new.deal_id,
    coalesce((select auth.uid()), new.created_by),
    case when tg_op = 'INSERT' then 'OFFER_SUBMITTED' else 'OFFER_UPDATED' end,
    case
      when tg_op = 'INSERT' and new.offer_kind = 'COUNTER_OFFER' then U&'Contraofert\0103 \00EEnregistrat\0103'
      when tg_op = 'INSERT' then U&'Ofert\0103 \00EEnregistrat\0103'
      else U&'Starea ofertei a fost actualizat\0103 \00EEn ' || new.status
    end,
    jsonb_build_object('offer_id', new.id, 'amount', new.offer_price, 'currency', new.currency, 'status', new.status)
  );

  if tg_op = 'INSERT' then
    update public.deal_rooms
    set stage = case when stage in ('NEW', 'QUALIFIED', 'VIEWING') then 'OFFER' else stage end,
        updated_at = now()
    where id = new.deal_id;
  end if;
  return new;
end;
$$;

update public.deal_events
set summary = U&'Urm\0103torul pas al tranzac\021Biei a fost actualizat'
where event_type = 'DEAL_UPDATED'
  and encode(convert_to(summary, 'UTF8'), 'hex') like '55726dc384%';

update public.lead_history
set note = U&'Etap\0103 actualizat\0103 automat \00EEn CRM.'
where note is not null
  and encode(convert_to(note, 'UTF8'), 'hex') like '45746170c48c%';
