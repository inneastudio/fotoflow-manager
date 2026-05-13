alter table public.projects
add column if not exists project_name text default '';
