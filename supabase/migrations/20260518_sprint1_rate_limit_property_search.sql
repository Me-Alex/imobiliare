create table if not exists public.rate_limits (
  scope text not null,
  identifier_hash text not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  reset_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (scope, identifier_hash, window_start)
);

alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

drop policy if exists "rate limits no direct access" on public.rate_limits;
create policy "rate limits no direct access" on public.rate_limits
  for all to anon, authenticated
  using (false)
  with check (false);

create index if not exists idx_rate_limits_updated_at on public.rate_limits(updated_at);

create or replace function public.check_rate_limit(
  p_scope text,
  p_identifier_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  request_count integer,
  retry_after integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_window_seconds integer := greatest(1, least(coalesce(p_window_seconds, 60), 86400));
  v_limit integer := greatest(1, least(coalesce(p_limit, 30), 10000));
  v_window_start timestamptz;
  v_reset_at timestamptz;
  v_count integer;
begin
  v_window_start := to_timestamp(floor(extract(epoch from v_now) / v_window_seconds) * v_window_seconds);
  v_reset_at := v_window_start + make_interval(secs => v_window_seconds);

  delete from public.rate_limits
  where updated_at < v_now - interval '2 days';

  insert into public.rate_limits(scope, identifier_hash, window_start, request_count, reset_at, updated_at)
  values (left(coalesce(p_scope, 'global'), 120), coalesce(p_identifier_hash, 'unknown'), v_window_start, 1, v_reset_at, v_now)
  on conflict (scope, identifier_hash, window_start)
  do update set
    request_count = public.rate_limits.request_count + 1,
    reset_at = excluded.reset_at,
    updated_at = excluded.updated_at
  returning public.rate_limits.request_count into v_count;

  return query
  select
    v_count <= v_limit,
    v_count,
    greatest(1, ceil(extract(epoch from (v_reset_at - v_now)))::integer),
    v_reset_at;
end;
$$;

revoke all on function public.check_rate_limit(text, text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, text, integer, integer) to anon;

alter table public.properties
  add column if not exists search_vector tsvector
  generated always as (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' ||
      coalesce(city, '') || ' ' ||
      coalesce(county, '') || ' ' ||
      coalesce(address, '') || ' ' ||
      coalesce(description, '')
    )
  ) stored;

create index if not exists idx_properties_public_filters
  on public.properties(status, type, city, rooms, price, area_sqm, created_at desc);

create index if not exists idx_properties_search_vector
  on public.properties using gin(search_vector);
