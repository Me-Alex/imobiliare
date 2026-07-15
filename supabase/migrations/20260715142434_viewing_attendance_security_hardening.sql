-- Keep the role helper subject to the caller's profile RLS. It only reads the
-- caller's own row and does not need elevated privileges.
alter function public.is_agent_user() security invoker;
revoke all on function public.is_agent_user() from public, anon;
grant execute on function public.is_agent_user() to authenticated;

-- One update policy avoids evaluating three permissive policies per row. The
-- transition trigger remains the final authority for allowed field changes.
drop policy if exists appointments_staff_update on public.appointments;
drop policy if exists appointments_client_cancel on public.appointments;
drop policy if exists appointments_client_feedback on public.appointments;

create policy appointments_update
on public.appointments for update
to authenticated
using (
  (select public.is_admin_user())
  or (select public.is_agent_user())
  or (
    client_id = (select auth.uid())
    and status in ('PENDING', 'REQUESTED', 'CONFIRMED', 'COMPLETED', 'DONE')
  )
)
with check (
  (select public.is_admin_user())
  or (select public.is_agent_user())
  or (
    client_id = (select auth.uid())
    and status in ('CANCELLED_BY_CLIENT', 'COMPLETED', 'DONE')
  )
);

drop policy if exists appointments_participants_read on public.appointments;
create policy appointments_participants_read
on public.appointments for select
to authenticated
using (
  (select public.is_admin_user())
  or (select public.is_agent_user())
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

drop policy if exists appointment_events_participants_read on public.appointment_events;
create policy appointment_events_participants_read
on public.appointment_events for select
to authenticated
using (
  exists (
    select 1
    from public.appointments appointment
    where appointment.id = appointment_events.appointment_id
      and (
        (select public.is_admin_user())
        or (select public.is_agent_user())
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

create index if not exists appointments_checked_in_by_idx
  on public.appointments(checked_in_by) where checked_in_by is not null;
create index if not exists appointments_completed_by_idx
  on public.appointments(completed_by) where completed_by is not null;
create index if not exists appointments_cancelled_by_idx
  on public.appointments(cancelled_by) where cancelled_by is not null;
create index if not exists appointments_no_show_marked_by_idx
  on public.appointments(no_show_marked_by) where no_show_marked_by is not null;
create index if not exists appointment_events_actor_id_idx
  on public.appointment_events(actor_id) where actor_id is not null;
