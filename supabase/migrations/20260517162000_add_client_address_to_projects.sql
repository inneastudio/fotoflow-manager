alter table public.projects
add column if not exists client_address text default '';
