-- Unified transaction workspace, agent CRM and owner analytics.
-- The migration extends the existing viewing/document/offer model instead of
-- creating parallel sources of truth.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

-- ---------------------------------------------------------------------------
-- CRM foundation
-- ---------------------------------------------------------------------------

alter table public.leads drop constraint if exists leads_status_check;
alter table public.leads
  add column if not exists client_id uuid references public.profiles(id) on delete set null,
  add column if not exists zone_interest text,
  add column if not exists budget_min numeric(14,2),
  add column if not exists budget_max numeric(14,2),
  add column if not exists first_response_at timestamptz,
  add column if not exists last_contact_at timestamptz,
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists response_due_at timestamptz default (now() + interval '30 minutes'),
  add constraint leads_status_check check (
    status in ('NEW', 'CONTACTED', 'QUALIFIED', 'VIEWING', 'OFFER', 'CONTRACT', 'WON', 'CLOSED', 'LOST')
  ),
  add constraint leads_budget_check check (
    (budget_min is null or budget_min >= 0)
    and (budget_max is null or budget_max >= 0)
    and (budget_min is null or budget_max is null or budget_max >= budget_min)
  );

update public.leads lead
set client_id = profile.id
from public.profiles profile
where lead.client_id is null
  and lead.email is not null
  and lower(profile.email) = lower(lead.email);

create index if not exists leads_agent_status_created_idx
  on public.leads (agent_id, status, created_at desc);
create index if not exists leads_agent_follow_up_idx
  on public.leads (agent_id, next_follow_up_at)
  where next_follow_up_at is not null and status not in ('WON', 'CLOSED', 'LOST');
create index if not exists leads_client_id_idx on public.leads (client_id);

create table if not exists public.agent_service_areas (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.profiles(id) on delete cascade,
  zone text not null,
  is_primary boolean not null default false,
  active boolean not null default true,
  max_active_leads integer not null default 30 check (max_active_leads between 1 and 500),
  availability_score numeric(5,2) not null default 100 check (availability_score between 0 and 100),
  conversion_score numeric(5,2) not null default 50 check (conversion_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agent_id, zone)
);

create index if not exists agent_service_areas_zone_active_idx
  on public.agent_service_areas (lower(zone), active, availability_score desc);
create index if not exists agent_service_areas_agent_id_idx
  on public.agent_service_areas (agent_id);

