-- Appointments v2: Clean appointments table for the Vizionare & Document System.
-- This table replaces the legacy appointments workflow with a streamlined schema.

CREATE TABLE IF NOT EXISTS public.appointments_v2 (
  id uuid primary key default gen_random_uuid(),

  -- Client information
  client_id uuid references auth.users(id) on delete set null,
  client_name text not null,
  client_email text not null,
  client_phone text,

  -- Property information
  property_id uuid references public.properties(id) on delete set null,
  property_title text not null,

  -- Agent/staff information
  agent_id uuid references public.staff_members(id) on delete set null,
  agent_name text not null,

  -- Scheduling
  scheduled_at timestamptz not null,
  scheduled_end timestamptz not null,

  -- Status tracking
  status text not null default 'SCHEDULED'
    check (status in ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),

  -- Consent tracking
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  privacy_notice_version text,

  -- Google Calendar integration
  google_event_id text,
  google_calendar_synced boolean not null default false,

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  checked_in_at timestamptz,
  completed_at timestamptz,

  -- Constraints
  constraint appointments_v2_scheduled_end_check check (scheduled_end > scheduled_at)
);

-- Indexes for common query patterns
create index if not exists appointments_v2_client_id_idx on public.appointments_v2(client_id);
create index if not exists appointments_v2_agent_id_idx on public.appointments_v2(agent_id);
create index if not exists appointments_v2_property_id_idx on public.appointments_v2(property_id);
create index if not exists appointments_v2_status_idx on public.appointments_v2(status);
create index if not exists appointments_v2_scheduled_at_idx on public.appointments_v2(scheduled_at desc);
create index if not exists appointments_v2_google_event_id_idx on public.appointments_v2(google_event_id) where google_event_id is not null;

-- Updated_at trigger function
create or replace function public.appointments_v2_set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists appointments_v2_set_updated_at_trigger on public.appointments_v2;
create trigger appointments_v2_set_updated_at_trigger
  before update on public.appointments_v2
  for each row execute function public.appointments_v2_set_updated_at();

revoke all on function public.appointments_v2_set_updated_at() from public, anon, authenticated;
grant execute on function public.appointments_v2_set_updated_at() to authenticated, service_role;

-- Row Level Security
alter table public.appointments_v2 enable row level security;

-- Drop existing policies if any
do $$
declare
  policy_name text;
begin
  for policy_name in
    select pol.polname
    from pg_policy pol
    where pol.polrelid = 'public.appointments_v2'::regclass
  loop
    execute format('drop policy %I on public.appointments_v2', policy_name);
  end loop;
end $$;

-- Clients can read their own appointments
create policy appointments_v2_client_read
on public.appointments_v2 for select
to authenticated
using (
  client_id = (select auth.uid())
  or public.is_admin_user()
  or public.is_agent_user()
);

-- Clients can create their own appointments
create policy appointments_v2_client_insert
on public.appointments_v2 for insert
to authenticated
with check (
  client_id = (select auth.uid())
  and status = 'SCHEDULED'
);

-- Clients can update their own appointments (for cancellation)
create policy appointments_v2_client_update
on public.appointments_v2 for update
to authenticated
using (
  client_id = (select auth.uid())
  and status in ('SCHEDULED', 'CONFIRMED')
)
with check (
  client_id = (select auth.uid())
);

-- Agents and admins can manage appointments
create policy appointments_v2_staff_manage
on public.appointments_v2 for all
to authenticated
using (
  public.is_admin_user()
  or public.is_agent_user()
  or agent_id in (
    select id from public.staff_members
    where user_id = (select auth.uid())
  )
)
with check (
  public.is_admin_user()
  or public.is_agent_user()
  or agent_id in (
    select id from public.staff_members
    where user_id = (select auth.uid())
  )
);

-- Revoke and grant permissions
revoke all on table public.appointments_v2 from anon, authenticated;
grant select, insert, update on table public.appointments_v2 to authenticated;
grant delete on table public.appointments_v2 to authenticated;

-- Comments for documentation
comment on table public.appointments_v2 is 'Appointments table for the Vizionare & Document System';
comment on column public.appointments_v2.status is 'SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW';
comment on column public.appointments_v2.google_calendar_synced is 'Whether this appointment has been synced to Google Calendar';
