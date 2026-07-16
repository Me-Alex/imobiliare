-- Virtual tour authoring, review and publication workflow.

alter table public.properties
  add column if not exists zone text,
  add column if not exists sector text;

create table if not exists public.virtual_tours (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null unique references public.properties(id) on delete cascade,
  provider text not null check (provider in ('MATTERPORT', 'KUULA', 'NATIVE')),
  external_url text,
  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED')),
  title text not null default 'Tur virtual',
  entry_scene_id uuid,
  created_by uuid not null references public.profiles(id) on delete restrict,
  reviewed_by uuid references public.profiles(id) on delete set null,
  review_note text check (review_note is null or char_length(review_note) <= 1000),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint virtual_tours_provider_payload_check check (
    (provider = 'NATIVE' and external_url is null)
    or
    (provider in ('MATTERPORT', 'KUULA') and external_url is not null)
  )
);

create table if not exists public.virtual_tour_scenes (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.virtual_tours(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  storage_bucket text not null check (storage_bucket in ('virtual-tour-drafts', 'virtual-tours')),
  storage_path text not null,
  image_url text,
  sort_order integer not null default 0 check (sort_order >= 0),
  initial_yaw double precision not null default 0 check (initial_yaw between -180 and 180),
  initial_pitch double precision not null default 0 check (initial_pitch between -90 and 90),
  initial_fov double precision not null default 100 check (initial_fov between 30 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tour_id, sort_order),
  unique (tour_id, storage_path)
);

create table if not exists public.virtual_tour_hotspots (
  id uuid primary key default gen_random_uuid(),
  scene_id uuid not null references public.virtual_tour_scenes(id) on delete cascade,
  target_scene_id uuid not null references public.virtual_tour_scenes(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 100),
  yaw double precision not null check (yaw between -180 and 180),
  pitch double precision not null check (pitch between -90 and 90),
  created_at timestamptz not null default now(),
  check (scene_id <> target_scene_id)
);

alter table public.virtual_tours
  drop constraint if exists virtual_tours_entry_scene_id_fkey;
alter table public.virtual_tours
  add constraint virtual_tours_entry_scene_id_fkey
  foreign key (entry_scene_id) references public.virtual_tour_scenes(id)
  on delete set null deferrable initially deferred;

create index if not exists virtual_tours_status_idx
  on public.virtual_tours (status, submitted_at desc);
create index if not exists virtual_tours_created_by_idx
  on public.virtual_tours (created_by, created_at desc);
create index if not exists virtual_tour_scenes_tour_sort_idx
  on public.virtual_tour_scenes (tour_id, sort_order);
create index if not exists virtual_tour_hotspots_scene_idx
  on public.virtual_tour_hotspots (scene_id);
create index if not exists virtual_tour_hotspots_target_idx
  on public.virtual_tour_hotspots (target_scene_id);

alter table public.virtual_tours enable row level security;
alter table public.virtual_tour_scenes enable row level security;
alter table public.virtual_tour_hotspots enable row level security;

grant select on table public.virtual_tours, public.virtual_tour_scenes, public.virtual_tour_hotspots to anon;
grant select, insert, update, delete on table public.virtual_tours, public.virtual_tour_scenes, public.virtual_tour_hotspots to authenticated;
grant all on table public.virtual_tours, public.virtual_tour_scenes, public.virtual_tour_hotspots to service_role;

drop policy if exists virtual_tours_public_read on public.virtual_tours;
create policy virtual_tours_public_read
on public.virtual_tours for select to anon
using (
  status = 'PUBLISHED'
  and exists (
    select 1 from public.properties property
    where property.id = virtual_tours.property_id
      and property.status = 'PUBLISHED'
  )
);

drop policy if exists virtual_tours_authenticated_read on public.virtual_tours;
create policy virtual_tours_authenticated_read
on public.virtual_tours for select to authenticated
using (
  (
    status = 'PUBLISHED'
    and exists (
      select 1 from public.properties property
      where property.id = virtual_tours.property_id
        and property.status = 'PUBLISHED'
    )
  )
  or is_admin_user()
  or exists (
    select 1 from public.properties property
    where property.id = virtual_tours.property_id
      and (
        property.owner_id = (select auth.uid())
        or property.agent_id = (select auth.uid())
      )
  )
);

drop policy if exists virtual_tours_authenticated_insert on public.virtual_tours;
create policy virtual_tours_authenticated_insert
on public.virtual_tours for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (is_admin_user() or status in ('DRAFT', 'IN_REVIEW'))
  and exists (
    select 1 from public.properties property
    where property.id = virtual_tours.property_id
      and (
        is_admin_user()
        or property.owner_id = (select auth.uid())
        or property.agent_id = (select auth.uid())
      )
  )
);

