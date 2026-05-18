-- Allow public appointment requests when the edge runtime does not have a service-role key.
-- Admin-only reads/updates remain protected by existing RLS policies.

grant insert on public.appointments to anon, authenticated;

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
