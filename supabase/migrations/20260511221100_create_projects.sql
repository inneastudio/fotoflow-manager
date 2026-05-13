create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_name text not null,
  email text default '',
  phone text default '',
  shoot_type text not null default 'Portret',
  photographer text not null default 'Žan' check (photographer in ('Žan', 'Teja')),
  shoot_date date not null,
  shoot_time text default '',
  location text default '',
  workflow_status text not null default 'Rezervirano'
    check (
      workflow_status in (
        'Rezervirano',
        'Fotografirano',
        'Shranjeno',
        'Izbor poslan',
        'Izbor prejet',
        'Narejen izbor',
        'Urejanje',
        'Poslano',
        'Plačano',
        'Zaključeno'
      )
    ),
  payment_status text not null default 'Neplačano'
    check (payment_status in ('Neplačano', 'Delno plačano', 'Plačano')),
  payment_method text not null default 'TRR' check (payment_method in ('Gotovina', 'TRR')),
  amount numeric(12, 2) not null default 0 check (amount >= 0),
  deposit numeric(12, 2) not null default 0 check (deposit >= 0),
  balance numeric(12, 2) not null default 0 check (balance >= 0),
  delivery_workdays integer not null default 8 check (delivery_workdays >= 0),
  delivery_due date not null,
  gallery_url text default '',
  drive_url text default '',
  selected_photos integer not null default 0 check (selected_photos >= 0),
  notes text default '',
  retouch_notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists projects_shoot_date_idx on public.projects (shoot_date);
create index if not exists projects_workflow_status_idx on public.projects (workflow_status);
create index if not exists projects_payment_status_idx on public.projects (payment_status);

create or replace function public.set_project_amounts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.amount := greatest(coalesce(new.amount, 0), 0);
  new.deposit := greatest(coalesce(new.deposit, 0), 0);

  if new.payment_status = 'Plačano' then
    new.balance := 0;
  else
    new.balance := greatest(new.amount - new.deposit, 0);
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_project_amounts_trigger on public.projects;
create trigger set_project_amounts_trigger
before insert or update on public.projects
for each row execute function public.set_project_amounts();

alter table public.projects enable row level security;

drop policy if exists "Users can read own projects" on public.projects;
create policy "Users can read own projects"
on public.projects for select
using (auth.uid() = user_id);

drop policy if exists "Users can create own projects" on public.projects;
create policy "Users can create own projects"
on public.projects for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own projects" on public.projects;
create policy "Users can update own projects"
on public.projects for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own projects" on public.projects;
create policy "Users can delete own projects"
on public.projects for delete
using (auth.uid() = user_id);
