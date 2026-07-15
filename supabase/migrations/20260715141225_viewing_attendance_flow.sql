-- Auditable viewing attendance flow. Booking acceptance is not evidence that a
-- viewing happened: only a staff check-in followed by completion unlocks the
-- viewing report.

create or replace function public.is_agent_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.profiles profile
      where profile.id = (select auth.uid())
        and profile.role = 'AGENT'
        and coalesce(profile.is_active, true)
    );
$$;

revoke all on function public.is_agent_user() from public, anon;
grant execute on function public.is_agent_user() to authenticated;

alter table public.appointments
  add column if not exists attendance_grace_minutes integer not null default 15,
  add column if not exists booking_terms_version text,
  add column if not exists booking_terms_accepted_at timestamptz,
  add column if not exists booking_terms_snapshot jsonb,
  add column if not exists privacy_notice_version text,
  add column if not exists checked_in_at timestamptz,
  add column if not exists checked_in_by uuid references public.profiles(id) on delete set null,
  add column if not exists completed_at timestamptz,
  add column if not exists completed_by uuid references public.profiles(id) on delete set null,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid references public.profiles(id) on delete set null,
  add column if not exists cancellation_reason text,
  add column if not exists no_show_marked_at timestamptz,
  add column if not exists no_show_marked_by uuid references public.profiles(id) on delete set null;

update public.appointments
set
  booking_terms_version = coalesce(booking_terms_version, 'LEGACY-IMPORT'),
  booking_terms_accepted_at = coalesce(booking_terms_accepted_at, created_at, requested_at, now()),
  booking_terms_snapshot = coalesce(
    booking_terms_snapshot,
    jsonb_build_object('legacy_import', true, 'notice', 'Programare creată înaintea jurnalului de consimțământ')
  ),
  privacy_notice_version = coalesce(privacy_notice_version, 'LEGACY-IMPORT'),
  completed_at = case
    when status in ('COMPLETED', 'DONE') then coalesce(completed_at, updated_at, end_at, now())
    else completed_at
  end,
  checked_in_at = case
    when status in ('COMPLETED', 'DONE') then coalesce(checked_in_at, start_at, requested_at)
    else checked_in_at
  end,
  cancelled_at = case
    when status in ('CANCELLED', 'CANCELED') then coalesce(cancelled_at, updated_at, now())
    else cancelled_at
  end;

alter table public.appointments
  alter column booking_terms_version set not null,
  alter column booking_terms_accepted_at set not null,
  alter column booking_terms_snapshot set not null,
  alter column privacy_notice_version set not null;

alter table public.appointments drop constraint if exists appointments_status_check;
alter table public.appointments drop constraint if exists appointments_attendance_grace_check;
alter table public.appointments drop constraint if exists appointments_booking_terms_snapshot_check;

alter table public.appointments
  add constraint appointments_status_check check (status in (
    'PENDING', 'REQUESTED', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'DONE',
    'CANCELLED', 'CANCELED', 'CANCELLED_BY_CLIENT', 'CANCELLED_BY_AGENT', 'NO_SHOW'
  )),
  add constraint appointments_attendance_grace_check
    check (attendance_grace_minutes between 0 and 120),
  add constraint appointments_booking_terms_snapshot_check
    check (jsonb_typeof(booking_terms_snapshot) = 'object');

create index if not exists appointments_operational_status_idx
  on public.appointments(status, start_at)
  where status in ('PENDING', 'REQUESTED', 'CONFIRMED', 'CHECKED_IN');

-- Staff members are authenticated, active AGENT profiles. They may operate the
-- agency agenda; clients and owners still see only appointments linked to them.
drop policy if exists appointments_participants_read on public.appointments;
create policy appointments_participants_read
on public.appointments for select
to authenticated
using (
  public.is_admin_user()
  or public.is_agent_user()
  or client_id = (select auth.uid())
  or agent_id = (select auth.uid())
  or (
    client_id is null
    and lower(coalesce(client_email, '')) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  )
  or exists (
    select 1
    from public.properties property
    where property.id = appointments.property_id
      and property.owner_id = (select auth.uid())
  )
);

drop policy if exists appointments_insert on public.appointments;
create policy appointments_insert
on public.appointments for insert
to authenticated
with check (
  public.is_admin_user()
  or (
    client_id = (select auth.uid())
    and lower(coalesce(client_email, '')) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
    and agent_id is null
    and status in ('PENDING', 'REQUESTED')
    and booking_terms_version <> 'LEGACY-IMPORT'
    and privacy_notice_version <> 'LEGACY-IMPORT'
  )
);

