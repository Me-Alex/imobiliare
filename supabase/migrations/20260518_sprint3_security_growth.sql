-- Sprint 3: production hardening, owner RLS, market data, saved searches,
-- richer media metadata and safer bulk-import audit trails.

create extension if not exists pgcrypto;

-- Legacy admin-secret RPCs are kept for dependency compatibility but are no
-- longer executable directly by public API roles.
do $$
declare
  fn regprocedure;
begin
  for fn in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (
        p.proname = 'admin_secret_is_valid'
        or (
          p.proname like 'admin_%'
          and pg_get_function_arguments(p.oid) ilike '%admin_secret%'
        )
      )
  loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
  end loop;
end $$;

create table if not exists public.market_data (
  id uuid primary key default gen_random_uuid(),
  zone text not null unique,
  avg_price numeric not null default 0,
  rent_yield numeric not null default 0,
  liquidity integer not null default 70,
  growth numeric not null default 0,
  risk text not null default 'mediu',
  poi text[] not null default '{}',
  source text,
  effective_at date not null default current_date,
  status text not null default 'ACTIVE',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint market_data_liquidity_range check (liquidity between 0 and 100),
  constraint market_data_risk_check check (risk in ('scazut', 'mediu', 'ridicat'))
);

insert into public.market_data(zone, avg_price, rent_yield, liquidity, growth, risk, poi, source)
values
  ('Pipera', 2190, 5.6, 82, 8.4, 'mediu', array['scoli private','birouri','centura','restaurante'], 'seed'),
  ('Floreasca', 3010, 4.9, 91, 7.1, 'scazut', array['parc','mall','clinici','business'], 'seed'),
  ('Corbeanca', 1680, 4.1, 68, 6.2, 'mediu', array['teren','scoli','lac','aeroport'], 'seed'),
  ('Bucuresti Nord', 2450, 5.2, 86, 7.8, 'scazut', array['metrou','business','educatie','servicii'], 'seed')
on conflict (zone) do update set
  avg_price = excluded.avg_price,
  rent_yield = excluded.rent_yield,
  liquidity = excluded.liquidity,
  growth = excluded.growth,
  risk = excluded.risk,
  poi = excluded.poi,
  updated_at = now();

alter table public.market_data enable row level security;
grant select on public.market_data to anon, authenticated;
grant insert, update, delete on public.market_data to authenticated;

drop policy if exists "market data public active read" on public.market_data;
create policy "market data public active read" on public.market_data
  for select to anon, authenticated
  using (status = 'ACTIVE');

drop policy if exists "market data admin all" on public.market_data;
create policy "market data admin all" on public.market_data
  for all to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

create index if not exists idx_market_data_status_zone on public.market_data(status, zone);

create table if not exists public.client_saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  query text,
  filters jsonb not null default '{}'::jsonb,
  results_count integer not null default 0,
  notifications_enabled boolean not null default true,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, label)
);

alter table public.client_saved_searches enable row level security;
grant select, insert, update, delete on public.client_saved_searches to authenticated;

drop policy if exists "clients manage own saved searches" on public.client_saved_searches;
create policy "clients manage own saved searches" on public.client_saved_searches
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "saved searches admin all" on public.client_saved_searches;
create policy "saved searches admin all" on public.client_saved_searches
  for all to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

create index if not exists idx_client_saved_searches_user_updated on public.client_saved_searches(user_id, updated_at desc);
create index if not exists idx_client_saved_searches_filters on public.client_saved_searches using gin(filters);

alter table public.property_media add column if not exists thumbnail_url text;
alter table public.property_media add column if not exists mime_type text;
alter table public.property_media add column if not exists byte_size bigint;
alter table public.property_media add column if not exists width integer;
alter table public.property_media add column if not exists height integer;
alter table public.property_media add column if not exists checksum text;
alter table public.property_media add column if not exists review_status text not null default 'READY';
create unique index if not exists idx_property_media_checksum on public.property_media(property_id, checksum) where checksum is not null;

alter table public.admin_bulk_imports add column if not exists preview jsonb not null default '{}'::jsonb;
alter table public.admin_bulk_imports add column if not exists rollback_payload jsonb not null default '{}'::jsonb;

alter table public.admin_provider_events add column if not exists received_at timestamptz not null default now();
alter table public.admin_provider_events add column if not exists signature_status text not null default 'VERIFIED';

grant select on public.properties to authenticated;
drop policy if exists "owners read own properties" on public.properties;
create policy "owners read own properties" on public.properties
  for select to authenticated
  using (lower(coalesce(owner_email, '')) = lower(coalesce(auth.jwt() ->> 'email', '')));

grant select on public.owner_reports to authenticated;
drop policy if exists "owner reports own rows" on public.owner_reports;
drop policy if exists "owner reports own published rows" on public.owner_reports;
create policy "owner reports own published rows" on public.owner_reports
  for select to authenticated
  using (
    lower(owner_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and status in ('PUBLISHED', 'SENT', 'ACTIVE')
  );

grant select on public.admin_document_versions to authenticated;
drop policy if exists "owners read own document versions" on public.admin_document_versions;
create policy "owners read own document versions" on public.admin_document_versions
  for select to authenticated
  using (
    lower(coalesce(signer_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and status in ('SENT', 'SIGNED', 'COMPLETED', 'APPROVED')
  );