drop policy if exists virtual_tours_authenticated_update on public.virtual_tours;
create policy virtual_tours_authenticated_update
on public.virtual_tours for update to authenticated
using (
  is_admin_user()
  or exists (
    select 1 from public.properties property
    where property.id = virtual_tours.property_id
      and (
        property.owner_id = (select auth.uid())
        or property.agent_id = (select auth.uid())
      )
  )
)
with check (
  is_admin_user()
  or (
    created_by = (select auth.uid())
    and status in ('DRAFT', 'IN_REVIEW')
    and exists (
      select 1 from public.properties property
      where property.id = virtual_tours.property_id
        and (
          property.owner_id = (select auth.uid())
          or property.agent_id = (select auth.uid())
        )
    )
  )
);

drop policy if exists virtual_tours_authenticated_delete on public.virtual_tours;
create policy virtual_tours_authenticated_delete
on public.virtual_tours for delete to authenticated
using (
  is_admin_user()
  or exists (
    select 1 from public.properties property
    where property.id = virtual_tours.property_id
      and (
        property.owner_id = (select auth.uid())
        or property.agent_id = (select auth.uid())
      )
  )
);

drop policy if exists virtual_tour_scenes_public_read on public.virtual_tour_scenes;
create policy virtual_tour_scenes_public_read
on public.virtual_tour_scenes for select to anon
using (
  exists (
    select 1
    from public.virtual_tours tour
    join public.properties property on property.id = tour.property_id
    where tour.id = virtual_tour_scenes.tour_id
      and tour.status = 'PUBLISHED'
      and property.status = 'PUBLISHED'
  )
);

drop policy if exists virtual_tour_scenes_authenticated_read on public.virtual_tour_scenes;
create policy virtual_tour_scenes_authenticated_read
on public.virtual_tour_scenes for select to authenticated
using (
  exists (
    select 1
    from public.virtual_tours tour
    join public.properties property on property.id = tour.property_id
    where tour.id = virtual_tour_scenes.tour_id
      and (
        (tour.status = 'PUBLISHED' and property.status = 'PUBLISHED')
        or is_admin_user()
        or property.owner_id = (select auth.uid())
        or property.agent_id = (select auth.uid())
      )
  )
);

drop policy if exists virtual_tour_scenes_authenticated_insert on public.virtual_tour_scenes;
create policy virtual_tour_scenes_authenticated_insert
on public.virtual_tour_scenes for insert to authenticated
with check (
  exists (
    select 1
    from public.virtual_tours tour
    join public.properties property on property.id = tour.property_id
    where tour.id = virtual_tour_scenes.tour_id
      and (
        is_admin_user()
        or (
          tour.created_by = (select auth.uid())
          and tour.status in ('DRAFT', 'IN_REVIEW')
          and (
            property.owner_id = (select auth.uid())
            or property.agent_id = (select auth.uid())
          )
        )
      )
  )
);

