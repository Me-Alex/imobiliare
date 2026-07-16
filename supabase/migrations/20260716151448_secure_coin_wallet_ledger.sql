-- Server-authoritative HQS loyalty wallet.
-- Users can read their own wallet history, but every balance mutation goes
-- through a narrowly scoped RPC or a verified database event.

create table public.coin_wallets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  lifetime_earned integer not null default 0 check (lifetime_earned >= 0),
  lifetime_spent integer not null default 0 check (lifetime_spent >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  last_claim_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.coin_wallets(user_id) on delete cascade,
  type text not null check (type in (
    'welcome_bonus',
    'daily_login',
    'daily_streak_bonus',
    'view_property',
    'favorite',
    'contact_form',
    'book_viewing',
    'complete_viewing',
    'newsletter',
    'add_property',
    'save_search',
    'price_alert',
    'reward_redemption',
    'admin_bonus'
  )),
  amount integer not null check (amount <> 0),
  balance_after integer not null check (balance_after >= 0),
  description text not null check (char_length(description) between 1 and 240),
  related_id text,
  idempotency_key text,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create table public.coin_reward_catalog (
  id text primary key,
  title text not null check (char_length(title) between 1 and 120),
  description text not null check (char_length(description) between 1 and 400),
  cost integer not null check (cost > 0),
  icon text not null,
  category text not null check (category in ('listing', 'service', 'discount')),
  duration text,
  value text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coin_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.coin_wallets(user_id) on delete cascade,
  reward_id text not null references public.coin_reward_catalog(id) on delete restrict,
  reward_snapshot jsonb not null,
  cost integer not null check (cost > 0),
  status text not null default 'REQUESTED' check (status in ('REQUESTED', 'FULFILLED', 'REJECTED', 'CANCELLED')),
  requested_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolution_note text,
  updated_at timestamptz not null default now()
);

create index coin_transactions_user_created_idx
  on public.coin_transactions (user_id, created_at desc);
create index coin_transactions_user_type_created_idx
  on public.coin_transactions (user_id, type, created_at desc);
create index coin_redemptions_user_requested_idx
  on public.coin_redemptions (user_id, requested_at desc);
create index coin_redemptions_reward_id_idx
  on public.coin_redemptions (reward_id);
create index coin_redemptions_resolved_by_idx
  on public.coin_redemptions (resolved_by)
  where resolved_by is not null;

insert into public.coin_reward_catalog
  (id, title, description, cost, icon, category, duration, value, active, sort_order)
values
  ('reward-valuation', 'Raport evaluare premium', 'Primești un raport detaliat de evaluare cu analiză de piață și proprietăți comparabile.', 100, 'FileBarChart2', 'service', null, null, true, 10),
  ('reward-highlight-30', 'Evidențiere proprietate', 'Proprietatea eligibilă primește evidențiere în platformă timp de 30 de zile, după verificarea echipei.', 150, 'Sparkles', 'listing', '30 zile', null, true, 20),
  ('reward-priority', 'Suport prioritar', 'Solicitările tale sunt direcționate cu prioritate către echipă timp de 30 de zile.', 200, 'Headphones', 'service', '30 zile', null, true, 30),
  ('reward-voucher-5', 'Voucher 5% reducere', 'Reducere de 5% aplicabilă unui serviciu eligibil, conform confirmării scrise a agenției.', 300, 'Ticket', 'discount', null, '5% reducere', true, 40),
  ('reward-featured-7', 'Anunț promovat', 'O proprietate eligibilă apare în secțiunea recomandată timp de 7 zile, după aprobarea echipei.', 500, 'Star', 'listing', '7 zile', null, true, 50),
  ('reward-voucher-10', 'Voucher 10% reducere', 'Reducere de 10% aplicabilă unui serviciu eligibil, conform confirmării scrise a agenției.', 500, 'TicketPercent', 'discount', null, '10% reducere', true, 60);

alter table public.coin_wallets enable row level security;
alter table public.coin_transactions enable row level security;
alter table public.coin_reward_catalog enable row level security;
alter table public.coin_redemptions enable row level security;

create policy coin_wallets_select_own_or_admin
  on public.coin_wallets for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin_user()));

create policy coin_transactions_select_own_or_admin
  on public.coin_transactions for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin_user()));

create policy coin_rewards_select_active_or_admin
  on public.coin_reward_catalog for select to authenticated
  using (active or (select public.is_admin_user()));

