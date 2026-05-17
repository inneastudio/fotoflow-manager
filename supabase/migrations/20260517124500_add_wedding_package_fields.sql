alter table public.projects
add column if not exists wedding_package text default '';

alter table public.projects
add column if not exists wedding_package_price numeric(12, 2) not null default 0 check (wedding_package_price >= 0);

alter table public.projects
add column if not exists wedding_video_enabled boolean not null default false;

alter table public.projects
add column if not exists wedding_video_package text default '';

alter table public.projects
add column if not exists wedding_video_price numeric(12, 2) not null default 0 check (wedding_video_price >= 0);

alter table public.projects
add column if not exists wedding_photobooth_package text default '';

alter table public.projects
add column if not exists wedding_photobooth_price numeric(12, 2) not null default 0 check (wedding_photobooth_price >= 0);
