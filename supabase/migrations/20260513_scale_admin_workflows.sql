alter table public.admin_roles add column if not exists status text not null default 'ACTIVE';
alter table public.admin_roles add column if not exists updated_at timestamptz not null default now();

create or replace function public.admin_secret_is_valid(admin_secret text)
returns boolean
language sql
stable
as $$
  select admin_secret is not null and admin_secret = 'hqs_rpc_20260511_8f4b2c9d7e31';
$$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'admin_roles' and column_name = 'permissions' and data_type = 'ARRAY'
  ) then
    alter table public.admin_roles alter column permissions type jsonb using to_jsonb(permissions);
  end if;
end $$;

alter table public.admin_roles alter column permissions set default '["leads","appointments","documents"]'::jsonb;

alter table public.admin_audit_log add column if not exists actor text;
alter table public.admin_audit_log add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.admin_audit_log alter column entity_id type text using entity_id::text;

alter table public.client_documents add column if not exists checklist jsonb not null default '[]'::jsonb;
alter table public.client_documents add column if not exists reviewed_by text;
alter table public.client_documents add column if not exists reviewed_at timestamptz;

alter table public.appointments add column if not exists slot_id uuid references public.appointment_slots(id) on delete set null;
alter table public.appointments add column if not exists agent_email text;
alter table public.appointments add column if not exists reminder_at timestamptz;
alter table public.appointments add column if not exists confirmed_at timestamptz;

alter table public.appointment_slots add column if not exists updated_at timestamptz not null default now();

alter table public.zone_poi add column if not exists lat numeric;
alter table public.zone_poi add column if not exists lng numeric;
alter table public.zone_poi add column if not exists latitude numeric;
alter table public.zone_poi add column if not exists longitude numeric;
alter table public.zone_poi add column if not exists notes text;
alter table public.zone_poi add column if not exists updated_at timestamptz not null default now();

alter table public.cms_entries add column if not exists status text not null default 'PUBLISHED';
alter table public.cms_entries add column if not exists updated_by text;
alter table public.cms_entries add column if not exists created_at timestamptz not null default now();

