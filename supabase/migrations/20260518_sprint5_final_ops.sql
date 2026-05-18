create table if not exists public.owner_feedback (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete set null,
  owner_email text not null,
  property_id uuid not null references public.properties(id) on delete cascade,
  rating integer not null default 5,
  category text not null default 'GENERAL',
  message text not null,
  status text not null default 'NEW',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint owner_feedback_rating_range check (rating between 1 and 5)
);

alter table public.owner_feedback enable row level security;
grant select, insert on public.owner_feedback to authenticated;
grant update, delete on public.owner_feedback to authenticated;

drop policy if exists "owner feedback own rows" on public.owner_feedback;
create policy "owner feedback own rows" on public.owner_feedback
  for select to authenticated
  using (lower(owner_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "owner feedback insert own properties" on public.owner_feedback;
create policy "owner feedback insert own properties" on public.owner_feedback
  for insert to authenticated
  with check (
    lower(owner_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and exists (
      select 1
      from public.properties p
      where p.id = owner_feedback.property_id
        and lower(p.owner_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists "admin request token all" on public.owner_feedback;
create policy "admin request token all" on public.owner_feedback
  for all to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

create index if not exists idx_owner_feedback_owner_created
  on public.owner_feedback(lower(owner_email), created_at desc);
create index if not exists idx_owner_feedback_property_created
  on public.owner_feedback(property_id, created_at desc);
create index if not exists idx_owner_feedback_status
  on public.owner_feedback(status, created_at desc);

insert into public.cms_entries(key, title, section, status, content, seo, updated_at)
select
  'zone.' || zone.slug || '.' || kind.slug as key,
  kind.title || ' in ' || zone.label as title,
  'programmatic-seo' as section,
  'PUBLISHED' as status,
  jsonb_build_object(
    'headline', kind.title || ' in ' || zone.label || ' cu date de piata HQS',
    'body', 'Pagina programatica pentru ' || lower(kind.title) || ' in ' || zone.label || ': proprietati active, pret/mp, randament, riscuri locale, documente si checklist de oferta.',
    'zone', zone.label,
    'property_type', kind.db_type,
    'faq', jsonb_build_array(
      jsonb_build_object('question', 'Cum estimeaza HQS pretul corect?', 'answer', 'Comparam pretul/mp cu Market Data, lichiditatea zonei, starea proprietatii si istoricul de tranzactii.'),
      jsonb_build_object('question', 'Ce verificari sunt incluse?', 'answer', 'Verificam documentele, sarcinile, costurile lunare, riscurile zonei si potentialul de revanzare sau inchiriere.')
    )
  ) as content,
  jsonb_build_object(
    'title', kind.title || ' in ' || zone.label || ' | HQS Imobiliare',
    'description', 'Ghid local pentru ' || lower(kind.title) || ' in ' || zone.label || ' cu proprietati active, date de piata si checklist HQS.'
  ) as seo,
  now() as updated_at
from (
  values
    ('pipera', 'Pipera'),
    ('floreasca', 'Floreasca'),
    ('baneasa', 'Baneasa'),
    ('herastrau', 'Herastrau'),
    ('aviatiei', 'Aviatiei'),
    ('primaverii', 'Primaverii')
) as zone(slug, label)
cross join (
  values
    ('apartamente', 'Apartamente', 'APARTMENT'),
    ('vile', 'Vile', 'VILLA'),
    ('case', 'Case', 'HOUSE'),
    ('penthouse-uri', 'Penthouse-uri', 'PENTHOUSE'),
    ('terenuri', 'Terenuri', 'LAND')
) as kind(slug, title, db_type)
on conflict (key) do nothing;
