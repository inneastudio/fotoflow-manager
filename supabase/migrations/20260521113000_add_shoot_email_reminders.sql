alter table public.projects
  add column if not exists shoot_reminder_sent_at timestamptz;

create index if not exists projects_shoot_reminder_idx
  on public.projects(shoot_date, shoot_reminder_sent_at);

notify pgrst, 'reload schema';
