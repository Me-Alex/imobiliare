-- The staff member who records physical presence becomes the responsible agent
-- for the appointment. This supplies the trusted second signer for the viewing
-- report even when legacy bookings were created without agent_id.
create or replace function private.assign_attendance_agent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'CHECKED_IN'
    and old.status = 'CONFIRMED'
    and (select auth.uid()) is not null
    and (public.is_admin_user() or public.is_agent_user())
  then
    new.agent_id := (select auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists assign_attendance_agent_trigger on public.appointments;
create trigger assign_attendance_agent_trigger
before update on public.appointments
for each row execute function private.assign_attendance_agent();

revoke all on function private.assign_attendance_agent() from public, anon, authenticated;
