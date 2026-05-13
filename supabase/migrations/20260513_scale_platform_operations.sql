create table if not exists public.client_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null,
  title text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.client_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  body text,
  status text not null default 'UNREAD',
  due_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table if not exists public.appointment_slots (
  id uuid primary key default gen_random_uuid(),
  agent_email text,
  property_id uuid references public.properties(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'AVAILABLE',
  capacity integer not null default 1,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor text,
  action text not null,
  entity text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.client_documents add column if not exists notes text;
alter table public.client_documents add column if not exists reviewed_by text;
alter table public.client_documents add column if not exists reviewed_at timestamptz;
alter table public.property_offers add column if not exists negotiation_history jsonb not null default '[]'::jsonb;

create index if not exists idx_client_activity_user_created on public.client_activity(user_id, created_at desc);
create index if not exists idx_client_notifications_user_status on public.client_notifications(user_id, status, created_at desc);
create index if not exists idx_appointment_slots_starts on public.appointment_slots(starts_at, status);
create index if not exists idx_admin_audit_log_created on public.admin_audit_log(created_at desc);

alter table public.client_activity enable row level security;
alter table public.client_notifications enable row level security;
alter table public.appointment_slots enable row level security;
alter table public.admin_audit_log enable row level security;

drop policy if exists "client activity own rows" on public.client_activity;
create policy "client activity own rows" on public.client_activity
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "client notifications own rows" on public.client_notifications;
create policy "client notifications own rows" on public.client_notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "appointment slots public read" on public.appointment_slots;
create policy "appointment slots public read" on public.appointment_slots for select using (status = 'AVAILABLE');

grant select, insert on public.client_activity to authenticated;
grant select, update on public.client_notifications to authenticated;
grant select on public.appointment_slots to anon, authenticated;

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
    'client_profiles', coalesce((select jsonb_agg(row_to_json(t)) from (select * from public.client_profiles order by updated_at desc limit 200) t), '[]'::jsonb),
    'client_favorites', coalesce((select jsonb_agg(row_to_json(t)) from (select cf.*, p.title as property_title, p.city as property_city, p.price as property_price from public.client_favorites cf left join public.properties p on p.id = cf.property_id order by cf.created_at desc limit 400) t), '[]'::jsonb),
    'client_documents', coalesce((select jsonb_agg(row_to_json(t)) from (select * from public.client_documents order by created_at desc limit 300) t), '[]'::jsonb),
    'property_offers', coalesce((select jsonb_agg(row_to_json(t)) from (select * from public.property_offers order by created_at desc limit 300) t), '[]'::jsonb),
    'cms_entries', coalesce((select jsonb_agg(row_to_json(t)) from (select * from public.cms_entries order by updated_at desc) t), '[]'::jsonb),
    'zone_poi', coalesce((select jsonb_agg(row_to_json(t)) from (select * from public.zone_poi order by zone, score desc) t), '[]'::jsonb),
    'admin_roles', coalesce((select jsonb_agg(row_to_json(t)) from (select * from public.admin_roles order by role, email) t), '[]'::jsonb),
    'lead_history', coalesce((select jsonb_agg(row_to_json(t)) from (select * from public.lead_history order by created_at desc limit 300) t), '[]'::jsonb),
    'client_activity', coalesce((select jsonb_agg(row_to_json(t)) from (select * from public.client_activity order by created_at desc limit 300) t), '[]'::jsonb),
    'client_notifications', coalesce((select jsonb_agg(row_to_json(t)) from (select * from public.client_notifications order by created_at desc limit 300) t), '[]'::jsonb),
    'appointment_slots', coalesce((select jsonb_agg(row_to_json(t)) from (select * from public.appointment_slots order by starts_at asc limit 300) t), '[]'::jsonb),
    'admin_audit_log', coalesce((select jsonb_agg(row_to_json(t)) from (select * from public.admin_audit_log order by created_at desc limit 300) t), '[]'::jsonb)
  );
end;
$$;

create or replace function public.admin_add_client_notification(admin_secret text, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare inserted_row public.client_notifications;
begin
  if not public.admin_secret_is_valid(admin_secret) then
    raise exception 'invalid admin secret';
  end if;

  insert into public.client_notifications (user_id, title, body, status, due_at, metadata)
  values (
    (payload->>'user_id')::uuid,
    coalesce(payload->>'title', 'Reminder HQS'),
    payload->>'body',
    coalesce(payload->>'status', 'UNREAD'),
    nullif(payload->>'due_at', '')::timestamptz,
    coalesce(payload->'metadata', '{}'::jsonb)
  )
  returning * into inserted_row;

  insert into public.admin_audit_log (actor, action, entity, entity_id, metadata)
  values ('admin', 'CLIENT_NOTIFICATION_CREATED', 'client_notifications', inserted_row.id::text, to_jsonb(inserted_row));

  return to_jsonb(inserted_row);
end;
$$;

create or replace function public.admin_log_audit_event(admin_secret text, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare inserted_row public.admin_audit_log;
begin
  if not public.admin_secret_is_valid(admin_secret) then
    raise exception 'invalid admin secret';
  end if;

  insert into public.admin_audit_log (actor, action, entity, entity_id, metadata)
  values (
    payload->>'actor',
    coalesce(payload->>'action', 'ADMIN_ACTION'),
    payload->>'entity',
    payload->>'entity_id',
    coalesce(payload->'metadata', '{}'::jsonb)
  )
  returning * into inserted_row;

  return to_jsonb(inserted_row);
end;
$$;

create or replace function public.admin_update_offer_status(admin_secret text, offer_id uuid, next_status text, counter numeric default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare updated_row public.property_offers;
begin
  if not public.admin_secret_is_valid(admin_secret) then
    raise exception 'invalid admin secret';
  end if;

  update public.property_offers
  set status = coalesce(next_status, status),
      counter_offer = coalesce(counter, counter_offer),
      negotiation_history = negotiation_history || jsonb_build_array(jsonb_build_object(
        'at', now(),
        'status', coalesce(next_status, status),
        'counter_offer', counter
      )),
      updated_at = now()
  where id = offer_id
  returning * into updated_row;

  insert into public.admin_audit_log (actor, action, entity, entity_id, metadata)
  values ('admin', 'OFFER_STATUS_UPDATED', 'property_offers', offer_id::text, to_jsonb(updated_row));

  return to_jsonb(updated_row);
end;
$$;

grant execute on function public.admin_add_client_notification(text, jsonb) to anon, authenticated;
grant execute on function public.admin_log_audit_event(text, jsonb) to anon, authenticated;
grant execute on function public.admin_update_offer_status(text, uuid, text, numeric) to anon, authenticated;