create policy coin_redemptions_select_own_or_admin
  on public.coin_redemptions for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin_user()));

revoke all on public.coin_wallets from anon, authenticated;
revoke all on public.coin_transactions from anon, authenticated;
revoke all on public.coin_reward_catalog from anon, authenticated;
revoke all on public.coin_redemptions from anon, authenticated;
grant select on public.coin_wallets to authenticated;
grant select on public.coin_transactions to authenticated;
grant select on public.coin_reward_catalog to authenticated;
grant select on public.coin_redemptions to authenticated;

create or replace function private.touch_coin_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger coin_wallets_touch_updated_at
before update on public.coin_wallets
for each row execute function private.touch_coin_updated_at();

create trigger coin_reward_catalog_touch_updated_at
before update on public.coin_reward_catalog
for each row execute function private.touch_coin_updated_at();

create trigger coin_redemptions_touch_updated_at
before update on public.coin_redemptions
for each row execute function private.touch_coin_updated_at();

create or replace function private.ensure_coin_wallet(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_created boolean := false;
begin
  if p_user_id is null or not exists (
    select 1 from public.profiles p
    where p.id = p_user_id and coalesce(p.is_active, true)
  ) then
    raise exception 'COIN_PROFILE_REQUIRED' using errcode = '42501';
  end if;

  insert into public.coin_wallets (user_id, balance, lifetime_earned)
  values (p_user_id, 25, 25)
  on conflict (user_id) do nothing;
  v_created := found;

  if v_created then
    insert into public.coin_transactions
      (user_id, type, amount, balance_after, description, idempotency_key)
    values
      (p_user_id, 'welcome_bonus', 25, 25, 'Bonus de bun venit HQS Monede', 'welcome:v1');
  end if;
end;
$$;

create or replace function private.apply_coin_credit(
  p_user_id uuid,
  p_type text,
  p_amount integer,
  p_description text,
  p_related_id text,
  p_idempotency_key text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance integer;
begin
  if p_amount <= 0 then
    raise exception 'COIN_CREDIT_MUST_BE_POSITIVE' using errcode = '22023';
  end if;

  perform private.ensure_coin_wallet(p_user_id);

  select w.balance into v_balance
  from public.coin_wallets w
  where w.user_id = p_user_id
  for update;

  if p_idempotency_key is not null and exists (
    select 1 from public.coin_transactions t
    where t.user_id = p_user_id and t.idempotency_key = p_idempotency_key
  ) then
    return 0;
  end if;

  v_balance := v_balance + p_amount;

  update public.coin_wallets
  set balance = v_balance,
      lifetime_earned = lifetime_earned + p_amount
  where user_id = p_user_id;

  insert into public.coin_transactions
    (user_id, type, amount, balance_after, description, related_id, idempotency_key)
  values
    (p_user_id, p_type, p_amount, v_balance, left(p_description, 240), p_related_id, p_idempotency_key);

  return p_amount;
end;
$$;

create or replace function private.coin_account_json(p_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'wallet', jsonb_build_object(
      'balance', w.balance,
      'lifetimeEarned', w.lifetime_earned,
      'lifetimeSpent', w.lifetime_spent,
      'currentStreak', w.current_streak,
      'lastClaimDate', coalesce(w.last_claim_on::text, '')
    ),
    'transactions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id,
        'type', t.type,
        'amount', t.amount,
        'balanceAfter', t.balance_after,
        'description', t.description,
        'timestamp', t.created_at,
        'relatedId', t.related_id
      ) order by t.created_at desc)
      from (
        select * from public.coin_transactions
        where user_id = p_user_id
        order by created_at desc
        limit 200
      ) t
    ), '[]'::jsonb),
    'rewards', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id,
        'title', r.title,
        'description', r.description,
        'cost', r.cost,
        'icon', r.icon,
        'category', r.category,
        'duration', r.duration,
        'value', r.value
      ) order by r.sort_order, r.cost)
      from public.coin_reward_catalog r
      where r.active
    ), '[]'::jsonb),
    'redemptions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', d.id,
        'rewardId', d.reward_id,
        'title', d.reward_snapshot ->> 'title',
        'cost', d.cost,
        'status', d.status,
        'requestedAt', d.requested_at,
        'resolvedAt', d.resolved_at,
        'resolutionNote', d.resolution_note
      ) order by d.requested_at desc)
      from (
        select * from public.coin_redemptions
        where user_id = p_user_id
        order by requested_at desc
        limit 50
      ) d
    ), '[]'::jsonb)
  )
  from public.coin_wallets w
  where w.user_id = p_user_id;
