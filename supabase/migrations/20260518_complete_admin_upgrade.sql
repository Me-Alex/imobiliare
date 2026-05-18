-- Complete real-estate admin upgrade foundation.
-- Supabase CLI is not installed in this workspace, so this migration is created manually.

create extension if not exists pgcrypto;

-- Admin roles used by the Next.js admin API after Supabase Auth verifies the user.
create table if not exists public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null unique,
  role text not null default 'agent',
  permissions jsonb not null default '["leads","appointments","documents"]'::jsonb,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_roles add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.admin_roles add column if not exists status text not null default 'ACTIVE';
alter table public.admin_roles add column if not exists updated_at timestamptz not null default now();

-- Compatibility columns for direct service-role writes that replaced legacy ADMIN_RPC_SECRET RPCs.
alter table public.leads add column if not exists message text;
alter table public.leads add column if not exists score integer not null default 50;
alter table public.leads add column if not exists updated_at timestamptz not null default now();

alter table public.appointments add column if not exists client_name text;
alter table public.appointments add column if not exists client_email text;
alter table public.appointments add column if not exists client_phone text;
alter table public.appointments add column if not exists requested_at timestamptz;
alter table public.appointments add column if not exists start_at timestamptz;
alter table public.appointments add column if not exists end_at timestamptz;
alter table public.appointments add column if not exists notes text;
alter table public.appointments add column if not exists updated_at timestamptz not null default now();

alter table public.client_profiles add column if not exists status text not null default 'ACTIVE';

alter table public.admin_audit_log add column if not exists actor text;
alter table public.admin_audit_log add column if not exists details jsonb not null default '{}'::jsonb;
alter table public.admin_audit_log add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.admin_notification_outbox add column if not exists created_by text;
alter table public.admin_notification_outbox add column if not exists updated_at timestamptz not null default now();

-- Normalize the public properties table to the fields used by the admin and public site.
alter table public.properties add column if not exists currency text not null default 'EUR';
alter table public.properties add column if not exists city text;
alter table public.properties add column if not exists county text;
alter table public.properties add column if not exists area_sqm numeric;
alter table public.properties add column if not exists bathrooms integer;
alter table public.properties add column if not exists parking_spots integer not null default 0;
alter table public.properties add column if not exists amenities text[] not null default '{}';
alter table public.properties add column if not exists cover_image_url text;
alter table public.properties add column if not exists gallery_urls text[] not null default '{}';
alter table public.properties add column if not exists floorplan_urls text[] not null default '{}';
alter table public.properties add column if not exists transaction_type text;
alter table public.properties add column if not exists owner_email text;
alter table public.properties add column if not exists owner_id uuid;
alter table public.properties add column if not exists agent_email text;
alter table public.properties add column if not exists published_at timestamptz;

update public.properties
set
  area_sqm = coalesce(area_sqm, surface),
  bathrooms = coalesce(bathrooms, baths),
  transaction_type = coalesce(transaction_type, transaction),
  city = coalesce(city, zone, 'Bucuresti')
where area_sqm is null or bathrooms is null or transaction_type is null or city is null;

create table if not exists public.property_media (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  bucket text not null default 'property-media',
  path text not null,
  public_url text,
  kind text not null default 'gallery',
  alt text,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, path)
);

create table if not exists public.admin_modules (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  key text,
  payload jsonb not null default '{}'::jsonb,
  status text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_admin_modules_type_updated on public.admin_modules(type, updated_at desc);
create unique index if not exists idx_admin_modules_type_key_unique on public.admin_modules(type, key) where key is not null;

create table if not exists public.admin_provider_jobs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  action text not null,
  status text not null default 'QUEUED',
  target text,
  entity text,
  entity_id text,
  request jsonb not null default '{}'::jsonb,
  response jsonb not null default '{}'::jsonb,
  error text,
  provider_event_id text,
  attempts integer not null default 0,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists idx_admin_provider_jobs_event on public.admin_provider_jobs(provider, provider_event_id) where provider_event_id is not null;
create index if not exists idx_admin_provider_jobs_status on public.admin_provider_jobs(status, created_at desc);

create table if not exists public.admin_provider_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  event_type text,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now(),
  unique(provider, event_id)
);

create table if not exists public.admin_invoices (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'stripe',
  stripe_customer_id text,
  stripe_invoice_id text unique,
  hosted_invoice_url text,
  invoice_pdf text,
  client_email text,
  client_name text,
  property_id uuid references public.properties(id) on delete set null,
  amount numeric not null default 0,
  currency text not null default 'eur',
  status text not null default 'DRAFT',
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_commissions (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete set null,
  invoice_id uuid references public.admin_invoices(id) on delete set null,
  agent_email text,
  gross_amount numeric not null default 0,
  commission_rate numeric not null default 0,
  commission_amount numeric not null default 0,
  vat_amount numeric not null default 0,
  status text not null default 'PENDING',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_document_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'contract',
  body text,
  required_fields jsonb not null default '[]'::jsonb,
  status text not null default 'ACTIVE',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_document_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.admin_document_templates(id) on delete set null,
  client_document_id uuid references public.client_documents(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  docusign_envelope_id text,
  title text not null,
  version integer not null default 1,
  status text not null default 'DRAFT',
  file_url text,
  signer_email text,
  signer_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.owner_reports (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null,
  property_id uuid references public.properties(id) on delete cascade,
  title text not null,
  period_start date,
  period_end date,
  status text not null default 'DRAFT',
  summary text,
  metrics jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_owner_reports_email on public.owner_reports(lower(owner_email), created_at desc);

create table if not exists public.calendar_sync_events (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete cascade,
  provider text not null default 'google',
  provider_event_id text,
  calendar_id text,
  status text not null default 'PENDING',
  payload jsonb not null default '{}'::jsonb,
  response jsonb not null default '{}'::jsonb,
  error text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, provider_event_id)
);

create table if not exists public.analytics_attribution (
  id uuid primary key default gen_random_uuid(),
  source text,
  medium text,
  campaign text,
  content text,
  term text,
  entity text,
  entity_id text,
  lead_id uuid references public.leads(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  value numeric not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_analytics_attribution_source on public.analytics_attribution(source, campaign, created_at desc);

create table if not exists public.admin_bulk_imports (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  status text not null default 'PENDING',
  total_count integer not null default 0,
  success_count integer not null default 0,
  error_count integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public)
values ('property-media', 'property-media', true)
on conflict (id) do update set public = excluded.public;

alter table public.admin_roles enable row level security;
alter table public.property_media enable row level security;
alter table public.admin_modules enable row level security;
alter table public.admin_provider_jobs enable row level security;
alter table public.admin_provider_events enable row level security;
alter table public.admin_invoices enable row level security;
alter table public.admin_commissions enable row level security;
alter table public.admin_document_templates enable row level security;
alter table public.admin_document_versions enable row level security;
alter table public.owner_reports enable row level security;
alter table public.calendar_sync_events enable row level security;
alter table public.analytics_attribution enable row level security;
alter table public.admin_bulk_imports enable row level security;

-- Public property media can be read with public property listings; mutations go through service-role admin APIs.
drop policy if exists "property media public read" on public.property_media;
create policy "property media public read" on public.property_media for select using (true);

drop policy if exists "owner reports own rows" on public.owner_reports;
create policy "owner reports own rows" on public.owner_reports
for select to authenticated
using (lower(owner_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- Bucket object read policy for public listing media. Uploads are done with signed upload URLs generated by admin APIs.
drop policy if exists "property media public object read" on storage.objects;
create policy "property media public object read" on storage.objects
for select using (bucket_id = 'property-media');