drop policy if exists virtual_tour_scenes_authenticated_update on public.virtual_tour_scenes;
create policy virtual_tour_scenes_authenticated_update
on public.virtual_tour_scenes for update to authenticated
using (
  exists (
    select 1
    from public.virtual_tours tour
    join public.properties property on property.id = tour.property_id
    where tour.id = virtual_tour_scenes.tour_id
      and (
        is_admin_user()
        or (
          tour.created_by = (select auth.uid())
          and tour.status in ('DRAFT', 'IN_REVIEW')
          and (
            property.owner_id = (select auth.uid())
            or property.agent_id = (select auth.uid())
          )
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.virtual_tours tour
    join public.properties property on property.id = tour.property_id
    where tour.id = virtual_tour_scenes.tour_id
      and (
        is_admin_user()
        or (
          tour.created_by = (select auth.uid())
          and tour.status in ('DRAFT', 'IN_REVIEW')
          and (
            property.owner_id = (select auth.uid())
            or property.agent_id = (select auth.uid())
          )
        )
      )
  )
);

drop policy if exists virtual_tour_scenes_authenticated_delete on public.virtual_tour_scenes;
create policy virtual_tour_scenes_authenticated_delete
on public.virtual_tour_scenes for delete to authenticated
using (
  exists (
    select 1
    from public.virtual_tours tour
    join public.properties property on property.id = tour.property_id
    where tour.id = virtual_tour_scenes.tour_id
      and (
        is_admin_user()
        or (
          tour.created_by = (select auth.uid())
          and tour.status in ('DRAFT', 'IN_REVIEW')
          and (
            property.owner_id = (select auth.uid())
            or property.agent_id = (select auth.uid())
          )
        )
      )
  )
);

drop policy if exists virtual_tour_hotspots_public_read on public.virtual_tour_hotspots;
create policy virtual_tour_hotspots_public_read
on public.virtual_tour_hotspots for select to anon
using (
  exists (
    select 1
    from public.virtual_tour_scenes scene
    join public.virtual_tours tour on tour.id = scene.tour_id
    join public.properties property on property.id = tour.property_id
    where scene.id = virtual_tour_hotspots.scene_id
      and tour.status = 'PUBLISHED'
      and property.status = 'PUBLISHED'
  )
);

drop policy if exists virtual_tour_hotspots_authenticated_read on public.virtual_tour_hotspots;
create policy virtual_tour_hotspots_authenticated_read
on public.virtual_tour_hotspots for select to authenticated
using (
  exists (
    select 1
    from public.virtual_tour_scenes scene
    join public.virtual_tours tour on tour.id = scene.tour_id
    join public.properties property on property.id = tour.property_id
    where scene.id = virtual_tour_hotspots.scene_id
      and (
        (tour.status = 'PUBLISHED' and property.status = 'PUBLISHED')
        or is_admin_user()
        or property.owner_id = (select auth.uid())
        or property.agent_id = (select auth.uid())
      )
  )
);

drop policy if exists virtual_tour_hotspots_authenticated_insert on public.virtual_tour_hotspots;
create policy virtual_tour_hotspots_authenticated_insert
on public.virtual_tour_hotspots for insert to authenticated
with check (
  exists (
    select 1
    from public.virtual_tour_scenes scene
    join public.virtual_tours tour on tour.id = scene.tour_id
    join public.properties property on property.id = tour.property_id
    where scene.id = virtual_tour_hotspots.scene_id
      and virtual_tour_hotspots.target_scene_id in (
        select target.id from public.virtual_tour_scenes target where target.tour_id = tour.id
      )
      and (
        is_admin_user()
        or (
          tour.created_by = (select auth.uid())
          and tour.status in ('DRAFT', 'IN_REVIEW')
          and (
            property.owner_id = (select auth.uid())
            or property.agent_id = (select auth.uid())
          )
        )
      )
  )
);

drop policy if exists virtual_tour_hotspots_authenticated_update on public.virtual_tour_hotspots;
create policy virtual_tour_hotspots_authenticated_update
on public.virtual_tour_hotspots for update to authenticated
using (
  exists (
    select 1
    from public.virtual_tour_scenes scene
    join public.virtual_tours tour on tour.id = scene.tour_id
    join public.properties property on property.id = tour.property_id
    where scene.id = virtual_tour_hotspots.scene_id
      and (
        is_admin_user()
        or (
          tour.created_by = (select auth.uid())
          and tour.status in ('DRAFT', 'IN_REVIEW')
          and (
            property.owner_id = (select auth.uid())
            or property.agent_id = (select auth.uid())
          )
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.virtual_tour_scenes scene
    join public.virtual_tours tour on tour.id = scene.tour_id
    join public.properties property on property.id = tour.property_id
    where scene.id = virtual_tour_hotspots.scene_id
      and virtual_tour_hotspots.target_scene_id in (
        select target.id from public.virtual_tour_scenes target where target.tour_id = tour.id
      )
      and (
        is_admin_user()
        or (
          tour.created_by = (select auth.uid())
          and tour.status in ('DRAFT', 'IN_REVIEW')
          and (
            property.owner_id = (select auth.uid())
            or property.agent_id = (select auth.uid())
          )
        )
      )
  )
);

drop policy if exists virtual_tour_hotspots_authenticated_delete on public.virtual_tour_hotspots;
create policy virtual_tour_hotspots_authenticated_delete
on public.virtual_tour_hotspots for delete to authenticated
using (
  exists (
    select 1
    from public.virtual_tour_scenes scene
    join public.virtual_tours tour on tour.id = scene.tour_id
    join public.properties property on property.id = tour.property_id
    where scene.id = virtual_tour_hotspots.scene_id
      and (
        is_admin_user()
        or (
          tour.created_by = (select auth.uid())
          and tour.status in ('DRAFT', 'IN_REVIEW')
          and (
            property.owner_id = (select auth.uid())
            or property.agent_id = (select auth.uid())
          )
        )
      )
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('virtual-tour-drafts', 'virtual-tour-drafts', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('virtual-tours', 'virtual-tours', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "anyone upload listing photos" on storage.objects;
drop policy if exists listing_photos_authenticated_insert on storage.objects;
create policy listing_photos_authenticated_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'listing-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists listing_photos_authenticated_update on storage.objects;
create policy listing_photos_authenticated_update
on storage.objects for update to authenticated
using (
  bucket_id = 'listing-photos'
  and ((storage.foldername(name))[1] = (select auth.uid())::text or is_admin_user())
)
with check (
  bucket_id = 'listing-photos'
  and ((storage.foldername(name))[1] = (select auth.uid())::text or is_admin_user())
);

drop policy if exists listing_photos_authenticated_delete on storage.objects;
create policy listing_photos_authenticated_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'listing-photos'
  and ((storage.foldername(name))[1] = (select auth.uid())::text or is_admin_user())
);

drop policy if exists virtual_tour_drafts_authenticated_insert on storage.objects;
create policy virtual_tour_drafts_authenticated_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'virtual-tour-drafts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and current_account_role() in ('OWNER', 'AGENT', 'ADMIN')
);

drop policy if exists virtual_tour_drafts_authenticated_read on storage.objects;
create policy virtual_tour_drafts_authenticated_read
on storage.objects for select to authenticated
using (
  bucket_id = 'virtual-tour-drafts'
  and ((storage.foldername(name))[1] = (select auth.uid())::text or is_admin_user())
);

drop policy if exists virtual_tour_drafts_authenticated_update on storage.objects;
create policy virtual_tour_drafts_authenticated_update
on storage.objects for update to authenticated
using (
  bucket_id = 'virtual-tour-drafts'
  and ((storage.foldername(name))[1] = (select auth.uid())::text or is_admin_user())
)
with check (
  bucket_id = 'virtual-tour-drafts'
  and ((storage.foldername(name))[1] = (select auth.uid())::text or is_admin_user())
);

drop policy if exists virtual_tour_drafts_authenticated_delete on storage.objects;
create policy virtual_tour_drafts_authenticated_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'virtual-tour-drafts'
  and ((storage.foldername(name))[1] = (select auth.uid())::text or is_admin_user())
);

drop policy if exists virtual_tours_admin_insert on storage.objects;
create policy virtual_tours_admin_insert
on storage.objects for insert to authenticated
with check (bucket_id = 'virtual-tours' and is_admin_user());

drop policy if exists virtual_tours_admin_read on storage.objects;
create policy virtual_tours_admin_read
on storage.objects for select to authenticated
using (bucket_id = 'virtual-tours' and is_admin_user());

drop policy if exists virtual_tours_admin_update on storage.objects;
create policy virtual_tours_admin_update
on storage.objects for update to authenticated
using (bucket_id = 'virtual-tours' and is_admin_user())
with check (bucket_id = 'virtual-tours' and is_admin_user());

drop policy if exists virtual_tours_admin_delete on storage.objects;
create policy virtual_tours_admin_delete
on storage.objects for delete to authenticated
using (bucket_id = 'virtual-tours' and is_admin_user());
