alter table public.projects
add column if not exists wedding_photobooth_enabled boolean not null default false;
