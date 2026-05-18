-- Sprint 2: portal notifications, atomic calendar booking, and media/publish guard support.

alter table public.appointment_slots add column if not exists updated_at timestamptz not null default now();

update public.appointment_slots
set status = 'AVAILABLE', updated_at = now()
where status in ('OPEN', 'FREE');

create index if not exists idx_client_notifications_user_unread
  on public.client_notifications(user_id, status, created_at desc);

create index if not exists idx_appointment_slots_available_property
  on public.appointment_slots(property_id, starts_at)
  where status = 'AVAILABLE';

create index if not exists idx_appointments_client_email_created
  on public.appointments(lower(client_email), created_at desc);

grant select, update on public.client_notifications to authenticated;
grant select on public.appointment_slots to anon, authenticated;
grant select on public.appointments to authenticated;

drop policy if exists "appointment slots public read" on public.appointment_slots;
create policy "appointment slots public read" on public.appointment_slots
  for select to anon, authenticated
  using (status = 'AVAILABLE' and starts_at >= now());

drop policy if exists "clients can view own appointments by email" on public.appointments;
create policy "clients can view own appointments by email" on public.appointments
  for select to authenticated
  using (lower(coalesce(client_email, '')) = lower(coalesce(auth.jwt() ->> 'email', '')));

create or replace function public.book_appointment_slot(
  payload jsonb,
  p_client_user_id uuid default null,
  p_actor text default 'website'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
  inserted_id uuid;
  slot_row public.appointment_slots%rowtype;
  rows_changed integer;
  safe_name text := trim(coalesce(payload->>'client_name', payload->>'name', ''));
  safe_phone text := trim(coalesce(payload->>'client_phone', payload->>'phone', ''));
  safe_email text := nullif(lower(trim(coalesce(payload->>'client_email', payload->>'email', ''))), '');
  safe_notes text := nullif(left(trim(coalesce(payload->>'notes', '')), 2000), '');
  safe_property uuid;
  safe_slot uuid;
  safe_requested timestamptz := coalesce(nullif(payload->>'requested_at', '')::timestamptz, now() + interval '1 day');
  safe_start timestamptz;
  safe_end timestamptz;
  safe_agent text := nullif(trim(coalesce(payload->>'agent_email', '')), '');
begin
  if coalesce(payload->>'property_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    safe_property := (payload->>'property_id')::uuid;
  end if;

  if coalesce(payload->>'slot_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    safe_slot := (payload->>'slot_id')::uuid;
  end if;

  if length(safe_name) < 2 then
    raise exception 'Numele este obligatoriu';
  end if;

  if safe_email is null and length(safe_phone) < 7 then
    raise exception 'Telefonul sau emailul este obligatoriu';
  end if;

  if safe_slot is not null then
    select *
    into slot_row
    from public.appointment_slots
    where id = safe_slot
      and status = 'AVAILABLE'
      and starts_at >= now()
    for update;

    if not found then
      raise exception 'Slotul ales nu mai este disponibil';
    end if;

    if slot_row.property_id is not null then
      if safe_property is not null and safe_property <> slot_row.property_id then
        raise exception 'Slotul ales nu apartine proprietatii selectate';
      end if;
      safe_property := slot_row.property_id;
    end if;

    safe_requested := slot_row.starts_at;
    safe_start := slot_row.starts_at;
    safe_end := slot_row.ends_at;
    safe_agent := coalesce(safe_agent, slot_row.agent_email);

    update public.appointment_slots
    set status = 'HELD',
        updated_at = now()
    where id = safe_slot
      and status = 'AVAILABLE';

    get diagnostics rows_changed = row_count;
    if rows_changed <> 1 then
      raise exception 'Slotul ales nu mai este disponibil';
    end if;
  else
    if safe_requested < now() then
      safe_requested := now() + interval '1 day';
    end if;
    safe_start := safe_requested;
    safe_end := coalesce(nullif(payload->>'end_at', '')::timestamptz, safe_start + interval '1 hour');
  end if;

  insert into public.appointments (
    client_name,
    client_phone,
    client_email,
    requested_at,
    start_at,
    end_at,
    notes,
    status,
    property_id,
    slot_id,
    agent_email,
    reminder_at,
    updated_at
  )
  values (
    safe_name,
    nullif(safe_phone, ''),
    safe_email,
    safe_requested,
    safe_start,
    safe_end,
    safe_notes,
    'REQUESTED',
    safe_property,
    safe_slot,
    safe_agent,
    safe_start - interval '3 hours',
    now()
  )
  returning id into inserted_id;

  if safe_slot is not null then
    update public.appointment_slots
    set status = 'BOOKED',
        updated_at = now()
    where id = safe_slot;
  end if;

  select to_jsonb(a.*)
  into result
  from public.appointments a
  where a.id = inserted_id;

  insert into public.admin_notification_outbox(channel, target, subject, body, due_at, entity, entity_id, metadata, created_by)
  values ('EMAIL', safe_email, 'Programare HQS primita', 'Solicitare vizionare pentru ' || safe_name, now(), 'appointments', inserted_id::text, result, p_actor);

  insert into public.admin_audit_log(actor, action, entity, entity_id, details, metadata)
  values (p_actor, 'APPOINTMENT_CREATED', 'appointments', inserted_id::text, jsonb_build_object('property_id', safe_property, 'slot_id', safe_slot), result);

  if p_client_user_id is not null then
    insert into public.client_activity(user_id, type, title, description, metadata)
    values (p_client_user_id, 'APPOINTMENT_REQUESTED', 'Programare solicitata', 'Clientul a solicitat o vizionare din portal.', result);

    insert into public.client_notifications(user_id, title, body, status, metadata)
    values (p_client_user_id, 'Programare trimisa', 'Cererea de vizionare a fost trimisa catre echipa HQS.', 'UNREAD', result);
  end if;

  return result;
end;
$$;

create or replace function public.public_create_appointment(payload jsonb)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.book_appointment_slot(payload, null, 'website');
$$;

revoke all on function public.book_appointment_slot(jsonb, uuid, text) from public;
revoke all on function public.public_create_appointment(jsonb) from public;
grant execute on function public.book_appointment_slot(jsonb, uuid, text) to anon, authenticated;
grant execute on function public.public_create_appointment(jsonb) to anon, authenticated;
