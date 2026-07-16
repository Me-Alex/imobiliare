-- Only award browser-triggered actions that Supabase can validate or cap
-- deterministically. Appointment rewards are handled by database triggers.
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
    ('newsletter', 20, 1, 'Abonare la newsletter'),
    ('add_property', 10, 5, 'Proprietate adăugată')
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

    if not exists (
      select 1
      from public.properties p
      where p.id = v_property_id
        and (v_action = 'add_property' or upper(p.status) = 'PUBLISHED')
    ) then
      raise exception 'VALID_PROPERTY_REQUIRED' using errcode = '22023';
    end if;

    if v_action = 'add_property' and not exists (
      select 1 from public.properties p
      where p.id = v_property_id
        and (p.owner_id = v_user_id or p.agent_id = v_user_id)
    ) then
      raise exception 'PROPERTY_OWNERSHIP_REQUIRED' using errcode = '42501';
    end if;
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

revoke all on function public.award_coin_action(text, text, text) from public, anon, authenticated;
grant execute on function public.award_coin_action(text, text, text) to authenticated;
