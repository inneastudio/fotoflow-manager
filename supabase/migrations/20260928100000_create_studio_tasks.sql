create table if not exists public.studio_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  task_date date not null,
  title text not null,
  description text not null default '',
  priority text not null default 'Normalna'
    check (priority in ('Nizka', 'Normalna', 'Visoka')),
  status text not null default 'Odprto'
    check (status in ('Odprto', 'Opravljeno')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists studio_tasks_user_id_idx
on public.studio_tasks (user_id);

create index if not exists studio_tasks_task_date_idx
on public.studio_tasks (task_date);

create index if not exists studio_tasks_status_idx
on public.studio_tasks (status);

create or replace function public.set_studio_tasks_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_studio_tasks_updated_at_trigger
on public.studio_tasks;

create trigger set_studio_tasks_updated_at_trigger
before update on public.studio_tasks
for each row execute function public.set_studio_tasks_updated_at();

alter table public.studio_tasks enable row level security;

drop policy if exists "Users can read own studio tasks" on public.studio_tasks;
create policy "Users can read own studio tasks"
on public.studio_tasks for select
using (auth.uid() = user_id);

drop policy if exists "Users can create own studio tasks" on public.studio_tasks;
create policy "Users can create own studio tasks"
on public.studio_tasks for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own studio tasks" on public.studio_tasks;
create policy "Users can update own studio tasks"
on public.studio_tasks for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own studio tasks" on public.studio_tasks;
create policy "Users can delete own studio tasks"
on public.studio_tasks for delete
using (auth.uid() = user_id);

notify pgrst, 'reload schema';
