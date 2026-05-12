-- Advanced platform systems for HQS Imobiliare.
-- Applied to Supabase project spmapzhlcwhzfrxuvgxd on 2026-05-12.

create table if not exists public.client_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null default 'Client HQS',
  email text,
  phone text,
  budget numeric not null default 250000,
  preferred_zones text[] not null default '{}',
  rooms integer not null default 2,
  purpose text not null default 'locuire',
  financing_status text not null default 'neconfirmat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  source text not null default 'portal',
  notes text,
  created_at timestamptz not null default now(),
  unique(user_id, property_id)
);

create table if not exists public.client_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  type text not null default 'act client',
  status text not null default 'PENDING',
  url text,
  expires_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.property_offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  property_title text not null,
  client_name text not null default 'Client HQS',
  client_email text,
  list_price numeric not null default 0,
  offer_price numeric not null default 0,
  advance_percent numeric not null default 20,
  closing_days integer not null default 30,
  status text not null default 'SUBMITTED',
  risk_level text not null default 'mediu',
  notes text,
  counter_offer numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_entries (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  section text not null default 'general',
  status text not null default 'PUBLISHED',
  content jsonb not null default '{}'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.zone_poi (
  id uuid primary key default gen_random_uuid(),
  zone text not null,
  name text not null,
  category text not null,
  minutes integer not null default 10,
  score integer not null default 80 check (score >= 0 and score <= 100),
  latitude numeric,
  longitude numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null default 'AGENT',
  permissions jsonb not null default '{}'::jsonb,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  status text not null default 'NOTE',
  score integer not null default 50,
  assigned_to text,
  note text,
  next_follow_up timestamptz,
  created_at timestamptz not null default now()
);

alter table public.client_profiles enable row level security;
alter table public.client_favorites enable row level security;
alter table public.client_documents enable row level security;
alter table public.property_offers enable row level security;
alter table public.cms_entries enable row level security;
alter table public.zone_poi enable row level security;
alter table public.admin_roles enable row level security;
alter table public.lead_history enable row level security;

create policy client_profiles_own_select on public.client_profiles for select using (auth.uid() = user_id);
create policy client_profiles_own_insert on public.client_profiles for insert with check (auth.uid() = user_id);
create policy client_profiles_own_update on public.client_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy client_favorites_own_all on public.client_favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy client_documents_own_all on public.client_documents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy property_offers_own_select on public.property_offers for select using (auth.uid() = user_id);
create policy property_offers_own_insert on public.property_offers for insert with check (auth.uid() = user_id or user_id is null);
create policy property_offers_own_update on public.property_offers for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy cms_entries_public_read on public.cms_entries for select using (status = 'PUBLISHED');
create policy zone_poi_public_read on public.zone_poi for select using (true);

create index if not exists client_favorites_user_idx on public.client_favorites(user_id);
create index if not exists client_documents_user_idx on public.client_documents(user_id);
create index if not exists property_offers_status_idx on public.property_offers(status);
create index if not exists zone_poi_zone_idx on public.zone_poi(zone);
create index if not exists lead_history_lead_idx on public.lead_history(lead_id);

create or replace function public.admin_list_platform(admin_secret text) returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform public.admin_assert_secret(admin_secret);
  return jsonb_build_object(
    'client_profiles', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (select * from public.client_profiles limit 100) x), '[]'::jsonb),
    'client_documents', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (select * from public.client_documents limit 100) x), '[]'::jsonb),
    'property_offers', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (select * from public.property_offers limit 100) x), '[]'::jsonb),
    'cms_entries', coalesce((select jsonb_agg(to_jsonb(x) order by x.updated_at desc) from (select * from public.cms_entries limit 100) x), '[]'::jsonb),
    'zone_poi', coalesce((select jsonb_agg(to_jsonb(x) order by x.zone, x.score desc) from (select * from public.zone_poi limit 200) x), '[]'::jsonb),
    'admin_roles', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (select * from public.admin_roles limit 50) x), '[]'::jsonb),
    'lead_history', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (select * from public.lead_history limit 100) x), '[]'::jsonb)
  );
end;
$$;

grant execute on function public.admin_list_platform(text) to anon, authenticated;
