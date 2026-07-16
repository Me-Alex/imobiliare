-- Public object URLs do not require a broad storage.objects SELECT policy.
-- Keep metadata reads scoped to the uploader (and administrators) so uploads
-- can return their rows without enabling anonymous bucket listing.

drop policy if exists "listing photos public read" on storage.objects;
drop policy if exists listing_photos_authenticated_read on storage.objects;
create policy listing_photos_authenticated_read
on storage.objects for select to authenticated
using (
  bucket_id = 'listing-photos'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or is_admin_user()
  )
);