create table if not exists public.crm_follow_ups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  assigned_to uuid not null references public.profiles(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  task_type text not null default 'CALL' check (task_type in ('CALL', 'EMAIL', 'VIEWING', 'DOCUMENT', 'OFFER', 'OTHER')),
  title text not null check (char_length(trim(title)) between 1 and 160),
  notes text check (notes is null or char_length(notes) <= 2000),
  due_at timestamptz not null,
  status text not null default 'OPEN' check (status in ('OPEN', 'DONE', 'CANCELLED')),
  outcome text check (outcome is null or char_length(outcome) <= 1000),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_follow_ups_assignee_due_idx
  on public.crm_follow_ups (assigned_to, status, due_at);
create index if not exists crm_follow_ups_lead_id_idx
  on public.crm_follow_ups (lead_id, created_at desc);
create index if not exists crm_follow_ups_created_by_idx
  on public.crm_follow_ups (created_by);

-- ---------------------------------------------------------------------------
-- Deal Room: one coherent transaction workspace around existing records
-- ---------------------------------------------------------------------------

create table if not exists public.deal_rooms (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete restrict,
  initial_appointment_id uuid unique references public.appointments(id) on delete set null,
  primary_client_id uuid references public.profiles(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  agent_id uuid references public.profiles(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 240),
  stage text not null default 'NEW' check (stage in ('NEW', 'QUALIFIED', 'VIEWING', 'OFFER', 'CONTRACT', 'CLOSED_WON', 'CLOSED_LOST')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'ON_HOLD', 'CLOSED')),
  next_step text check (next_step is null or char_length(next_step) <= 500),
  next_step_owner_id uuid references public.profiles(id) on delete set null,
  next_step_due_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists deal_rooms_client_updated_idx
  on public.deal_rooms (primary_client_id, updated_at desc);
create index if not exists deal_rooms_owner_updated_idx
  on public.deal_rooms (owner_id, updated_at desc);
create index if not exists deal_rooms_agent_stage_idx
  on public.deal_rooms (agent_id, stage, updated_at desc);
create index if not exists deal_rooms_property_id_idx on public.deal_rooms (property_id);
create index if not exists deal_rooms_lead_id_idx on public.deal_rooms (lead_id);
create index if not exists deal_rooms_created_by_idx on public.deal_rooms (created_by);
create index if not exists deal_rooms_next_step_idx
  on public.deal_rooms (next_step_owner_id, next_step_due_at)
  where next_step_due_at is not null and status = 'ACTIVE';

create table if not exists public.deal_participants (
  deal_id uuid not null references public.deal_rooms(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  participant_role text not null check (participant_role in ('CLIENT', 'OWNER', 'AGENT', 'ADMIN', 'LEGAL', 'OTHER')),
  attendance_status text not null default 'INVITED' check (attendance_status in ('INVITED', 'CONFIRMED', 'PRESENT', 'ABSENT', 'NOT_APPLICABLE')),
  joined_at timestamptz not null default now(),
  confirmed_at timestamptz,
  primary key (deal_id, profile_id)
);

create index if not exists deal_participants_profile_id_idx
  on public.deal_participants (profile_id, deal_id);

create table if not exists public.deal_appointments (
  deal_id uuid not null references public.deal_rooms(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (deal_id, appointment_id),
  unique (appointment_id)
);

create index if not exists deal_appointments_appointment_id_idx
  on public.deal_appointments (appointment_id);

create table if not exists public.deal_document_requirements (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deal_rooms(id) on delete cascade,
  document_id uuid references public.client_documents(id) on delete set null,
  document_type text not null,
  label text not null check (char_length(trim(label)) between 1 and 180),
  responsible_role text not null default 'CLIENT' check (responsible_role in ('CLIENT', 'OWNER', 'AGENT', 'ADMIN', 'LEGAL')),
  assigned_to uuid references public.profiles(id) on delete set null,
  requested_by uuid references public.profiles(id) on delete set null default auth.uid(),
  status text not null default 'REQUIRED' check (status in ('REQUIRED', 'UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WAIVED')),
  due_at timestamptz,
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (deal_id, document_type)
);

create index if not exists deal_document_requirements_deal_status_idx
  on public.deal_document_requirements (deal_id, status, due_at);
create index if not exists deal_document_requirements_assigned_to_idx
  on public.deal_document_requirements (assigned_to, status);
create index if not exists deal_document_requirements_document_id_idx
  on public.deal_document_requirements (document_id);
create index if not exists deal_document_requirements_requested_by_idx
  on public.deal_document_requirements (requested_by);

create table if not exists public.deal_events (
  id bigint generated always as identity primary key,
  deal_id uuid not null references public.deal_rooms(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  summary text not null check (char_length(trim(summary)) between 1 and 500),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists deal_events_deal_created_idx
  on public.deal_events (deal_id, created_at desc);
create index if not exists deal_events_actor_id_idx on public.deal_events (actor_id);

alter table public.property_offers
  add column if not exists deal_id uuid references public.deal_rooms(id) on delete cascade,
  add column if not exists parent_offer_id uuid references public.property_offers(id) on delete set null,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists offer_kind text not null default 'OFFER' check (offer_kind in ('OFFER', 'COUNTER_OFFER')),
  add column if not exists currency text not null default 'EUR' check (currency in ('EUR', 'RON', 'USD')),
  add column if not exists submitted_at timestamptz,
  add column if not exists expires_at timestamptz;

update public.property_offers offer
set created_by = coalesce(
      offer.created_by,
      case when exists (select 1 from public.profiles profile where profile.id = offer.user_id)
        then offer.user_id else null end
    ),
    submitted_at = coalesce(submitted_at, created_at)
where created_by is null or submitted_at is null;

create index if not exists property_offers_deal_created_idx
  on public.property_offers (deal_id, created_at desc);
create index if not exists property_offers_parent_offer_id_idx
  on public.property_offers (parent_offer_id);
create index if not exists property_offers_created_by_idx
  on public.property_offers (created_by);

-- ---------------------------------------------------------------------------
-- Owner analytics. Raw view identities are never exposed.
-- ---------------------------------------------------------------------------

create table if not exists public.property_daily_metrics (
  property_id uuid not null references public.properties(id) on delete cascade,
  metric_date date not null default current_date,
  views integer not null default 0 check (views >= 0),
  favorites integer not null default 0 check (favorites >= 0),
  inquiries integer not null default 0 check (inquiries >= 0),
  viewings integer not null default 0 check (viewings >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (property_id, metric_date)
);

create index if not exists property_daily_metrics_date_idx
  on public.property_daily_metrics (metric_date desc, property_id);

create table if not exists private.property_view_events (
  property_id uuid not null references public.properties(id) on delete cascade,
  metric_date date not null default current_date,
  viewer_key_hash text not null check (char_length(viewer_key_hash) = 32),
  created_at timestamptz not null default now(),
  primary key (property_id, metric_date, viewer_key_hash)
);

revoke all on table private.property_view_events from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Helpers, automatic assignment and audit
-- ---------------------------------------------------------------------------

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.can_access_deal(p_deal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    public.is_admin_user()
    or exists (
      select 1
      from public.deal_rooms room
      where room.id = p_deal_id
        and (select auth.uid()) in (room.primary_client_id, room.owner_id, room.agent_id, room.next_step_owner_id)
    )
    or exists (
      select 1
      from public.deal_participants participant
      where participant.deal_id = p_deal_id
        and participant.profile_id = (select auth.uid())
    )
  );
$$;

create or replace function private.pick_agent_for_lead(p_lead_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  with target as (
    select lead.id,
           lower(coalesce(lead.zone_interest, property.zone, property.city, '')) as desired_zone
    from public.leads lead
    left join public.properties property on property.id = lead.property_id
    where lead.id = p_lead_id
  ), candidates as (
    select profile.id,
           area.availability_score,
           area.is_primary,
           area.max_active_leads,
           area.conversion_score,
           count(active_lead.id) filter (
             where active_lead.status not in ('WON', 'CLOSED', 'LOST')
           ) as active_count,
           case when lower(area.zone) = target.desired_zone then 0 else 1 end as zone_rank
    from target
    join public.agent_service_areas area
      on area.active
     and (target.desired_zone = '' or lower(area.zone) = target.desired_zone or lower(area.zone) = 'toate')
    join public.profiles profile
      on profile.id = area.agent_id
     and profile.role = 'AGENT'
     and coalesce(profile.is_active, true)
    left join public.leads active_lead on active_lead.agent_id = profile.id
    group by profile.id, area.availability_score, area.conversion_score, area.is_primary, area.max_active_leads, target.desired_zone, area.zone
  )
  select candidate.id
  from candidates candidate
  where candidate.active_count < candidate.max_active_leads
  order by candidate.zone_rank,
           candidate.is_primary desc,
           candidate.availability_score desc,
           candidate.conversion_score desc,
           (candidate.active_count::numeric / candidate.max_active_leads) asc,
           candidate.id
  limit 1;
$$;

insert into public.agent_service_areas (agent_id, zone, is_primary, availability_score, conversion_score)
select profile.id, 'toate', true, 100, 50
from public.profiles profile
where profile.role = 'AGENT' and coalesce(profile.is_active, true)
on conflict (agent_id, zone) do nothing;

create or replace function private.sync_agent_service_area()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role = 'AGENT' and coalesce(new.is_active, true) then
    insert into public.agent_service_areas (agent_id, zone, is_primary, availability_score, conversion_score)
    values (new.id, 'toate', true, 100, 50)
    on conflict (agent_id, zone) do update set active = true, updated_at = now();
  elsif tg_op = 'UPDATE' and old.role = 'AGENT' then
    update public.agent_service_areas set active = false, updated_at = now() where agent_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_agent_service_area on public.profiles;
create trigger sync_agent_service_area
after insert or update of role, is_active on public.profiles
for each row execute function private.sync_agent_service_area();

create or replace function private.auto_assign_new_lead()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_agent uuid;
begin
  if new.agent_id is not null then
    return new;
  end if;

  selected_agent := private.pick_agent_for_lead(new.id);
  if selected_agent is not null then
    update public.leads
    set agent_id = selected_agent,
        updated_at = now()
    where id = new.id and agent_id is null;
  end if;
  return new;
end;
$$;

create or replace function private.reassign_leads_automatically_internal(p_lead_id uuid default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  lead_row record;
  selected_agent uuid;
  changed_count integer := 0;
begin
  if not public.is_admin_user() then
    raise exception 'Only an active administrator can reassign leads';
  end if;

  for lead_row in
    select id
    from public.leads
    where (p_lead_id is null or id = p_lead_id)
      and status not in ('WON', 'CLOSED', 'LOST')
    order by created_at
  loop
    selected_agent := private.pick_agent_for_lead(lead_row.id);
    if selected_agent is not null then
      update public.leads
      set agent_id = selected_agent,
          updated_at = now()
      where id = lead_row.id
        and agent_id is distinct from selected_agent;
      changed_count := changed_count + case when found then 1 else 0 end;
    end if;
  end loop;

  return changed_count;
end;
$$;

create or replace function public.reassign_leads_automatically(p_lead_id uuid default null)
returns integer
language sql
security invoker
set search_path = ''
as $$
  select private.reassign_leads_automatically_internal(p_lead_id);
$$;

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
        when new.status is distinct from old.status then 'Etapă actualizată automat în CRM.'
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
    event_summary := 'Etapa a fost schimbată din ' || old.stage || ' în ' || new.stage;
  elsif new.status is distinct from old.status then
    event_summary := 'Starea tranzacției a fost schimbată în ' || new.status;
  elsif new.next_step is distinct from old.next_step
     or new.next_step_owner_id is distinct from old.next_step_owner_id
     or new.next_step_due_at is distinct from old.next_step_due_at then
    event_summary := 'Următorul pas al tranzacției a fost actualizat';
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
      when tg_op = 'INSERT' and new.offer_kind = 'COUNTER_OFFER' then 'Contraofertă înregistrată'
      when tg_op = 'INSERT' then 'Ofertă înregistrată'
      else 'Starea ofertei a fost actualizată în ' || new.status
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
      else 'Document actualizat: ' || new.label || ' · ' || new.status
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
    (room.id, 'viewing_sheet', 'Fișă de vizionare', 'AGENT', room.agent_id, room.agent_id),
    (room.id, 'client_identity', 'Act de identitate client', 'CLIENT', room.primary_client_id, room.agent_id),
    (room.id, 'ownership_title', 'Act de proprietate', 'OWNER', room.owner_id, room.agent_id),
    (room.id, 'land_registry_excerpt', 'Extras de carte funciară pentru informare', 'OWNER', room.owner_id, room.agent_id),
    (room.id, 'fiscal_certificate', 'Certificat fiscal', 'OWNER', room.owner_id, room.agent_id),
    (room.id, 'energy_certificate', 'Certificat de performanță energetică', 'OWNER', room.owner_id, room.agent_id)
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
      'Tranzacție · ' || coalesce(property_row.title, new.property_title, 'Proprietate'),
      case when new.status in ('COMPLETED', 'DONE') then 'QUALIFIED' else 'VIEWING' end,
      case when new.status in ('COMPLETED', 'DONE') then 'Colectează feedback și decide următoarea etapă' else 'Confirmă participarea la vizionare' end,
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

create or replace function private.bump_property_metric()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_property uuid;
  metric_column text;
  delta integer := 1;
begin
  target_property := case when tg_op = 'DELETE' then old.property_id else new.property_id end;
  if target_property is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_table_name = 'client_favorites' then
    metric_column := 'favorites';
    delta := case when tg_op = 'DELETE' then -1 else 1 end;
  elsif tg_table_name = 'leads' then
    metric_column := 'inquiries';
  elsif tg_table_name = 'appointments' then
    metric_column := 'viewings';
  else
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  insert into public.property_daily_metrics (property_id, metric_date)
  values (target_property, current_date)
  on conflict (property_id, metric_date) do nothing;

  if metric_column = 'favorites' then
    update public.property_daily_metrics
    set favorites = greatest(0, favorites + delta), updated_at = now()
    where property_id = target_property and metric_date = current_date;
  elsif metric_column = 'inquiries' then
    update public.property_daily_metrics
    set inquiries = inquiries + 1, updated_at = now()
    where property_id = target_property and metric_date = current_date;
  else
    update public.property_daily_metrics
    set viewings = viewings + 1, updated_at = now()
    where property_id = target_property and metric_date = current_date;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create or replace function private.record_property_view_internal(p_property_id uuid, p_viewer_key text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_count integer;
begin
  if p_property_id is null or char_length(coalesce(p_viewer_key, '')) not between 12 and 200 then
    return false;
  end if;
  if not exists (
    select 1 from public.properties
    where id = p_property_id and status = 'PUBLISHED'
  ) then
    return false;
  end if;

  insert into private.property_view_events (property_id, viewer_key_hash)
  values (p_property_id, md5(p_viewer_key))
  on conflict do nothing;
  get diagnostics inserted_count = row_count;

  if inserted_count > 0 then
    insert into public.property_daily_metrics (property_id, metric_date, views)
    values (p_property_id, current_date, 1)
    on conflict (property_id, metric_date) do update
      set views = public.property_daily_metrics.views + 1,
          updated_at = now();
    return true;
  end if;
  return false;
end;
$$;

create or replace function public.record_property_view(p_property_id uuid, p_viewer_key text)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select private.record_property_view_internal(p_property_id, p_viewer_key);
$$;

-- Timestamps and workflow triggers.
drop trigger if exists touch_agent_service_areas on public.agent_service_areas;
create trigger touch_agent_service_areas before update on public.agent_service_areas
for each row execute function private.touch_updated_at();
drop trigger if exists touch_crm_follow_ups on public.crm_follow_ups;
create trigger touch_crm_follow_ups before update on public.crm_follow_ups
for each row execute function private.touch_updated_at();
drop trigger if exists touch_deal_rooms on public.deal_rooms;
create trigger touch_deal_rooms before update on public.deal_rooms
for each row execute function private.touch_updated_at();
drop trigger if exists touch_deal_document_requirements on public.deal_document_requirements;
create trigger touch_deal_document_requirements before update on public.deal_document_requirements
for each row execute function private.touch_updated_at();

drop trigger if exists auto_assign_new_lead on public.leads;
create trigger auto_assign_new_lead after insert on public.leads
for each row execute function private.auto_assign_new_lead();
drop trigger if exists track_lead_response on public.leads;
create trigger track_lead_response before update on public.leads
for each row execute function private.track_lead_response();

drop trigger if exists log_deal_room_change on public.deal_rooms;
create trigger log_deal_room_change after insert or update on public.deal_rooms
for each row execute function private.log_deal_room_change();
drop trigger if exists log_deal_offer_change on public.property_offers;
create trigger log_deal_offer_change after insert or update of status on public.property_offers
for each row execute function private.log_deal_offer_change();
drop trigger if exists log_deal_document_change on public.deal_document_requirements;
create trigger log_deal_document_change after insert or update of status, document_id on public.deal_document_requirements
for each row execute function private.log_deal_document_change();

drop trigger if exists sync_deal_from_appointment on public.appointments;
create trigger sync_deal_from_appointment
after insert or update of property_id, client_id, agent_id, status, checked_in_at on public.appointments
for each row execute function private.sync_deal_from_appointment();

drop trigger if exists bump_favorite_metric on public.client_favorites;
create trigger bump_favorite_metric after insert or delete on public.client_favorites
for each row execute function private.bump_property_metric();
drop trigger if exists bump_lead_metric on public.leads;
create trigger bump_lead_metric after insert on public.leads
for each row execute function private.bump_property_metric();
drop trigger if exists bump_appointment_metric on public.appointments;
create trigger bump_appointment_metric after insert on public.appointments
for each row execute function private.bump_property_metric();

-- ---------------------------------------------------------------------------
-- Row level security and explicit privileges
-- ---------------------------------------------------------------------------

alter table public.agent_service_areas enable row level security;
alter table public.crm_follow_ups enable row level security;
alter table public.deal_rooms enable row level security;
alter table public.deal_participants enable row level security;
alter table public.deal_appointments enable row level security;
alter table public.deal_document_requirements enable row level security;
alter table public.deal_events enable row level security;
alter table public.property_daily_metrics enable row level security;

revoke all on public.agent_service_areas, public.crm_follow_ups, public.deal_rooms,
  public.deal_participants, public.deal_appointments, public.deal_document_requirements,
  public.deal_events, public.property_daily_metrics from anon, authenticated;
grant select, insert, update, delete on public.agent_service_areas to authenticated;
grant select, insert, update, delete on public.crm_follow_ups to authenticated;
grant select, insert, update, delete on public.deal_rooms to authenticated;
grant select, insert, update, delete on public.deal_participants to authenticated;
grant select, insert, update, delete on public.deal_appointments to authenticated;
grant select, insert, update, delete on public.deal_document_requirements to authenticated;
grant select, insert on public.deal_events to authenticated;
grant select on public.property_daily_metrics to authenticated;
grant usage, select on sequence public.deal_events_id_seq to authenticated;

grant execute on function private.can_access_deal(uuid) to authenticated;
grant execute on function private.record_property_view_internal(uuid, text) to anon, authenticated;
grant execute on function private.reassign_leads_automatically_internal(uuid) to authenticated;
grant execute on function public.record_property_view(uuid, text) to anon, authenticated;
grant execute on function public.reassign_leads_automatically(uuid) to authenticated;

create policy agent_service_areas_team_read on public.agent_service_areas
for select to authenticated
using (public.is_admin_user() or agent_id = (select auth.uid()));
create policy agent_service_areas_admin_insert on public.agent_service_areas
for insert to authenticated
with check (public.is_admin_user());
create policy agent_service_areas_admin_update on public.agent_service_areas
for update to authenticated
using (public.is_admin_user()) with check (public.is_admin_user());
create policy agent_service_areas_admin_delete on public.agent_service_areas
for delete to authenticated
using (public.is_admin_user());

create policy crm_follow_ups_team_read on public.crm_follow_ups
for select to authenticated
using (
  public.is_admin_user()
  or assigned_to = (select auth.uid())
  or exists (
    select 1 from public.leads lead
    where lead.id = crm_follow_ups.lead_id and lead.agent_id = (select auth.uid())
  )
);
create policy crm_follow_ups_team_insert on public.crm_follow_ups
for insert to authenticated
with check (
  public.is_admin_user()
  or (
    public.is_agent_user()
    and assigned_to = (select auth.uid())
    and created_by = (select auth.uid())
    and exists (
      select 1 from public.leads lead
      where lead.id = crm_follow_ups.lead_id and lead.agent_id = (select auth.uid())
    )
  )
);
create policy crm_follow_ups_team_update on public.crm_follow_ups
for update to authenticated
using (public.is_admin_user() or assigned_to = (select auth.uid()))
with check (public.is_admin_user() or assigned_to = (select auth.uid()));
create policy crm_follow_ups_admin_delete on public.crm_follow_ups
for delete to authenticated
using (public.is_admin_user());

create policy deal_rooms_participant_read on public.deal_rooms
for select to authenticated
using (private.can_access_deal(id));
create policy deal_rooms_staff_insert on public.deal_rooms
for insert to authenticated
with check (
  public.is_admin_user()
  or (public.is_agent_user() and agent_id = (select auth.uid()) and created_by = (select auth.uid()))
);
create policy deal_rooms_staff_update on public.deal_rooms
for update to authenticated
using (public.is_admin_user() or agent_id = (select auth.uid()))
with check (public.is_admin_user() or agent_id = (select auth.uid()));
create policy deal_rooms_admin_delete on public.deal_rooms
for delete to authenticated using (public.is_admin_user());

create policy deal_participants_member_read on public.deal_participants
for select to authenticated using (private.can_access_deal(deal_id));
create policy deal_participants_staff_insert on public.deal_participants
for insert to authenticated
with check (
  public.is_admin_user()
  or exists (select 1 from public.deal_rooms room where room.id = deal_id and room.agent_id = (select auth.uid()))
);
create policy deal_participants_staff_update on public.deal_participants
for update to authenticated
using (
  public.is_admin_user()
  or exists (select 1 from public.deal_rooms room where room.id = deal_id and room.agent_id = (select auth.uid()))
)
with check (
  public.is_admin_user()
  or exists (select 1 from public.deal_rooms room where room.id = deal_id and room.agent_id = (select auth.uid()))
);
create policy deal_participants_staff_delete on public.deal_participants
for delete to authenticated
using (
  public.is_admin_user()
  or exists (select 1 from public.deal_rooms room where room.id = deal_id and room.agent_id = (select auth.uid()))
);

create policy deal_appointments_member_read on public.deal_appointments
for select to authenticated using (private.can_access_deal(deal_id));
create policy deal_appointments_staff_insert on public.deal_appointments
for insert to authenticated
with check (
  public.is_admin_user()
  or exists (select 1 from public.deal_rooms room where room.id = deal_id and room.agent_id = (select auth.uid()))
);
create policy deal_appointments_staff_delete on public.deal_appointments
for delete to authenticated
using (
  public.is_admin_user()
  or exists (select 1 from public.deal_rooms room where room.id = deal_id and room.agent_id = (select auth.uid()))
);

create policy deal_documents_member_read on public.deal_document_requirements
for select to authenticated using (private.can_access_deal(deal_id));
create policy deal_documents_staff_insert on public.deal_document_requirements
for insert to authenticated
with check (
  public.is_admin_user()
  or exists (select 1 from public.deal_rooms room where room.id = deal_id and room.agent_id = (select auth.uid()))
);
create policy deal_documents_staff_update on public.deal_document_requirements
for update to authenticated
using (
  public.is_admin_user()
  or exists (select 1 from public.deal_rooms room where room.id = deal_id and room.agent_id = (select auth.uid()))
)
with check (
  public.is_admin_user()
  or exists (select 1 from public.deal_rooms room where room.id = deal_id and room.agent_id = (select auth.uid()))
);
create policy deal_documents_staff_delete on public.deal_document_requirements
for delete to authenticated
using (public.is_admin_user());

create policy deal_events_member_read on public.deal_events
for select to authenticated using (private.can_access_deal(deal_id));
create policy deal_events_member_insert on public.deal_events
for insert to authenticated
with check (
  private.can_access_deal(deal_id)
  and actor_id = (select auth.uid())
  and event_type in ('NOTE', 'FEEDBACK', 'PRESENCE_CONFIRMED')
);

create policy property_daily_metrics_owner_team_read on public.property_daily_metrics
for select to authenticated
using (
  public.is_admin_user()
  or exists (
    select 1 from public.properties property
    where property.id = property_daily_metrics.property_id
      and (property.owner_id = (select auth.uid()) or property.agent_id = (select auth.uid()))
  )
);

-- Consolidate legacy lead policies so uppercase account roles and assignment
-- boundaries are consistently enforced.
drop policy if exists "Admin can update all leads" on public.leads;
drop policy if exists "Admin can view all leads" on public.leads;
drop policy if exists "Admins and agents can read leads" on public.leads;
drop policy if exists "Admins can update leads" on public.leads;
drop policy if exists "Agents can update own leads" on public.leads;
drop policy if exists "Agents can view own leads" on public.leads;
drop policy if exists "Public can insert leads with required fields" on public.leads;
drop policy if exists "admin request token all" on public.leads;

create policy leads_public_insert on public.leads
for insert to anon
with check (
  char_length(trim(name)) > 0
  and (email is not null or phone is not null)
  and coalesce(status, 'NEW') = 'NEW'
  and agent_id is null
  and client_id is null
);
create policy leads_authenticated_insert on public.leads
for insert to authenticated
with check (
  public.is_admin_user()
  or (public.is_agent_user() and agent_id = (select auth.uid()))
  or (
    char_length(trim(name)) > 0
    and (email is not null or phone is not null)
    and coalesce(status, 'NEW') = 'NEW'
    and agent_id is null
    and (client_id is null or client_id = (select auth.uid()))
  )
);
create policy leads_team_read on public.leads
for select to authenticated
using (public.is_admin_user() or agent_id = (select auth.uid()));
create policy leads_team_update on public.leads
for update to authenticated
using (public.is_admin_user() or agent_id = (select auth.uid()))
with check (public.is_admin_user() or agent_id = (select auth.uid()));
create policy leads_admin_delete on public.leads
for delete to authenticated using (public.is_admin_user());

drop policy if exists "admin request token all" on public.lead_history;
create policy lead_history_team_read on public.lead_history
for select to authenticated
using (
  public.is_admin_user()
  or exists (
    select 1 from public.leads lead
    where lead.id = lead_history.lead_id and lead.agent_id = (select auth.uid())
  )
);
create policy lead_history_team_insert on public.lead_history
for insert to authenticated
with check (
  public.is_admin_user()
  or exists (
    select 1 from public.leads lead
    where lead.id = lead_history.lead_id and lead.agent_id = (select auth.uid())
  )
);

drop policy if exists property_offers_own_insert on public.property_offers;
drop policy if exists property_offers_own_select on public.property_offers;
drop policy if exists property_offers_own_update on public.property_offers;
drop policy if exists "admin request token all" on public.property_offers;
create policy property_offers_deal_read on public.property_offers
for select to authenticated
using (
  public.is_admin_user()
  or user_id = (select auth.uid())
  or (deal_id is not null and private.can_access_deal(deal_id))
);
create policy property_offers_deal_insert on public.property_offers
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (
    (deal_id is null and user_id = (select auth.uid()))
    or (deal_id is not null and private.can_access_deal(deal_id))
  )
);
create policy property_offers_deal_update on public.property_offers
for update to authenticated
using (
  public.is_admin_user()
  or created_by = (select auth.uid())
  or exists (
    select 1 from public.deal_rooms room
    where room.id = property_offers.deal_id and room.agent_id = (select auth.uid())
  )
)
with check (
  public.is_admin_user()
  or created_by = (select auth.uid())
  or exists (
    select 1 from public.deal_rooms room
    where room.id = property_offers.deal_id and room.agent_id = (select auth.uid())
  )
);
create policy property_offers_admin_delete on public.property_offers
for delete to authenticated using (public.is_admin_user());

-- Seed initial analytics from existing rows. Views begin at zero and are
-- counted once per browser/property/day by record_property_view().
insert into public.property_daily_metrics (property_id, metric_date, favorites, inquiries, viewings)
select property_id, metric_date,
       sum(favorites)::integer,
       sum(inquiries)::integer,
       sum(viewings)::integer
from (
  select property_id, coalesce(created_at::date, current_date) as metric_date, count(*) as favorites, 0 as inquiries, 0 as viewings
  from public.client_favorites group by property_id, coalesce(created_at::date, current_date)
  union all
  select property_id, coalesce(created_at::date, current_date), 0, count(*), 0
  from public.leads where property_id is not null group by property_id, coalesce(created_at::date, current_date)
  union all
  select property_id, coalesce(created_at::date, current_date), 0, 0, count(*)
  from public.appointments where property_id is not null group by property_id, coalesce(created_at::date, current_date)
) source
group by property_id, metric_date
on conflict (property_id, metric_date) do update set
  favorites = excluded.favorites,
  inquiries = excluded.inquiries,
  viewings = excluded.viewings,
  updated_at = now();

-- Existing authenticated appointments become Deal Rooms. The no-op update is
-- intentional: it invokes the same synchronization trigger used for new rows.
-- Existing legal/coin triggers are paused only for this deterministic backfill;
-- otherwise they correctly reject an UPDATE without an authenticated actor.
alter table public.appointments disable trigger enforce_appointment_flow_trigger;
alter table public.appointments disable trigger assign_attendance_agent_trigger;
alter table public.appointments disable trigger audit_appointment_flow_trigger;
alter table public.appointments disable trigger appointments_award_coin_events;
update public.appointments
set status = status
where property_id is not null and client_id is not null;
alter table public.appointments enable trigger enforce_appointment_flow_trigger;
alter table public.appointments enable trigger assign_attendance_agent_trigger;
alter table public.appointments enable trigger audit_appointment_flow_trigger;
alter table public.appointments enable trigger appointments_award_coin_events;

comment on table public.deal_rooms is 'Shared transaction workspace linking viewings, participants, offers, documents, signatures and next actions.';
comment on table public.crm_follow_ups is 'Agent CRM follow-up tasks with due dates and completion outcomes.';
comment on table public.property_daily_metrics is 'Owner-visible daily aggregate metrics; raw viewer identifiers remain private.';
comment on function public.record_property_view(uuid, text) is 'Privacy-preserving, once-per-property/day view counter. Raw browser keys are never stored.';
