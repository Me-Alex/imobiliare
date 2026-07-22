-- Coin balances must be awarded from facts the database can verify. The old
-- generic browser RPC accepted an action name and arbitrary property id, which
-- let a signed-in user manufacture engagement rewards.

revoke all on function public.award_coin_action(text, text, text)
  from public, anon, authenticated;
grant execute on function public.award_coin_action(text, text, text) to service_role;

-- A viewing earns its booking reward only once staff accepts it. A pending
-- request is not evidence that a viewing will occur.
create or replace function private.award_appointment_coins()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.client_id is null or not exists (
    select 1 from public.profiles p
    where p.id = new.client_id and coalesce(p.is_active, true)
  ) then
    return new;
  end if;

  if tg_op = 'UPDATE'
    and upper(coalesce(new.status, '')) = 'CONFIRMED'
    and upper(coalesce(old.status, '')) in ('PENDING', 'REQUESTED') then
    perform private.apply_coin_credit(
      new.client_id,
      'book_viewing',
      15,
      'Programare de vizionare confirmată',
      new.id::text,
      'appointment:confirmed:' || new.id::text
    );
  elsif tg_op = 'UPDATE'
    and upper(coalesce(new.status, '')) = 'COMPLETED'
    and upper(coalesce(old.status, '')) <> 'COMPLETED' then
    perform private.apply_coin_credit(
      new.client_id,
      'complete_viewing',
      25,
      'Vizionare finalizată',
      new.id::text,
      'appointment:completed:' || new.id::text
    );
  end if;

  return new;
end;
$$;

-- Favorites are persisted under RLS before the reward is considered. The
-- idempotency key prevents a remove/re-add cycle from minting more coins.
create or replace function private.award_favorite_coin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Europe/Bucharest')::date;
  v_daily_count integer;
begin
  if new.user_id is null
    or new.property_id is null
    or not exists (
      select 1 from public.profiles profile
      where profile.id = new.user_id and coalesce(profile.is_active, true)
    )
    or not exists (
      select 1 from public.properties property
      where property.id = new.property_id and upper(property.status) = 'PUBLISHED'
    ) then
    return new;
  end if;

  perform private.ensure_coin_wallet(new.user_id);
  perform 1
  from public.coin_wallets wallet
  where wallet.user_id = new.user_id
  for update;

  select count(*)::integer
  into v_daily_count
  from public.coin_transactions transaction
  where transaction.user_id = new.user_id
    and transaction.type = 'favorite'
    and (transaction.created_at at time zone 'Europe/Bucharest')::date = v_today;

  if v_daily_count < 20 then
    perform private.apply_coin_credit(
      new.user_id,
      'favorite',
      3,
      'Proprietate adăugată la favorite',
      new.property_id::text,
      'favorite:' || new.user_id::text || ':' || new.property_id::text
    );
  end if;

  return new;
end;
$$;

drop trigger if exists client_favorites_award_coin_events on public.client_favorites;
create trigger client_favorites_award_coin_events
after insert on public.client_favorites
for each row execute function private.award_favorite_coin();

revoke all on function private.award_appointment_coins() from public, anon, authenticated;
revoke all on function private.award_favorite_coin() from public, anon, authenticated;
