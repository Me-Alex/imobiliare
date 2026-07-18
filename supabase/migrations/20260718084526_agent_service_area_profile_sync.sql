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
