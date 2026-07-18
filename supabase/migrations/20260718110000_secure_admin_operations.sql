-- Secure the administrative control plane and expose a narrowly scoped
-- redemption-resolution RPC. All authorization is based on the protected
-- profile role, never on user-editable metadata.

drop trigger if exists protect_profile_role_change on public.profiles;
create trigger protect_profile_role_change
before update of role on public.profiles
for each row execute function public.prevent_profile_role_change();

-- Legacy administrative helpers are internal jobs, not public RPCs. They are
-- intentionally unavailable to browser roles even when a caller knows their
-- function names.
do $$
declare
  procedure_name regprocedure;
begin
  for procedure_name in
    select proc.oid::regprocedure
    from pg_proc proc
    join pg_namespace namespace on namespace.oid = proc.pronamespace
    where namespace.nspname = 'public'
      and proc.proname in (
        'admin_log_module',
        'assert_admin_secret',
        'claim_admin_notification_outbox',
        'claim_admin_provider_jobs'
      )
  loop
    execute format(
      'revoke execute on function %s from public, anon, authenticated',
      procedure_name
    );
  end loop;
end;
$$;

-- RLS does not protect TRUNCATE. Restrict the legacy audit table to the two
-- operations the authenticated admin API actually needs.
revoke all on table public.admin_audit_log from anon, authenticated;
grant select, insert on table public.admin_audit_log to authenticated;

create or replace function private.resolve_coin_redemption_admin(
  p_redemption_id uuid,
  p_status text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  redemption public.coin_redemptions%rowtype;
  wallet_balance integer;
  next_status text := upper(trim(coalesce(p_status, '')));
  clean_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if (select auth.uid()) is null or not public.is_admin_user() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;

  if next_status not in ('FULFILLED', 'REJECTED') then
    raise exception 'INVALID_REDEMPTION_STATUS' using errcode = '22023';
  end if;

  if next_status = 'REJECTED' and clean_note is null then
    raise exception 'REJECTION_NOTE_REQUIRED' using errcode = '22023';
  end if;

  select * into redemption
  from public.coin_redemptions item
  where item.id = p_redemption_id
  for update;

  if not found then
    raise exception 'REDEMPTION_NOT_FOUND' using errcode = 'P0002';
  end if;

  if redemption.status <> 'REQUESTED' then
    raise exception 'REDEMPTION_ALREADY_RESOLVED' using errcode = '55000';
  end if;

  if next_status = 'REJECTED' then
    select balance into wallet_balance
    from public.coin_wallets wallet
    where wallet.user_id = redemption.user_id
    for update;

    if wallet_balance is null then
      raise exception 'COIN_WALLET_NOT_FOUND' using errcode = 'P0002';
    end if;

    wallet_balance := wallet_balance + redemption.cost;
    update public.coin_wallets
    set balance = wallet_balance,
        lifetime_spent = greatest(0, lifetime_spent - redemption.cost),
        updated_at = now()
    where user_id = redemption.user_id;

    insert into public.coin_transactions (
      user_id, type, amount, balance_after, description, related_id, idempotency_key
    ) values (
      redemption.user_id,
      'admin_bonus',
      redemption.cost,
      wallet_balance,
      left('Refund for rejected reward: ' || coalesce(redemption.reward_snapshot ->> 'title', redemption.reward_id), 240),
      redemption.id::text,
      'redemption-refund:' || redemption.id::text
    );
  end if;

  update public.coin_redemptions
  set status = next_status,
      resolved_at = now(),
      resolved_by = (select auth.uid()),
      resolution_note = clean_note,
      updated_at = now()
  where id = redemption.id;

  return jsonb_build_object(
    'id', redemption.id,
    'status', next_status,
    'refunded', next_status = 'REJECTED',
    'balance', case when next_status = 'REJECTED' then wallet_balance else null end
  );
end;
$$;

create or replace function public.admin_resolve_coin_redemption(
  p_redemption_id uuid,
  p_status text,
  p_note text default null
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.resolve_coin_redemption_admin(p_redemption_id, p_status, p_note);
$$;

revoke all on function private.resolve_coin_redemption_admin(uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.admin_resolve_coin_redemption(uuid, text, text)
  from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.resolve_coin_redemption_admin(uuid, text, text)
  to authenticated;
grant execute on function public.admin_resolve_coin_redemption(uuid, text, text)
  to authenticated;

comment on function public.admin_resolve_coin_redemption(uuid, text, text) is
  'Admin-only reward fulfillment. Rejections refund the wallet atomically.';
