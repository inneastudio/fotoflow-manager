alter table public.projects
add column if not exists wedding_extra_hours numeric(8, 2) not null default 0
  check (wedding_extra_hours >= 0),
add column if not exists wedding_extra_hour_price numeric(12, 2) not null default 90
  check (wedding_extra_hour_price >= 0);

notify pgrst, 'reload schema';
