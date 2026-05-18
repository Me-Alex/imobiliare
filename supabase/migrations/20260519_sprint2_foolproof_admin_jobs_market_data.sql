-- Sprint 2 improvements:
-- - Atomic appointment booking for real viewing slots (RPC).
-- - Market data table editable from admin.
-- - Provider/outbox queue claiming helpers for cron processing.

-- =========================
-- Market data
-- =========================

create table if not exists public.market_data (
  zone text primary key,
  avg_price numeric not null default 0,
  rent_yield numeric not null default 0,
  liquidity integer not null default 0,
  growth numeric not null default 0,
  risk text not null default 'mediu',
  poi text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_market_data_updated_at on public.market_data(updated_at desc);

alter table public.market_data enable row level security;

drop policy if exists "market data public read" on public.market_data;
create policy "market data public read"
  on public.market_data
  for select
  to anon, authenticated
  using (true);

drop policy if exists "market data admin mutate" on public.market_data;
create policy "market data admin mutate"
  on public.market_data
  for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

grant select on public.market_data to anon, authenticated;
grant insert, update, delete on public.market_data to authenticated;

insert into public.market_data(zone, avg_price, rent_yield, liquidity, growth, risk, poi, updated_at)
values
  ('Pipera', 2190, 5.6, 82, 8.4, 'mediu', array['scoli private','birouri','centura','restaurante'], now()),
  ('Floreasca', 3010, 4.9, 91, 7.1, 'scazut', array['parc','mall','clinici','business'], now()),
  ('Corbeanca', 1680, 4.1, 68, 6.2, 'mediu', array['teren','scoli','lac','aeroport'], now()),
  ('Bucuresti Nord', 2450, 5.2, 86, 7.8, 'scazut', array['metrou','business','educatie','servicii'], now())
on conflict (zone) do update set
  avg_price = excluded.avg_price,
  rent_yield = excluded.rent_yield,
  liquidity = excluded.liquidity,
  growth = excluded.growth,
  risk = excluded.risk,
  poi = excluded.poi,
  updated_at = excluded.updated_at;

-- =========================
-- Outbox queue helpers
-- =========================

alter table public.admin_notification_outbox
  add column if not exists attempts integer not null default 0;

alter table public.admin_notification_outbox
  add column if not exists last_error text;

alter table public.admin_notification_outbox
  add column if not exists provider_event_id text;

alter table public.admin_notification_outbox
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_admin_notification_outbox_status_attempts
  on public.admin_notification_outbox(status, attempts, created_at desc);

create or replace function public.claim_admin_notification_outbox(p_limit integer default 25)
returns setof public.admin_notification_outbox
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 25), 200));
begin
  return query
  with candidates as materialized (
    select id
    from public.admin_notification_outbox
    where status in ('QUEUED', 'RETRYING')
      and (due_at is null or due_at <= now())
    order by created_at asc
    limit v_limit
    for update skip locked
  ), updated as (
    update public.admin_notification_outbox o
    set status = 'SENDING',
        attempts = o.attempts + 1,
        updated_at = now()
    from candidates c
    where o.id = c.id
    returning o.*
  )
  select * from updated;
end;
$$;

revoke all on function public.claim_admin_notification_outbox(integer) from public;
grant execute on function public.claim_admin_notification_outbox(integer) to service_role;

create or replace function public.claim_admin_provider_jobs(p_limit integer default 25)
returns setof public.admin_provider_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 25), 200));
begin
  return query
  with candidates as materialized (
    select id
    from public.admin_provider_jobs
    where status in ('QUEUED', 'RETRYING')
    order by created_at asc
    limit v_limit
    for update skip locked
  ), updated as (
    update public.admin_provider_jobs j
    set status = 'RUNNING',
        attempts = j.attempts + 1,
        updated_at = now()
    from candidates c
    where j.id = c.id
    returning j.*
  )
  select * from updated;
end;
$$;

revoke all on function public.claim_admin_provider_jobs(integer) from public;
grant execute on function public.claim_admin_provider_jobs(integer) to service_role;

-- =========================
-- Appointments: RLS + atomic slot booking RPC
-- =========================

alter table public.appointments enable row level security;

grant select, insert, update, delete on public.appointments to authenticated;
grant insert on public.appointments to anon;

