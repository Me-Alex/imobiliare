-- `total_floors` is collected in the property form and must survive a remote
-- reload just like the other physical characteristics of the listing.
alter table public.properties
  add column if not exists total_floors integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.properties'::regclass
      and conname = 'properties_total_floors_nonnegative_check'
  ) then
    alter table public.properties
      add constraint properties_total_floors_nonnegative_check
      check (total_floors is null or total_floors >= 0);
  end if;
end $$;
