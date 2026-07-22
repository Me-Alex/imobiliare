-- Harden legacy public database surfaces that are not called by the current
-- application. This is deliberately additive to the production schema because
-- the historical migration timelines have not yet been reconciled.

begin;

-- The current application writes properties through its protected Supabase
-- workflow. The legacy table must not accept arbitrary anonymous inserts.
drop policy if exists "anyone can submit a listing" on public.listings;

create policy "authenticated users submit own listings"
on public.listings
for insert
to authenticated
with check (user_id = (select auth.uid()));

-- Retire legacy public booking and rate-limit functions. They accepted
-- caller-controlled identities and are not used by the current application.
revoke all on function public.book_appointment_slot(jsonb) from public, anon, authenticated;
revoke all on function public.book_appointment_slot(jsonb, uuid, text) from public, anon, authenticated;
revoke all on function public.public_create_appointment(jsonb) from public, anon, authenticated;
revoke all on function public.check_rate_limit(text, text, integer, integer) from public, anon, authenticated;

grant execute on function public.book_appointment_slot(jsonb) to service_role;
grant execute on function public.book_appointment_slot(jsonb, uuid, text) to service_role;
grant execute on function public.public_create_appointment(jsonb) to service_role;
grant execute on function public.check_rate_limit(text, text, integer, integer) to service_role;

-- A user may still switch their own account between CLIENT and OWNER. They
-- cannot enable their own inactive account or change any staff/admin role.
drop trigger if exists protect_profile_role_change on public.profiles;
drop trigger if exists trg_prevent_profile_role_change on public.profiles;

create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Trusted service operations do not carry an end-user JWT.
  if (select auth.uid()) is null then
    return new;
  end if;

  if public.is_admin_user() then
    return new;
  end if;

  if new.is_active is distinct from old.is_active then
    raise exception 'Not authorized to change account activation';
  end if;

  if new.role is distinct from old.role then
    if (select auth.uid()) = old.id
      and old.role in ('CLIENT', 'OWNER')
      and new.role in ('CLIENT', 'OWNER') then
      return new;
    end if;

    raise exception 'Not authorized to change account role';
  end if;

  return new;
end;
$$;

create trigger protect_profile_account_access_change
before update of role, is_active on public.profiles
for each row
execute function public.prevent_profile_role_change();

commit;
