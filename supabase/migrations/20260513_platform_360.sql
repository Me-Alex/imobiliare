create extension if not exists pgcrypto;

create table if not exists public.client_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  email text,
  full_name text not null default 'Client HQS',
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
  user_id uuid not null,
  property_id uuid not null references public.properties(id) on delete cascade,
  source text not null default 'portal',
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, property_id)
);

create table if not exists public.client_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  type text not null default 'dosar client',
  status text not null default 'PENDING',
  url text,
  expires_at timestamptz,
  checklist jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.property_offers (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete set null,
  property_title text not null,
  user_id uuid,
  client_user_id uuid,
  client_name text,
  client_email text,
  client_phone text,
  offer_price numeric not null,
  list_price numeric not null default 0,
  advance_percent numeric not null default 20,
  closing_days integer not null default 30,
  risk_level text not null default 'mediu',
  status text not null default 'SUBMITTED',
  counter_offer numeric,
  terms jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_entries (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  section text not null default 'general',
  content jsonb not null default '{}'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.zone_poi (
  id uuid primary key default gen_random_uuid(),
  zone text not null,
  name text not null,
  category text not null,
  minutes integer not null default 5,
  score integer not null default 80,
  lat numeric,
  lng numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null default 'agent',
  permissions text[] not null default '{leads,appointments,documents}',
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  status text not null,
  score integer not null default 50,
  assigned_to text,
  note text,
  next_follow_up timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_client_profiles_user on public.client_profiles(user_id);
create index if not exists idx_client_favorites_user on public.client_favorites(user_id);
create index if not exists idx_client_documents_user_status on public.client_documents(user_id, status);
create index if not exists idx_property_offers_status on public.property_offers(status);
create index if not exists idx_property_offers_user on public.property_offers(user_id);
create index if not exists idx_cms_entries_key on public.cms_entries(key);
create index if not exists idx_zone_poi_zone_score on public.zone_poi(zone, score desc);
create index if not exists idx_lead_history_lead on public.lead_history(lead_id, created_at desc);

alter table public.property_offers add column if not exists user_id uuid;
alter table public.property_offers add column if not exists advance_percent numeric not null default 20;
alter table public.property_offers add column if not exists closing_days integer not null default 30;
alter table public.property_offers add column if not exists risk_level text not null default 'mediu';

alter table public.client_profiles enable row level security;
alter table public.client_favorites enable row level security;
alter table public.client_documents enable row level security;
alter table public.property_offers enable row level security;
alter table public.cms_entries enable row level security;
alter table public.zone_poi enable row level security;
alter table public.admin_roles enable row level security;
alter table public.lead_history enable row level security;

drop policy if exists "client profiles own rows" on public.client_profiles;
create policy "client profiles own rows" on public.client_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "client favorites own rows" on public.client_favorites;
create policy "client favorites own rows" on public.client_favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "client documents own rows" on public.client_documents;
create policy "client documents own rows" on public.client_documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "client offers own rows" on public.property_offers;
create policy "client offers own rows" on public.property_offers
  for all using (auth.uid() = coalesce(user_id, client_user_id)) with check (auth.uid() = coalesce(user_id, client_user_id));

drop policy if exists "cms public read" on public.cms_entries;
create policy "cms public read" on public.cms_entries for select using (true);

drop policy if exists "zone poi public read" on public.zone_poi;
create policy "zone poi public read" on public.zone_poi for select using (true);

grant select, insert, update, delete on public.client_profiles to authenticated;
grant select, insert, update, delete on public.client_favorites to authenticated;
grant select, insert, update, delete on public.client_documents to authenticated;
grant select, insert, update, delete on public.property_offers to authenticated;
grant select on public.cms_entries to anon, authenticated;
grant select on public.zone_poi to anon, authenticated;

insert into public.cms_entries (key, title, section, content, seo)
values
  ('home.hero', 'Homepage hero', 'home', '{"headline":"Imobiliare clare pentru decizii bune","body":"Gasesti proprietati verificate, context de zona si pasi concreti pana la tranzactie."}'::jsonb, '{"title":"HQS Imobiliare","description":"Proprietati verificate, consultanta si administrare completa."}'::jsonb),
  ('home.faq', 'FAQ homepage', 'faq', '{"items":[{"q":"Cum programez o vizionare?","a":"Alegi proprietatea si completezi formularul de vizionare. Echipa confirma slotul disponibil."},{"q":"Pot salva favorite?","a":"Da, cu un cont client favoritele se salveaza in Supabase si raman disponibile pe orice dispozitiv."}]}'::jsonb, '{}'::jsonb)
on conflict (key) do nothing;

insert into public.zone_poi (zone, name, category, minutes, score, notes)
values
  ('Pipera', 'Scoala privata', 'educatie', 8, 91, 'Cerere ridicata pentru familii.'),
  ('Pipera', 'Hub birouri nord', 'business', 12, 88, 'Acces bun pentru expati si corporate.'),
  ('Floreasca', 'Parcul Floreasca', 'lifestyle', 6, 94, 'Atractiv pentru apartamente premium.'),
  ('Corbeanca', 'DN1 acces rapid', 'transport', 15, 82, 'Potrivit pentru case cu teren.')
on conflict do nothing;

insert into public.admin_roles (email, role, permissions)
values
  ('admin@hqsimobiliare.ro', 'admin', '{all}'),
  ('manager@hqsimobiliare.ro', 'manager', '{leads,appointments,offers,reports,cms}'),
  ('agent@hqsimobiliare.ro', 'agent', '{leads,appointments,documents}')
on conflict (email) do nothing;

create or replace function public.admin_secret_is_valid(admin_secret text)
returns boolean
language sql
stable
as $$
  select admin_secret is not null and admin_secret = 'hqs_rpc_20260511_8f4b2c9d7e31';
$$;

create or replace function public.admin_list_platform(admin_secret text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.admin_secret_is_valid(admin_secret) then
    raise exception 'invalid admin secret';
  end if;

  return jsonb_build_object(
    'client_profiles', coalesce((select jsonb_agg(row_to_json(t)) from (select * from public.client_profiles order by updated_at desc limit 200) t), '[]'::jsonb),
    'client_favorites', coalesce((select jsonb_agg(row_to_json(t)) from (select cf.*, p.title as property_title, p.city as property_city, p.price as property_price from public.client_favorites cf left join public.properties p on p.id = cf.property_id order by cf.created_at desc limit 400) t), '[]'::jsonb),
    'client_documents', coalesce((select jsonb_agg(row_to_json(t)) from (select * from public.client_documents order by created_at desc limit 300) t), '[]'::jsonb),
    'property_offers', coalesce((select jsonb_agg(row_to_json(t)) from (select * from public.property_offers order by created_at desc limit 300) t), '[]'::jsonb),
    'cms_entries', coalesce((select jsonb_agg(row_to_json(t)) from (select * from public.cms_entries order by updated_at desc) t), '[]'::jsonb),
    'zone_poi', coalesce((select jsonb_agg(row_to_json(t)) from (select * from public.zone_poi order by zone, score desc) t), '[]'::jsonb),
    'admin_roles', coalesce((select jsonb_agg(row_to_json(t)) from (select * from public.admin_roles order by role, email) t), '[]'::jsonb),
    'lead_history', coalesce((select jsonb_agg(row_to_json(t)) from (select * from public.lead_history order by created_at desc limit 300) t), '[]'::jsonb)
  );
end;
$$;

create or replace function public.admin_update_offer_status(admin_secret text, offer_id uuid, next_status text, counter numeric default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare updated_row public.property_offers;
begin
  if not public.admin_secret_is_valid(admin_secret) then
    raise exception 'invalid admin secret';
  end if;

  update public.property_offers
  set status = coalesce(next_status, status),
      counter_offer = coalesce(counter, counter_offer),
      updated_at = now()
  where id = offer_id
  returning * into updated_row;

  return to_jsonb(updated_row);
end;
$$;

create or replace function public.admin_upsert_cms_entry(admin_secret text, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare updated_row public.cms_entries;
begin
  if not public.admin_secret_is_valid(admin_secret) then
    raise exception 'invalid admin secret';
  end if;

  insert into public.cms_entries (key, title, section, content, seo, updated_at)
  values (
    payload->>'key',
    coalesce(payload->>'title', payload->>'key'),
    coalesce(payload->>'section', 'general'),
    coalesce(payload->'content', '{}'::jsonb),
    coalesce(payload->'seo', '{}'::jsonb),
    now()
  )
  on conflict (key) do update set
    title = excluded.title,
    section = excluded.section,
    content = excluded.content,
    seo = excluded.seo,
    updated_at = now()
  returning * into updated_row;

  return to_jsonb(updated_row);
end;
$$;

create or replace function public.admin_add_lead_history(admin_secret text, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare inserted_row public.lead_history;
begin
  if not public.admin_secret_is_valid(admin_secret) then
    raise exception 'invalid admin secret';
  end if;

  insert into public.lead_history (lead_id, status, score, assigned_to, note, next_follow_up)
  values (
    nullif(payload->>'lead_id', '')::uuid,
    coalesce(payload->>'status', 'FOLLOW_UP'),
    coalesce((payload->>'score')::integer, 50),
    payload->>'assigned_to',
    payload->>'note',
    nullif(payload->>'next_follow_up', '')::timestamptz
  )
  returning * into inserted_row;

  return to_jsonb(inserted_row);
end;
$$;

create or replace function public.admin_upsert_role(admin_secret text, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare updated_row public.admin_roles;
begin
  if not public.admin_secret_is_valid(admin_secret) then
    raise exception 'invalid admin secret';
  end if;

  insert into public.admin_roles (email, role, permissions, status, updated_at)
  values (
    payload->>'email',
    coalesce(payload->>'role', 'agent'),
    coalesce(array(select jsonb_array_elements_text(payload->'permissions')), array['leads','appointments','documents']),
    coalesce(payload->>'status', 'ACTIVE'),
    now()
  )
  on conflict (email) do update set
    role = excluded.role,
    permissions = excluded.permissions,
    status = excluded.status,
    updated_at = now()
  returning * into updated_row;

  return to_jsonb(updated_row);
end;
$$;

create or replace function public.admin_upsert_zone_poi(admin_secret text, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare updated_row public.zone_poi;
begin
  if not public.admin_secret_is_valid(admin_secret) then
    raise exception 'invalid admin secret';
  end if;

  insert into public.zone_poi (id, zone, name, category, minutes, score, lat, lng, notes, updated_at)
  values (
    coalesce(nullif(payload->>'id', '')::uuid, gen_random_uuid()),
    payload->>'zone',
    payload->>'name',
    coalesce(payload->>'category', 'general'),
    coalesce((payload->>'minutes')::integer, 5),
    coalesce((payload->>'score')::integer, 80),
    nullif(payload->>'lat', '')::numeric,
    nullif(payload->>'lng', '')::numeric,
    payload->>'notes',
    now()
  )
  on conflict (id) do update set
    zone = excluded.zone,
    name = excluded.name,
    category = excluded.category,
    minutes = excluded.minutes,
    score = excluded.score,
    lat = excluded.lat,
    lng = excluded.lng,
    notes = excluded.notes,
    updated_at = now()
  returning * into updated_row;

  return to_jsonb(updated_row);
end;
$$;

create or replace function public.admin_update_client_document_status(admin_secret text, document_id uuid, next_status text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare updated_row public.client_documents;
begin
  if not public.admin_secret_is_valid(admin_secret) then
    raise exception 'invalid admin secret';
  end if;

  update public.client_documents
  set status = coalesce(next_status, status),
      updated_at = now()
  where id = document_id
  returning * into updated_row;

  return to_jsonb(updated_row);
end;
$$;

grant execute on function public.admin_list_platform(text) to anon, authenticated;
grant execute on function public.admin_update_offer_status(text, uuid, text, numeric) to anon, authenticated;
grant execute on function public.admin_upsert_cms_entry(text, jsonb) to anon, authenticated;
grant execute on function public.admin_add_lead_history(text, jsonb) to anon, authenticated;
grant execute on function public.admin_upsert_role(text, jsonb) to anon, authenticated;
grant execute on function public.admin_upsert_zone_poi(text, jsonb) to anon, authenticated;
grant execute on function public.admin_update_client_document_status(text, uuid, text) to anon, authenticated;
