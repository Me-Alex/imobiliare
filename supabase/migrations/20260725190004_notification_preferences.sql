-- Notification Preferences: User notification settings.

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,

  -- Notification channels
  email_reminders boolean not null default true,
  sms_reminders boolean not null default true,
  whatsapp_notifications boolean not null default false,

  -- Reminder timing
  reminder_hours_before integer not null default 24
    check (reminder_hours_before > 0 and reminder_hours_before <= 168),  -- Max 7 days

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Constraints
  constraint notification_preferences_reminder_hours_check check (reminder_hours_before between 1 and 168)
);

-- Indexes
create index if not exists notification_preferences_user_id_idx on public.notification_preferences(user_id);

-- Updated_at trigger function
create or replace function public.notification_preferences_set_updated_at()
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

drop trigger if exists notification_preferences_set_updated_at_trigger on public.notification_preferences;
create trigger notification_preferences_set_updated_at_trigger
  before update on public.notification_preferences
  for each row execute function public.notification_preferences_set_updated_at();

revoke all on function public.notification_preferences_set_updated_at() from public, anon, authenticated;
grant execute on function public.notification_preferences_set_updated_at() to authenticated, service_role;

-- Row Level Security
alter table public.notification_preferences enable row level security;

-- Drop existing policies
do $$
declare
  policy_name text;
begin
  for policy_name in
    select pol.polname
    from pg_policy pol
    where pol.polrelid = 'public.notification_preferences'::regclass
  loop
    execute format('drop policy %I on public.notification_preferences', policy_name);
  end loop;
end $$;

-- Users can read their own preferences
create policy notification_preferences_own_read
on public.notification_preferences for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.is_admin_user()
);

-- Users can insert their own preferences
create policy notification_preferences_own_insert
on public.notification_preferences for insert
to authenticated
with check (
  user_id = (select auth.uid())
);

-- Users can update their own preferences
create policy notification_preferences_own_update
on public.notification_preferences for update
to authenticated
using (
  user_id = (select auth.uid())
)
with check (
  user_id = (select auth.uid())
);

-- Revoke and grant permissions
revoke all on table public.notification_preferences from anon, authenticated;
grant select, insert, update on table public.notification_preferences to authenticated;

-- Comments
comment on table public.notification_preferences is 'User notification preference settings';
comment on column public.notification_preferences.reminder_hours_before is 'Hours before appointment to send reminder (1-168)';