drop policy if exists appointments_agent_update on public.appointments;
drop policy if exists appointments_admin_update on public.appointments;
create policy appointments_staff_update
on public.appointments for update
to authenticated
using (public.is_admin_user() or public.is_agent_user())
with check (public.is_admin_user() or public.is_agent_user());

drop policy if exists appointments_client_cancel on public.appointments;
create policy appointments_client_cancel
on public.appointments for update
to authenticated
using (
  client_id = (select auth.uid())
  and status in ('PENDING', 'REQUESTED', 'CONFIRMED')
)
with check (
  client_id = (select auth.uid())
  and status = 'CANCELLED_BY_CLIENT'
);

drop policy if exists appointments_client_feedback on public.appointments;
create policy appointments_client_feedback
on public.appointments for update
to authenticated
using (client_id = (select auth.uid()) and status in ('COMPLETED', 'DONE'))
with check (client_id = (select auth.uid()) and status in ('COMPLETED', 'DONE'));

revoke update on table public.appointments from authenticated;
grant update (
  status, notes, rating, feedback, would_proceed, start_at, end_at,
  cancellation_reason, updated_at
) on table public.appointments to authenticated;

create or replace function private.enforce_appointment_flow()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  is_staff boolean := public.is_admin_user() or public.is_agent_user();
  is_service boolean := coalesce(current_setting('role', true), '') in ('postgres', 'service_role');
  agency_privacy_version text;
  earliest_check_in timestamptz;
  no_show_threshold timestamptz;
