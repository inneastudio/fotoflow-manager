alter table public.projects
add column if not exists wedding_status_dates jsonb not null default '{}'::jsonb;

alter table public.projects
add column if not exists contract_file_url text default '';

alter table public.projects
add column if not exists timeline_file_url text default '';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-documents',
  'project-documents',
  true,
  10485760,
  array['application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Authenticated can read project documents" on storage.objects;
create policy "Authenticated can read project documents"
on storage.objects for select
to authenticated
using (bucket_id = 'project-documents');

drop policy if exists "Authenticated can upload project documents" on storage.objects;
create policy "Authenticated can upload project documents"
on storage.objects for insert
to authenticated
with check (bucket_id = 'project-documents');

drop policy if exists "Authenticated can update project documents" on storage.objects;
create policy "Authenticated can update project documents"
on storage.objects for update
to authenticated
using (bucket_id = 'project-documents')
with check (bucket_id = 'project-documents');

drop policy if exists "Authenticated can delete project documents" on storage.objects;
create policy "Authenticated can delete project documents"
on storage.objects for delete
to authenticated
using (bucket_id = 'project-documents');