drop policy if exists "appointments client read" on public.appointments;
create policy "appointments client read"
  on public.appointments
  for select
  to authenticated
  using (lower(client_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'appointments'
      and policyname = 'public can request appointments'
  ) then
    create policy "public can request appointments"
      on public.appointments
      for insert
      to anon, authenticated
      with check (
        client_name is not null
        and length(trim(client_name)) > 0
        and (client_email is not null or client_phone is not null)
        and requested_at >= now() - interval '5 minutes'
        and coalesce(status, 'REQUESTED') in ('REQUESTED', 'PENDING')
      );
  end if;
end $$;

create or replace function public.book_appointment_slot(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
  safe_name text := trim(coalesce(payload->>'name', payload->>'client_name', ''));
  safe_phone text := trim(coalesce(payload->>'phone', payload->>'client_phone', ''));
  safe_email text := nullif(trim(coalesce(payload->>'email', payload->>'client_email', '')), '');
  safe_notes text := nullif(trim(coalesce(payload->>'notes', '')), '');
  safe_property uuid := nullif(payload->>'property_id', '')::uuid;
  safe_slot uuid := nullif(payload->>'slot_id', '')::uuid;
  safe_requested timestamptz := coalesce(nullif(payload->>'requested_at', '')::timestamptz, now() + interval '1 day');
  slot_row public.appointment_slots;
  slot_booked_count integer := 0;
  slot_capacity integer := 1;
begin
  if length(safe_name) < 2 or (length(safe_phone) < 7 and safe_email is null) then
    raise exception 'Datele de contact sunt incomplete';
  end if;

  if safe_requested < now() then
    safe_requested := now() + interval '1 day';
  end if;

  if safe_slot is not null then
    select * into slot_row
    from public.appointment_slots
    where id = safe_slot
    for update;

    if not found then
      raise exception 'Slotul ales nu exista';
    end if;

    if slot_row.status <> 'AVAILABLE' or slot_row.starts_at < now() then
      raise exception 'Slotul ales nu mai este disponibil';
    end if;

    slot_capacity := greatest(1, coalesce(slot_row.capacity, 1));
    select count(*) into slot_booked_count
    from public.appointments
    where slot_id = safe_slot
      and coalesce(status, 'REQUESTED') not in ('CANCELLED', 'REJECTED');

    if slot_booked_count >= slot_capacity then
      raise exception 'Slotul ales este deja complet';
    end if;

    safe_requested := slot_row.starts_at;
    safe_property := coalesce(safe_property, slot_row.property_id);
  end if;

  insert into public.appointments(client_name, client_phone, client_email, requested_at, notes, status, property_id, slot_id, start_at, end_at, reminder_at, updated_at)
  values (
    safe_name,
    safe_phone,
    safe_email,
    safe_requested,
    left(coalesce(safe_notes, ''), 800),
    'REQUESTED',
    safe_property,
    safe_slot,
    safe_requested,
    case when safe_slot is not null then slot_row.ends_at else safe_requested + interval '1 hour' end,
    safe_requested - interval '3 hours',
    now()
  )
  returning to_jsonb(appointments.*) into result;

  if safe_slot is not null then
    if slot_booked_count + 1 >= slot_capacity then
      update public.appointment_slots
      set status = 'BOOKED',
          updated_at = now()
      where id = safe_slot;
    else
      update public.appointment_slots
      set updated_at = now()
      where id = safe_slot;
    end if;
  end if;

  -- Email notification is best-effort; some requests might include only phone.
  if safe_email is not null then
    insert into public.admin_notification_outbox(channel, target, subject, body, status, due_at, entity, entity_id, metadata, created_at, sent_at, updated_at)
    values (
      'EMAIL',
      safe_email,
      'Cerere noua de vizionare HQS',
      'Client: ' || safe_name || case when safe_property is not null then E'\nProperty: ' || safe_property::text else '' end,
      'QUEUED',
      now(),
      'appointments',
      result->>'id',
      result,
      now(),
      null,
      now()
    );
  end if;

  insert into public.admin_audit_log(action, entity, entity_id, details, metadata, actor, created_at)
  values (
    'APPOINTMENT_CREATED',
    'appointments',
    result->>'id',
    jsonb_build_object('source', 'public_api', 'property_id', safe_property, 'slot_id', safe_slot),
    result,
    'public',
    now()
  );

  return result;
end;
$$;

revoke all on function public.book_appointment_slot(jsonb) from public;
grant execute on function public.book_appointment_slot(jsonb) to anon, authenticated;

