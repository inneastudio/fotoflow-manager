alter table public.projects
add column if not exists delivery_workdays integer not null default 8 check (delivery_workdays >= 0);
