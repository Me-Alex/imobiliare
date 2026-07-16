alter table public.properties
  add column if not exists lat double precision,
  add column if not exists lng double precision;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'properties_lat_range_check'
      and conrelid = 'public.properties'::regclass
  ) then
    alter table public.properties
      add constraint properties_lat_range_check
      check (lat is null or lat between -90 and 90);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'properties_lng_range_check'
      and conrelid = 'public.properties'::regclass
  ) then
    alter table public.properties
      add constraint properties_lng_range_check
      check (lng is null or lng between -180 and 180);
  end if;
end
$$;

comment on column public.properties.lat is
  'Latitude selected by the listing owner or agent on the publication map.';

comment on column public.properties.lng is
  'Longitude selected by the listing owner or agent on the publication map.';