$$;

create or replace function public.get_coin_account()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;
  perform private.ensure_coin_wallet(v_user_id);
  return private.coin_account_json(v_user_id);
end;
$$;

create or replace function public.claim_daily_coin_reward()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_today date := (now() at time zone 'Europe/Bucharest')::date;
  v_wallet public.coin_wallets%rowtype;
  v_streak integer;
  v_earned integer := 0;
begin
  if v_user_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  perform private.ensure_coin_wallet(v_user_id);
  select * into v_wallet
  from public.coin_wallets
  where user_id = v_user_id
  for update;

  if v_wallet.last_claim_on = v_today then
    return private.coin_account_json(v_user_id) || jsonb_build_object(
      'earned', 0,
      'alreadyClaimed', true
    );
  end if;

  v_streak := case
    when v_wallet.last_claim_on = v_today - 1 then v_wallet.current_streak + 1
    else 1
  end;

  update public.coin_wallets
  set current_streak = v_streak,
      last_claim_on = v_today
  where user_id = v_user_id;

  v_earned := v_earned + private.apply_coin_credit(
    v_user_id,
    'daily_login',
    5,
    format('Recompensă zilnică — ziua %s', v_streak),
    v_today::text,
    'daily:' || v_today::text
  );

  if v_streak % 3 = 0 then
    v_earned := v_earned + private.apply_coin_credit(
      v_user_id,
      'daily_streak_bonus',
      10,
      format('Bonus pentru %s zile consecutive', v_streak),
      v_today::text,
      'streak:' || v_today::text
    );
  end if;

  return private.coin_account_json(v_user_id) || jsonb_build_object(
    'earned', v_earned,
    'alreadyClaimed', false
  );
end;
$$;