begin
  if tg_op = 'INSERT' then
    new.status := upper(coalesce(new.status, 'PENDING'));
    new.updated_at := coalesce(new.updated_at, now());

    if not is_service and not public.is_admin_user() then
      if actor is null or new.client_id is distinct from actor then
        raise exception 'Programarea trebuie creată pentru utilizatorul autentificat';
      end if;
      if new.status not in ('PENDING', 'REQUESTED') then
        raise exception 'Programarea nouă trebuie să fie în așteptare';
      end if;
      if coalesce(new.booking_terms_version, '') in ('', 'LEGACY-IMPORT')
        or coalesce(new.privacy_notice_version, '') in ('', 'LEGACY-IMPORT')
        or jsonb_typeof(new.booking_terms_snapshot) <> 'object'
        or new.booking_terms_snapshot ->> 'actual_viewing_required' <> 'true'
        or new.booking_terms_snapshot ->> 'no_automatic_penalty' <> 'true'
        or new.booking_terms_snapshot ->> 'privacy_notice_version' is distinct from new.privacy_notice_version
      then
        raise exception 'Regulile programării și informarea de confidențialitate trebuie acceptate';
      end if;

      select agency.privacy_notice_version
      into agency_privacy_version
      from public.agency_legal_profiles agency
      where agency.is_current and agency.status = 'ACTIVE';
      if not found or new.privacy_notice_version is distinct from agency_privacy_version then
        raise exception 'Informarea de confidențialitate a agenției nu este configurată sau versiunea nu corespunde';
      end if;
      new.booking_terms_accepted_at := now();
    end if;

    new.checked_in_at := null;
    new.checked_in_by := null;
    new.completed_at := null;
    new.completed_by := null;
    new.cancelled_at := null;
    new.cancelled_by := null;
    new.no_show_marked_at := null;
    new.no_show_marked_by := null;
    return new;
  end if;

  if is_service then
    return new;
  end if;

  if new.booking_terms_version is distinct from old.booking_terms_version
    or new.booking_terms_accepted_at is distinct from old.booking_terms_accepted_at
    or new.booking_terms_snapshot is distinct from old.booking_terms_snapshot
    or new.privacy_notice_version is distinct from old.privacy_notice_version
    or new.attendance_grace_minutes is distinct from old.attendance_grace_minutes
    or new.client_id is distinct from old.client_id
  then
    raise exception 'Datele acceptării programării sunt imuabile';
  end if;

  new.status := upper(coalesce(new.status, old.status));
  new.updated_at := now();
  earliest_check_in := old.start_at - interval '30 minutes';
  no_show_threshold := old.end_at + make_interval(mins => old.attendance_grace_minutes);

  if new.start_at is distinct from old.start_at or new.end_at is distinct from old.end_at then
    if not is_staff or old.status not in ('PENDING', 'REQUESTED', 'CONFIRMED') then
      raise exception 'Doar personalul poate reprograma o vizionare activă';
    end if;
    if new.start_at is null or new.end_at is null or new.end_at <= new.start_at then
      raise exception 'Intervalul reprogramat este invalid';
    end if;
  end if;

  if new.status is distinct from old.status then
    case new.status
      when 'CONFIRMED' then
        if not is_staff or old.status not in ('PENDING', 'REQUESTED') then
          raise exception 'Tranziție nepermisă către CONFIRMED';
        end if;
        new.confirmed_at := now();

      when 'CHECKED_IN' then
        if not is_staff or old.status <> 'CONFIRMED' then
          raise exception 'Prezența poate fi confirmată numai de personal, după confirmarea programării';
        end if;
        if old.start_at is null or old.end_at is null
          or now() < earliest_check_in
          or now() > no_show_threshold
        then
          raise exception 'Prezența poate fi înregistrată între 30 minute înainte și perioada de grație';
        end if;
        new.checked_in_at := now();
        new.checked_in_by := actor;

      when 'COMPLETED' then
        if not is_staff or old.status <> 'CHECKED_IN' or old.checked_in_at is null then
          raise exception 'Vizionarea poate fi finalizată numai după confirmarea prezenței';
        end if;
        new.completed_at := now();
        new.completed_by := actor;

      when 'NO_SHOW' then
        if not is_staff or old.status not in ('PENDING', 'REQUESTED', 'CONFIRMED') then
          raise exception 'Doar personalul poate marca neprezentarea unei programări active';
        end if;
        if old.end_at is null or now() < no_show_threshold then
          raise exception 'Neprezentarea poate fi marcată numai după interval și perioada de grație';
        end if;
        new.no_show_marked_at := now();
        new.no_show_marked_by := actor;

      when 'CANCELLED_BY_CLIENT' then
        if old.status not in ('PENDING', 'REQUESTED', 'CONFIRMED')
          or not (is_staff or actor = old.client_id)
        then
          raise exception 'Anularea de către client nu este permisă în starea curentă';
        end if;
        new.cancelled_at := now();
        new.cancelled_by := actor;
        new.cancellation_reason := coalesce(nullif(trim(new.cancellation_reason), ''), 'Anulare solicitată de client');

      when 'CANCELLED_BY_AGENT' then
        if not is_staff or old.status not in ('PENDING', 'REQUESTED', 'CONFIRMED', 'CHECKED_IN') then
          raise exception 'Doar personalul poate anula programarea în numele agenției';
        end if;
        if length(trim(coalesce(new.cancellation_reason, ''))) < 3 then
          raise exception 'Motivul anulării de către agenție este obligatoriu';
        end if;
        new.cancelled_at := now();
        new.cancelled_by := actor;

      else
        raise exception 'Tranziție de status nepermisă: % -> %', old.status, new.status;
    end case;
  elsif not is_staff then
    if old.status not in ('COMPLETED', 'DONE')
      or new.start_at is distinct from old.start_at
      or new.end_at is distinct from old.end_at
      or new.cancellation_reason is distinct from old.cancellation_reason
    then
      raise exception 'Clientul poate modifica numai feedbackul unei vizionări finalizate';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_appointment_flow_trigger on public.appointments;
create trigger enforce_appointment_flow_trigger
before insert or update on public.appointments
for each row execute function private.enforce_appointment_flow();

revoke all on function private.enforce_appointment_flow() from public, anon, authenticated;

