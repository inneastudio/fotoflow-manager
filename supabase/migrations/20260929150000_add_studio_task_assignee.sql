alter table public.studio_tasks
  add column if not exists assignee text
  check (assignee in ('Žan', 'Teja'));

notify pgrst, 'reload schema';