create or replace function public.award_coin_action(
  p_action text,
  p_related_id text default null,
  p_description text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_action text := lower(trim(coalesce(p_action, '')));
  v_related_id text := nullif(trim(coalesce(p_related_id, '')), '');
  v_today date := (now() at time zone 'Europe/Bucharest')::date;
  v_amount integer;
  v_daily_limit integer;
  v_description text;
  v_idempotency_key text;
  v_count integer;
  v_property_id uuid;
  v_earned integer;
begin
  if v_user_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  select x.amount, x.daily_limit, x.description
  into v_amount, v_daily_limit, v_description
  from (values
    ('view_property', 1, 20, 'Vizualizare proprietate'),
    ('favorite', 3, 20, 'Proprietate adăugată la favorite'),
    ('contact_form', 10, 3, 'Mesaj de contact trimis'),
    ('newsletter', 20, 1, 'Abonare la newsletter'),
    ('add_property', 10, 5, 'Proprietate adăugată'),
    ('save_search', 5, 10, 'Căutare salvată'),
    ('price_alert', 5, 10, 'Alertă de preț creată')
  ) as x(action, amount, daily_limit, description)
  where x.action = v_action;

  if v_amount is null then
    raise exception 'COIN_ACTION_NOT_ALLOWED' using errcode = '22023';
  end if;

  if v_action in ('view_property', 'favorite', 'add_property') then
    begin
      v_property_id := v_related_id::uuid;
    exception when invalid_text_representation then
      raise exception 'VALID_PROPERTY_REQUIRED' using errcode = '22023';
    end;

    if not exists (select 1 from public.properties p where p.id = v_property_id) then
      raise exception 'VALID_PROPERTY_REQUIRED' using errcode = '22023';
    end if;

    if v_action = 'add_property' and not exists (
      select 1 from public.properties p
      where p.id = v_property_id
        and (p.owner_id = v_user_id or p.agent_id = v_user_id)
    ) then
      raise exception 'PROPERTY_OWNERSHIP_REQUIRED' using errcode = '42501';
    end if;
  elsif v_action <> 'newsletter' and v_related_id is null then
    raise exception 'COIN_EVENT_ID_REQUIRED' using errcode = '22023';
  end if;

  v_idempotency_key := case
    when v_action = 'newsletter' then 'newsletter:v1'
    else v_action || ':' || v_related_id
  end;

  perform private.ensure_coin_wallet(v_user_id);
  perform 1 from public.coin_wallets where user_id = v_user_id for update;

  if exists (
    select 1 from public.coin_transactions t
    where t.user_id = v_user_id and t.idempotency_key = v_idempotency_key
  ) then
    return private.coin_account_json(v_user_id) || jsonb_build_object(
      'earned', 0,
      'reason', 'duplicate'
    );
  end if;

  select count(*)::integer into v_count
  from public.coin_transactions t
  where t.user_id = v_user_id
    and t.type = v_action
    and (t.created_at at time zone 'Europe/Bucharest')::date = v_today;

  if v_count >= v_daily_limit then
    return private.coin_account_json(v_user_id) || jsonb_build_object(
      'earned', 0,
      'reason', 'daily_limit'
    );
  end if;

  v_earned := private.apply_coin_credit(
    v_user_id,
    v_action,
    v_amount,
    coalesce(nullif(trim(coalesce(p_description, '')), ''), v_description),
    v_related_id,
    v_idempotency_key
  );

  return private.coin_account_json(v_user_id) || jsonb_build_object(
    'earned', v_earned,
    'reason', 'awarded'
  );
end;
$$;

create or replace function public.redeem_coin_reward(p_reward_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_reward public.coin_reward_catalog%rowtype;
  v_balance integer;
  v_redemption_id uuid;
begin
  if v_user_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  select * into v_reward
  from public.coin_reward_catalog r
  where r.id = p_reward_id and r.active;

  if not found then
    raise exception 'REWARD_NOT_AVAILABLE' using errcode = '22023';
  end if;

  perform private.ensure_coin_wallet(v_user_id);
  select balance into v_balance
  from public.coin_wallets
  where user_id = v_user_id
  for update;

  if v_balance < v_reward.cost then
    raise exception 'INSUFFICIENT_COINS' using errcode = '22003';
  end if;

  insert into public.coin_redemptions
    (user_id, reward_id, reward_snapshot, cost)
  values
    (v_user_id, v_reward.id, to_jsonb(v_reward), v_reward.cost)
  returning id into v_redemption_id;

  v_balance := v_balance - v_reward.cost;
  update public.coin_wallets
  set balance = v_balance,
      lifetime_spent = lifetime_spent + v_reward.cost
  where user_id = v_user_id;

  insert into public.coin_transactions
    (user_id, type, amount, balance_after, description, related_id, idempotency_key)
  values
    (v_user_id, 'reward_redemption', -v_reward.cost, v_balance,
     left('Recompensă solicitată: ' || v_reward.title, 240), v_reward.id,
     'redemption:' || v_redemption_id::text);

  return private.coin_account_json(v_user_id) || jsonb_build_object(
    'redemptionId', v_redemption_id
  );
end;
$$;

create or replace function private.award_appointment_coins()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.client_id is null or not exists (
    select 1 from public.profiles p where p.id = new.client_id
  ) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    perform private.apply_coin_credit(
      new.client_id,
      'book_viewing',
      15,
      'Programare de vizionare creată',
      new.id::text,
      'appointment:booked:' || new.id::text
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

create trigger appointments_award_coin_events
after insert or update of status on public.appointments
for each row execute function private.award_appointment_coins();

revoke all on function private.touch_coin_updated_at() from public, anon, authenticated;
revoke all on function private.ensure_coin_wallet(uuid) from public, anon, authenticated;
revoke all on function private.apply_coin_credit(uuid, text, integer, text, text, text) from public, anon, authenticated;
revoke all on function private.coin_account_json(uuid) from public, anon, authenticated;
revoke all on function private.award_appointment_coins() from public, anon, authenticated;

revoke all on function public.get_coin_account() from public, anon, authenticated;
revoke all on function public.claim_daily_coin_reward() from public, anon, authenticated;
revoke all on function public.award_coin_action(text, text, text) from public, anon, authenticated;
revoke all on function public.redeem_coin_reward(text) from public, anon, authenticated;
grant execute on function public.get_coin_account() to authenticated;
grant execute on function public.claim_daily_coin_reward() to authenticated;
grant execute on function public.award_coin_action(text, text, text) to authenticated;
grant execute on function public.redeem_coin_reward(text) to authenticated;

comment on table public.coin_wallets is 'Server-authoritative HQS Monede balances, one wallet per authenticated profile.';
comment on table public.coin_transactions is 'Immutable audit ledger for every HQS Monede balance change.';
comment on table public.coin_redemptions is 'Reward fulfillment requests created atomically when coins are spent.';
