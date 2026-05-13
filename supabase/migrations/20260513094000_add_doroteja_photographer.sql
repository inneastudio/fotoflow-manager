alter table public.projects drop constraint if exists projects_photographer_check;

alter table public.projects
add constraint projects_photographer_check
check (photographer in ('Žan', 'Doroteja', 'Teja'));
