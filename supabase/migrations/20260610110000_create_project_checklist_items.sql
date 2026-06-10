create table if not exists public.project_checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  label text not null,
  category text not null default 'Oprema',
  quantity integer not null default 1 check (quantity > 0),
  is_checked boolean not null default false,
  sort_order integer not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_checklist_items_user_id_idx
on public.project_checklist_items (user_id);

create index if not exists project_checklist_items_project_id_idx
on public.project_checklist_items (project_id);

create index if not exists project_checklist_items_checked_idx
on public.project_checklist_items (is_checked);

create or replace function public.set_project_checklist_items_updated_at()
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

drop trigger if exists set_project_checklist_items_updated_at_trigger
on public.project_checklist_items;

create trigger set_project_checklist_items_updated_at_trigger
before update on public.project_checklist_items
for each row execute function public.set_project_checklist_items_updated_at();

alter table public.project_checklist_items enable row level security;

drop policy if exists "Users can read own project checklist items" on public.project_checklist_items;
create policy "Users can read own project checklist items"
on public.project_checklist_items for select
using (auth.uid() = user_id);

drop policy if exists "Users can create own project checklist items" on public.project_checklist_items;
create policy "Users can create own project checklist items"
on public.project_checklist_items for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.projects
    where projects.id = project_checklist_items.project_id
      and projects.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own project checklist items" on public.project_checklist_items;
create policy "Users can update own project checklist items"
on public.project_checklist_items for update
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.projects
    where projects.id = project_checklist_items.project_id
      and projects.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete own project checklist items" on public.project_checklist_items;
create policy "Users can delete own project checklist items"
on public.project_checklist_items for delete
using (auth.uid() = user_id);

notify pgrst, 'reload schema';