create table if not exists public.admin_notification_outbox (
  id uuid primary key default gen_random_uuid(),
  channel text not null default 'EMAIL',
  target text,
  subject text not null,
  body text,
  status text not null default 'QUEUED',
  due_at timestamptz,
  entity text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists idx_admin_notification_outbox_status_due on public.admin_notification_outbox(status, due_at);
create index if not exists idx_appointments_slot on public.appointments(slot_id);

alter table public.admin_notification_outbox enable row level security;

insert into public.admin_roles (email, role, permissions, status)
values
  ('admin', 'admin', '["all"]'::jsonb, 'ACTIVE'),
  ('admin@hqsimobiliare.ro', 'admin', '["all"]'::jsonb, 'ACTIVE'),
  ('manager', 'manager', '["leads","clients","appointments","slots","offers","documents","reports","cms","zones","notifications"]'::jsonb, 'ACTIVE'),
  ('agent', 'agent', '["leads","clients","appointments","documents","offers"]'::jsonb, 'ACTIVE')
on conflict (email) do update set
  role = excluded.role,
  permissions = excluded.permissions,
  status = excluded.status,
  updated_at = now();

create or replace function public.admin_permission_snapshot(admin_secret text, actor_name text default 'admin')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare role_row public.admin_roles;
begin
  if not public.admin_secret_is_valid(admin_secret) then
    raise exception 'invalid admin secret';
  end if;

  select * into role_row
  from public.admin_roles
  where lower(email) = lower(coalesce(actor_name, 'admin'))
    and status = 'ACTIVE'
  limit 1;

  if role_row.id is null and lower(coalesce(actor_name, 'admin')) = 'admin' then
    return jsonb_build_object('email', 'admin', 'role', 'admin', 'permissions', '["all"]'::jsonb);
  end if;

  if role_row.id is null then
    return jsonb_build_object('email', actor_name, 'role', 'agent', 'permissions', '[]'::jsonb);
  end if;

  return jsonb_build_object('email', role_row.email, 'role', role_row.role, 'permissions', role_row.permissions);
end;
$$;

create or replace function public.admin_list_platform(admin_secret text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.admin_secret_is_valid(admin_secret) then
    raise exception 'invalid admin secret';
  end if;

  return jsonb_build_object(
    'client_profiles', coalesce((select jsonb_agg(to_jsonb(t)) from (select * from public.client_profiles order by updated_at desc limit 200) t), '[]'::jsonb),
    'client_favorites', coalesce((select jsonb_agg(to_jsonb(t)) from (select cf.*, p.title as property_title, p.city as property_city, p.price as property_price from public.client_favorites cf left join public.properties p on p.id = cf.property_id order by cf.created_at desc limit 400) t), '[]'::jsonb),
    'client_documents', coalesce((select jsonb_agg(to_jsonb(t)) from (select * from public.client_documents order by created_at desc limit 300) t), '[]'::jsonb),
    'property_offers', coalesce((select jsonb_agg(to_jsonb(t)) from (select * from public.property_offers order by created_at desc limit 300) t), '[]'::jsonb),
    'cms_entries', coalesce((select jsonb_agg(to_jsonb(t)) from (select * from public.cms_entries order by updated_at desc) t), '[]'::jsonb),
    'zone_poi', coalesce((select jsonb_agg(to_jsonb(t)) from (select * from public.zone_poi order by zone, score desc) t), '[]'::jsonb),
    'admin_roles', coalesce((select jsonb_agg(to_jsonb(t)) from (select * from public.admin_roles order by role, email) t), '[]'::jsonb),
    'lead_history', coalesce((select jsonb_agg(to_jsonb(t)) from (select * from public.lead_history order by created_at desc limit 300) t), '[]'::jsonb),
    'client_activity', coalesce((select jsonb_agg(to_jsonb(t)) from (select * from public.client_activity order by created_at desc limit 300) t), '[]'::jsonb),
    'client_notifications', coalesce((select jsonb_agg(to_jsonb(t)) from (select * from public.client_notifications order by created_at desc limit 300) t), '[]'::jsonb),
    'appointment_slots', coalesce((select jsonb_agg(to_jsonb(t)) from (select * from public.appointment_slots order by starts_at asc limit 300) t), '[]'::jsonb),
    'admin_audit_log', coalesce((select jsonb_agg(to_jsonb(t)) from (select * from public.admin_audit_log order by created_at desc limit 300) t), '[]'::jsonb),
    'admin_notification_outbox', coalesce((select jsonb_agg(to_jsonb(t)) from (select * from public.admin_notification_outbox order by created_at desc limit 300) t), '[]'::jsonb)
  );
end;
$$;

create or replace function public.admin_log_event(admin_secret text, actor_name text, action_name text, entity_name text, entity_uuid uuid default null, payload jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.admin_secret_is_valid(admin_secret) then
    raise exception 'invalid admin secret';
  end if;

  insert into public.admin_audit_log (actor, action, entity, entity_id, details, metadata)
  values (actor_name, action_name, entity_name, entity_uuid, payload, payload);
end;
$$;

create or replace function public.admin_mutate_lead(admin_secret text, actor_name text, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare row_data public.leads;
declare lead_uuid uuid := nullif(payload->>'id', '')::uuid;
begin
  if not public.admin_secret_is_valid(admin_secret) then raise exception 'invalid admin secret'; end if;

  if lead_uuid is null then
    insert into public.leads (name, email, phone, message, status, source, property_id)
    values (
      coalesce(nullif(payload->>'name', ''), 'Client HQS'),
      nullif(payload->>'email', ''),
      nullif(payload->>'phone', ''),
      nullif(payload->>'message', ''),
      coalesce(nullif(payload->>'status', ''), 'NEW'),
      coalesce(nullif(payload->>'source', ''), 'admin'),
      nullif(payload->>'property_id', '')::uuid
    )
    returning * into row_data;
  else
    update public.leads
    set name = coalesce(nullif(payload->>'name', ''), name),
        email = coalesce(nullif(payload->>'email', ''), email),
        phone = coalesce(nullif(payload->>'phone', ''), phone),
        message = coalesce(payload->>'message', message),
        status = coalesce(nullif(payload->>'status', ''), status),
        source = coalesce(nullif(payload->>'source', ''), source),
        updated_at = now()
    where id = lead_uuid
    returning * into row_data;
  end if;

  if row_data.id is null then raise exception 'lead not found'; end if;

  insert into public.lead_history (lead_id, status, score, assigned_to, note, next_follow_up)
  values (
    row_data.id,
    coalesce(payload->>'status', row_data.status),
    coalesce(nullif(payload->>'score', '')::integer, 50),
    nullif(payload->>'assigned_to', ''),
    coalesce(nullif(payload->>'note', ''), 'Actualizare CRM'),
    nullif(payload->>'next_follow_up', '')::timestamptz
  );

  perform public.admin_log_event(admin_secret, actor_name, 'LEAD_MUTATED', 'leads', row_data.id, to_jsonb(row_data));
  return to_jsonb(row_data);
end;
$$;

create or replace function public.admin_mutate_client_profile(admin_secret text, actor_name text, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare row_data public.client_profiles;
declare target_id uuid := nullif(payload->>'id', '')::uuid;
begin
  if not public.admin_secret_is_valid(admin_secret) then raise exception 'invalid admin secret'; end if;

  update public.client_profiles
  set full_name = coalesce(nullif(payload->>'full_name', ''), full_name),
      email = coalesce(nullif(payload->>'email', ''), email),
      phone = coalesce(nullif(payload->>'phone', ''), phone),
      budget = coalesce(nullif(payload->>'budget', '')::numeric, budget),
      preferred_zones = case when payload ? 'preferred_zones' then array(select jsonb_array_elements_text(payload->'preferred_zones')) else preferred_zones end,
      rooms = coalesce(nullif(payload->>'rooms', '')::integer, rooms),
      purpose = coalesce(nullif(payload->>'purpose', ''), purpose),
      financing_status = coalesce(nullif(payload->>'financing_status', ''), financing_status),
      updated_at = now()
  where id = target_id or user_id = nullif(payload->>'user_id', '')::uuid
  returning * into row_data;

  if row_data.id is null then raise exception 'client profile not found'; end if;
  perform public.admin_log_event(admin_secret, actor_name, 'CLIENT_PROFILE_MUTATED', 'client_profiles', row_data.id, to_jsonb(row_data));
  return to_jsonb(row_data);
end;
$$;

create or replace function public.admin_mutate_appointment(admin_secret text, actor_name text, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare row_data public.appointments;
declare appointment_uuid uuid := nullif(payload->>'id', '')::uuid;
declare slot_uuid uuid := nullif(payload->>'slot_id', '')::uuid;
begin
  if not public.admin_secret_is_valid(admin_secret) then raise exception 'invalid admin secret'; end if;

  if appointment_uuid is null then
    insert into public.appointments (client_name, client_email, client_phone, requested_at, notes, status, property_id, slot_id, agent_email, reminder_at)
    values (
      coalesce(nullif(payload->>'client_name', ''), 'Client HQS'),
      nullif(payload->>'client_email', ''),
      nullif(payload->>'client_phone', ''),
      coalesce(nullif(payload->>'requested_at', '')::timestamptz, now() + interval '1 day'),
      nullif(payload->>'notes', ''),
      coalesce(nullif(payload->>'status', ''), 'REQUESTED'),
      nullif(payload->>'property_id', '')::uuid,
      slot_uuid,
      nullif(payload->>'agent_email', ''),
      nullif(payload->>'reminder_at', '')::timestamptz
    )
    returning * into row_data;
  else
    update public.appointments
    set client_name = coalesce(nullif(payload->>'client_name', ''), client_name),
        client_email = coalesce(nullif(payload->>'client_email', ''), client_email),
        client_phone = coalesce(nullif(payload->>'client_phone', ''), client_phone),
        requested_at = coalesce(nullif(payload->>'requested_at', '')::timestamptz, requested_at),
        notes = coalesce(payload->>'notes', notes),
        status = coalesce(nullif(payload->>'status', ''), status),
        slot_id = coalesce(slot_uuid, slot_id),
        agent_email = coalesce(nullif(payload->>'agent_email', ''), agent_email),
        reminder_at = coalesce(nullif(payload->>'reminder_at', '')::timestamptz, reminder_at),
        confirmed_at = case when payload->>'status' = 'CONFIRMED' then now() else confirmed_at end,
        updated_at = now()
    where id = appointment_uuid
    returning * into row_data;
  end if;

  if row_data.id is null then raise exception 'appointment not found'; end if;

  if row_data.slot_id is not null then
    update public.appointment_slots
    set status = case when row_data.status in ('CANCELLED', 'REJECTED') then 'AVAILABLE' else 'BOOKED' end,
        updated_at = now()
    where id = row_data.slot_id;
  end if;

  if row_data.client_email is not null then
    insert into public.admin_notification_outbox (channel, target, subject, body, due_at, entity, entity_id, metadata)
    values ('EMAIL', row_data.client_email, 'Actualizare vizionare HQS', 'Status vizionare: ' || row_data.status, row_data.reminder_at, 'appointments', row_data.id::text, to_jsonb(row_data));
  end if;

  perform public.admin_log_event(admin_secret, actor_name, 'APPOINTMENT_MUTATED', 'appointments', row_data.id, to_jsonb(row_data));
  return to_jsonb(row_data);
end;
$$;

create or replace function public.admin_mutate_appointment_slot(admin_secret text, actor_name text, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare row_data public.appointment_slots;
declare slot_uuid uuid := nullif(payload->>'id', '')::uuid;
begin
  if not public.admin_secret_is_valid(admin_secret) then raise exception 'invalid admin secret'; end if;

  if payload->>'action' = 'delete' and slot_uuid is not null then
    delete from public.appointment_slots where id = slot_uuid returning * into row_data;
    perform public.admin_log_event(admin_secret, actor_name, 'APPOINTMENT_SLOT_DELETED', 'appointment_slots', slot_uuid, coalesce(to_jsonb(row_data), '{}'::jsonb));
    return coalesce(to_jsonb(row_data), jsonb_build_object('id', slot_uuid, 'deleted', true));
  end if;

  insert into public.appointment_slots (id, agent_email, property_id, starts_at, ends_at, status, capacity, notes, updated_at)
  values (
    coalesce(slot_uuid, gen_random_uuid()),
    nullif(payload->>'agent_email', ''),
    nullif(payload->>'property_id', '')::uuid,
    coalesce(nullif(payload->>'starts_at', '')::timestamptz, now() + interval '1 day'),
    coalesce(nullif(payload->>'ends_at', '')::timestamptz, now() + interval '1 day 1 hour'),
    coalesce(nullif(payload->>'status', ''), 'AVAILABLE'),
    coalesce(nullif(payload->>'capacity', '')::integer, 1),
    nullif(payload->>'notes', ''),
    now()
  )
  on conflict (id) do update set
    agent_email = excluded.agent_email,
    property_id = excluded.property_id,
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    status = excluded.status,
    capacity = excluded.capacity,
    notes = excluded.notes,
    updated_at = now()
  returning * into row_data;

  perform public.admin_log_event(admin_secret, actor_name, 'APPOINTMENT_SLOT_MUTATED', 'appointment_slots', row_data.id, to_jsonb(row_data));
  return to_jsonb(row_data);
end;
$$;

create or replace function public.admin_mutate_offer(admin_secret text, actor_name text, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare row_data public.property_offers;
declare offer_uuid uuid := nullif(payload->>'id', '')::uuid;
begin
  if not public.admin_secret_is_valid(admin_secret) then raise exception 'invalid admin secret'; end if;

  update public.property_offers
  set status = coalesce(nullif(payload->>'status', ''), status),
      counter_offer = coalesce(nullif(payload->>'counter_offer', '')::numeric, counter_offer),
      notes = coalesce(payload->>'notes', notes),
      negotiation_history = coalesce(negotiation_history, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
        'at', now(),
        'actor', actor_name,
        'status', coalesce(payload->>'status', status),
        'counter_offer', nullif(payload->>'counter_offer', ''),
        'note', payload->>'notes'
      )),
      updated_at = now()
  where id = offer_uuid
  returning * into row_data;

  if row_data.id is null then raise exception 'offer not found'; end if;

  if row_data.user_id is not null then
    insert into public.client_notifications (user_id, title, body, status, metadata)
    values (row_data.user_id, 'Oferta actualizata', 'Status oferta: ' || row_data.status, 'UNREAD', jsonb_build_object('offer_id', row_data.id));
  end if;

  if row_data.client_email is not null then
    insert into public.admin_notification_outbox (channel, target, subject, body, entity, entity_id, metadata)
    values ('EMAIL', row_data.client_email, 'Actualizare oferta HQS', 'Status oferta: ' || row_data.status, 'property_offers', row_data.id::text, to_jsonb(row_data));
  end if;

  perform public.admin_log_event(admin_secret, actor_name, 'OFFER_MUTATED', 'property_offers', row_data.id, to_jsonb(row_data));
  return to_jsonb(row_data);
end;
$$;

create or replace function public.admin_review_client_document(admin_secret text, actor_name text, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare row_data public.client_documents;
declare document_uuid uuid := nullif(payload->>'id', '')::uuid;
begin
  if not public.admin_secret_is_valid(admin_secret) then raise exception 'invalid admin secret'; end if;

  update public.client_documents
  set status = coalesce(nullif(payload->>'status', ''), status),
      notes = coalesce(payload->>'notes', notes),
      checklist = coalesce(payload->'checklist', checklist),
      reviewed_by = actor_name,
      reviewed_at = now(),
      updated_at = now()
  where id = document_uuid
  returning * into row_data;

  if row_data.id is null then raise exception 'document not found'; end if;

  insert into public.client_notifications (user_id, title, body, status, metadata)
  values (row_data.user_id, 'Document verificat', 'Status document: ' || row_data.status, 'UNREAD', jsonb_build_object('document_id', row_data.id))
  on conflict do nothing;

  perform public.admin_log_event(admin_secret, actor_name, 'CLIENT_DOCUMENT_REVIEWED', 'client_documents', row_data.id, to_jsonb(row_data));
  return to_jsonb(row_data);
end;
$$;

create or replace function public.admin_mutate_zone_poi(admin_secret text, actor_name text, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare row_data public.zone_poi;
declare poi_uuid uuid := nullif(payload->>'id', '')::uuid;
declare poi_lat numeric := coalesce(nullif(payload->>'lat', '')::numeric, nullif(payload->>'latitude', '')::numeric);
declare poi_lng numeric := coalesce(nullif(payload->>'lng', '')::numeric, nullif(payload->>'longitude', '')::numeric);
begin
  if not public.admin_secret_is_valid(admin_secret) then raise exception 'invalid admin secret'; end if;

  if payload->>'action' = 'delete' and poi_uuid is not null then
    delete from public.zone_poi where id = poi_uuid returning * into row_data;
    perform public.admin_log_event(admin_secret, actor_name, 'ZONE_POI_DELETED', 'zone_poi', poi_uuid, coalesce(to_jsonb(row_data), '{}'::jsonb));
    return coalesce(to_jsonb(row_data), jsonb_build_object('id', poi_uuid, 'deleted', true));
  end if;

  insert into public.zone_poi (id, zone, name, category, minutes, score, lat, lng, latitude, longitude, notes, updated_at)
  values (
    coalesce(poi_uuid, gen_random_uuid()),
    coalesce(nullif(payload->>'zone', ''), 'Bucuresti Nord'),
    coalesce(nullif(payload->>'name', ''), 'Punct de interes'),
    coalesce(nullif(payload->>'category', ''), 'general'),
    coalesce(nullif(payload->>'minutes', '')::integer, 5),
    coalesce(nullif(payload->>'score', '')::integer, 80),
    poi_lat,
    poi_lng,
    poi_lat,
    poi_lng,
    nullif(payload->>'notes', ''),
    now()
  )
  on conflict (id) do update set
    zone = excluded.zone,
    name = excluded.name,
    category = excluded.category,
    minutes = excluded.minutes,
    score = excluded.score,
    lat = excluded.lat,
    lng = excluded.lng,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    notes = excluded.notes,
    updated_at = now()
  returning * into row_data;

  perform public.admin_log_event(admin_secret, actor_name, 'ZONE_POI_MUTATED', 'zone_poi', row_data.id, to_jsonb(row_data));
  return to_jsonb(row_data);
end;
$$;

create or replace function public.admin_upsert_cms_entry(admin_secret text, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare updated_row public.cms_entries;
begin
  if not public.admin_secret_is_valid(admin_secret) then raise exception 'invalid admin secret'; end if;

  insert into public.cms_entries (key, title, section, status, content, seo, updated_by, updated_at)
  values (
    payload->>'key',
    coalesce(payload->>'title', payload->>'key'),
    coalesce(payload->>'section', 'general'),
    coalesce(payload->>'status', 'PUBLISHED'),
    coalesce(payload->'content', '{}'::jsonb),
    coalesce(payload->'seo', '{}'::jsonb),
    coalesce(payload->>'updated_by', 'admin'),
    now()
  )
  on conflict (key) do update set
    title = excluded.title,
    section = excluded.section,
    status = excluded.status,
    content = excluded.content,
    seo = excluded.seo,
    updated_by = excluded.updated_by,
    updated_at = now()
  returning * into updated_row;

  perform public.admin_log_event(admin_secret, coalesce(payload->>'updated_by', 'admin'), 'CMS_ENTRY_UPSERTED', 'cms_entries', updated_row.id, to_jsonb(updated_row));
  return to_jsonb(updated_row);
end;
$$;

create or replace function public.admin_upsert_role(admin_secret text, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare updated_row public.admin_roles;
begin
  if not public.admin_secret_is_valid(admin_secret) then raise exception 'invalid admin secret'; end if;

  insert into public.admin_roles (email, role, permissions, status, updated_at)
  values (
    lower(payload->>'email'),
    coalesce(payload->>'role', 'agent'),
    coalesce(payload->'permissions', '["leads","appointments","documents"]'::jsonb),
    coalesce(payload->>'status', 'ACTIVE'),
    now()
  )
  on conflict (email) do update set
    role = excluded.role,
    permissions = excluded.permissions,
    status = excluded.status,
    updated_at = now()
  returning * into updated_row;

  perform public.admin_log_event(admin_secret, coalesce(payload->>'actor', 'admin'), 'ADMIN_ROLE_UPSERTED', 'admin_roles', updated_row.id, to_jsonb(updated_row));
  return to_jsonb(updated_row);
end;
$$;

create or replace function public.admin_queue_notification(admin_secret text, actor_name text, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare outbox_row public.admin_notification_outbox;
declare client_row public.client_notifications;
begin
  if not public.admin_secret_is_valid(admin_secret) then raise exception 'invalid admin secret'; end if;

  if nullif(payload->>'user_id', '') is not null then
    insert into public.client_notifications (user_id, title, body, status, due_at, metadata)
    values (
      (payload->>'user_id')::uuid,
      coalesce(payload->>'title', 'Reminder HQS'),
      payload->>'body',
      coalesce(payload->>'status', 'UNREAD'),
      nullif(payload->>'due_at', '')::timestamptz,
      coalesce(payload->'metadata', '{}'::jsonb)
    )
    returning * into client_row;
  end if;

  insert into public.admin_notification_outbox (channel, target, subject, body, due_at, entity, entity_id, metadata)
  values (
    coalesce(payload->>'channel', 'EMAIL'),
    nullif(payload->>'target', ''),
    coalesce(payload->>'title', 'Reminder HQS'),
    payload->>'body',
    nullif(payload->>'due_at', '')::timestamptz,
    payload->>'entity',
    payload->>'entity_id',
    coalesce(payload->'metadata', '{}'::jsonb)
  )
  returning * into outbox_row;

  perform public.admin_log_event(admin_secret, actor_name, 'NOTIFICATION_QUEUED', 'admin_notification_outbox', outbox_row.id, to_jsonb(outbox_row));
  return jsonb_build_object('client_notification', to_jsonb(client_row), 'outbox', to_jsonb(outbox_row));
end;
$$;

create or replace function public.public_create_appointment(payload jsonb)
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
begin
  if length(safe_name) < 2 or (length(safe_phone) < 7 and safe_email is null) then
    raise exception 'Datele de contact sunt incomplete';
  end if;

  if safe_requested < now() then
    safe_requested := now() + interval '1 day';
  end if;

  if safe_slot is not null then
    select starts_at into safe_requested from public.appointment_slots where id = safe_slot and status = 'AVAILABLE';
    if safe_requested is null then raise exception 'Slotul ales nu mai este disponibil'; end if;
  end if;

  insert into public.appointments(client_name, client_phone, client_email, requested_at, notes, status, property_id, slot_id, reminder_at)
  values (safe_name, safe_phone, safe_email, safe_requested, left(coalesce(safe_notes, ''), 800), 'REQUESTED', safe_property, safe_slot, safe_requested - interval '3 hours')
  returning to_jsonb(appointments.*) into result;

  if safe_slot is not null then
    update public.appointment_slots set status = 'BOOKED', updated_at = now() where id = safe_slot;
  end if;

  insert into public.admin_notification_outbox(channel, target, subject, body, due_at, entity, entity_id, metadata)
  values ('EMAIL', safe_email, 'Cerere noua de vizionare HQS', 'Client: ' || safe_name, now(), 'appointments', result->>'id', result);

  insert into public.admin_audit_log(action, entity, entity_id, details, metadata, actor)
  values ('CREATE', 'appointment', (result->>'id')::uuid, jsonb_build_object('source', 'public_property_form', 'property_id', safe_property, 'slot_id', safe_slot), result, 'public');

  return result;
end;
$$;

create or replace function public.admin_update_appointment_status(admin_secret text, appointment_id uuid, next_status text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.admin_mutate_appointment(admin_secret, 'admin', jsonb_build_object('id', appointment_id, 'status', next_status));
end;
$$;

grant execute on function public.admin_permission_snapshot(text, text) to anon, authenticated;
grant execute on function public.admin_list_platform(text) to anon, authenticated;
grant execute on function public.admin_mutate_lead(text, text, jsonb) to anon, authenticated;
grant execute on function public.admin_mutate_client_profile(text, text, jsonb) to anon, authenticated;
grant execute on function public.admin_mutate_appointment(text, text, jsonb) to anon, authenticated;
grant execute on function public.admin_mutate_appointment_slot(text, text, jsonb) to anon, authenticated;
grant execute on function public.admin_mutate_offer(text, text, jsonb) to anon, authenticated;
grant execute on function public.admin_review_client_document(text, text, jsonb) to anon, authenticated;
grant execute on function public.admin_mutate_zone_poi(text, text, jsonb) to anon, authenticated;
grant execute on function public.admin_queue_notification(text, text, jsonb) to anon, authenticated;
grant execute on function public.admin_update_appointment_status(text, uuid, text) to anon, authenticated;
