alter table public.projects
add column if not exists wedding_video_provider_paid boolean not null default false;

notify pgrst, 'reload schema';