create table if not exists public.appointment_events (
  id bigint generated always as identity primary key,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null check (event_type in (
    'REQUESTED', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED_BY_CLIENT',
    'CANCELLED_BY_AGENT', 'NO_SHOW', 'RESCHEDULED', 'FEEDBACK_SAVED', 'UPDATED'
  )),
  reason text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists appointment_events_appointment_created_idx
  on public.appointment_events(appointment_id, created_at desc);

alter table public.appointment_events enable row level security;

create policy appointment_events_participants_read
on public.appointment_events for select
to authenticated
using (
  exists (
    select 1
    from public.appointments appointment
    where appointment.id = appointment_events.appointment_id
      and (
        public.is_admin_user()
        or public.is_agent_user()
        or appointment.client_id = (select auth.uid())
        or appointment.agent_id = (select auth.uid())
        or exists (
          select 1 from public.properties property
          where property.id = appointment.property_id
            and property.owner_id = (select auth.uid())
        )
      )
  )
);

revoke all on table public.appointment_events from anon, authenticated;
grant select on table public.appointment_events to authenticated;

create or replace function private.audit_appointment_flow()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_event text;
  event_reason text;
  event_metadata jsonb := '{}'::jsonb;
begin
  if tg_op = 'INSERT' then
    next_event := 'REQUESTED';
    event_metadata := jsonb_build_object(
      'status', new.status,
      'booking_terms_version', new.booking_terms_version,
      'booking_terms_accepted_at', new.booking_terms_accepted_at,
      'privacy_notice_version', new.privacy_notice_version,
      'no_automatic_penalty', true,
      'actual_viewing_required_for_report', true
    );
  elsif new.status is distinct from old.status then
    next_event := case new.status
      when 'CONFIRMED' then 'CONFIRMED'
      when 'CHECKED_IN' then 'CHECKED_IN'
      when 'COMPLETED' then 'COMPLETED'
      when 'CANCELLED_BY_CLIENT' then 'CANCELLED_BY_CLIENT'
      when 'CANCELLED_BY_AGENT' then 'CANCELLED_BY_AGENT'
      when 'NO_SHOW' then 'NO_SHOW'
      else 'UPDATED'
    end;
    event_reason := case
      when new.status in ('CANCELLED_BY_CLIENT', 'CANCELLED_BY_AGENT') then new.cancellation_reason
      when new.status = 'NO_SHOW' then 'Clientul nu s-a prezentat până la expirarea perioadei de grație'
      else null
    end;
    event_metadata := jsonb_build_object('from_status', old.status, 'to_status', new.status);
  elsif new.start_at is distinct from old.start_at or new.end_at is distinct from old.end_at then
    next_event := 'RESCHEDULED';
    event_metadata := jsonb_build_object(
      'old_start_at', old.start_at, 'old_end_at', old.end_at,
      'new_start_at', new.start_at, 'new_end_at', new.end_at
    );
  elsif new.rating is distinct from old.rating
    or new.feedback is distinct from old.feedback
    or new.would_proceed is distinct from old.would_proceed
  then
    next_event := 'FEEDBACK_SAVED';
  else
    next_event := 'UPDATED';
  end if;

  insert into public.appointment_events(appointment_id, actor_id, event_type, reason, metadata)
  values (new.id, (select auth.uid()), next_event, event_reason, event_metadata);
  return new;
end;
$$;

drop trigger if exists audit_appointment_flow_trigger on public.appointments;
create trigger audit_appointment_flow_trigger
after insert or update on public.appointments
for each row execute function private.audit_appointment_flow();

revoke all on function private.audit_appointment_flow() from public, anon, authenticated;

-- A viewing report is a confirmation of an event that already happened. It
-- cannot be generated for a pending, cancelled or no-show appointment.
create or replace function private.validate_completed_viewing_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.type = 'vizionare_sign' then
    perform 1
    from public.appointments appointment
    where appointment.id = new.appointment_id
      and appointment.status in ('COMPLETED', 'DONE')
      and appointment.checked_in_at is not null
      and appointment.completed_at is not null;
    if not found then
      raise exception 'Fișa de vizionare poate fi creată numai după prezență și finalizarea vizionării';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists validate_completed_viewing_report_trigger on public.client_documents;
create trigger validate_completed_viewing_report_trigger
before insert on public.client_documents
for each row execute function private.validate_completed_viewing_report();

revoke all on function private.validate_completed_viewing_report() from public, anon, authenticated;

-- The report records the actual operational timestamps, not merely the slot
-- that was booked. A material template change always requires a fresh review.
update public.admin_document_templates
set
  body = replace(
    body,
    'Data și intervalul vizionării: {{viewing_date}}, {{viewing_time}}',
    'Data și intervalul programat: {{viewing_date}}, {{viewing_time}}' || E'\n' ||
    'Prezență confirmată la: {{actual_check_in_at}}' || E'\n' ||
    'Vizionare finalizată la: {{actual_completed_at}}'
  ),
  required_fields = (
    select jsonb_agg(value order by position)
    from (
      select distinct on (value) value, position
      from jsonb_array_elements_text(
        required_fields || '["actual_check_in_at","actual_completed_at"]'::jsonb
      ) with ordinality as item(value, position)
      order by value, position
    ) deduplicated
  ),
  field_schema = field_schema || jsonb_build_object('attendance_source', 'appointments'),
  legal_version = 'RO-VIEWING-1.1',
  legal_review_status = 'REVIEW_REQUIRED',
  legal_reviewed_by = null,
  legal_reviewer_name = null,
  legal_reviewed_at = null,
  updated_at = now()
where type = 'viewing_report' and status = 'ACTIVE';
