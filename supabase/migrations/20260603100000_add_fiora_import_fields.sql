alter table public.projects
add column if not exists external_source text,
add column if not exists external_id text;

create unique index if not exists projects_external_source_external_id_key
on public.projects (external_source, external_id);

create index if not exists projects_external_source_idx
on public.projects (external_source);

notify pgrst, 'reload schema';
