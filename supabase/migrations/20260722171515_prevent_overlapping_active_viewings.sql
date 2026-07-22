-- A booking must reserve a real staff time range. Browser state is a usability
-- aid only; this database constraint is the authoritative guard against two
-- clients claiming the same agent and interval at the same time.
--
-- `btree_gist` provides the equality operator class for the text staff
-- reference alongside PostgreSQL's native timestamp-range overlap operator.
create extension if not exists btree_gist with schema extensions;

alter table public.appointments
  add constraint appointments_active_staff_time_excl
  exclude using gist (
    staff_reference with =,
    tstzrange(start_at, end_at, '[)') with &&
  )
  where (
    staff_reference is not null
    and start_at is not null
    and end_at is not null
    and status in ('PENDING', 'REQUESTED', 'CONFIRMED', 'CHECKED_IN')
  );
