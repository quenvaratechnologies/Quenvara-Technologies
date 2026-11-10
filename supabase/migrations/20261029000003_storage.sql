-- Quenvara Technology — Storage buckets and policies
--
-- public-media : intentionally public images (site assets). Staff with 'media' permission manage.
-- private-files: private (resumes etc.). No anon/authenticated INSERT policy exists:
--                uploads go through the server route using the service role after validation.
--                Reads happen via short-lived signed URLs issued after an authorization check,
--                and (defence in depth) staff with 'applications:read' may also read via RLS.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-media', 'public-media', true, 5242880,
   array['image/jpeg','image/png','image/webp','image/avif']),
  ('private-files', 'private-files', false, 5242880,
   array['application/pdf',
         'application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ----- public-media -----
create policy "public-media read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'public-media');

create policy "public-media staff insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'public-media' and public.has_permission('media', 'create'));

create policy "public-media staff update" on storage.objects for update to authenticated
  using (bucket_id = 'public-media' and public.has_permission('media', 'update'))
  with check (bucket_id = 'public-media' and public.has_permission('media', 'update'));

create policy "public-media staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'public-media' and public.has_permission('media', 'delete'));

-- ----- private-files -----
create policy "private-files staff read" on storage.objects for select to authenticated
  using (bucket_id = 'private-files' and public.has_permission('applications', 'read'));

create policy "private-files staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'private-files' and public.has_permission('applications', 'delete'));
-- Deliberately no INSERT/UPDATE policy for private-files: only service_role (server) writes.
