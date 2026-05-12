create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_name text not null,
  email text default '',
  phone text default '',
  shoot_type text not null default 'Portret',
  shoot_date date not null,
  location text default '',
  workflow_status text not null default 'Rezervirano',
  payment_status text not null default 'Neplačano',
  amount numeric(12, 2) not null default 0,
  deposit numeric(12, 2) not null default 0,
  balance numeric(12, 2) not null default 0,
  delivery_workdays integer not null default 8,
  delivery_due date not null,
  gallery_url text default '',
  drive_url text default '',
  selected_photos integer not null default 0,
  notes text default '',
  retouch_notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Users can manage own projects"
on public.projects
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
