-- FotoFlow Manager production setup
-- Copy/paste this whole file into Supabase SQL Editor and run it once.

create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_name text default '',
  client_name text not null,
  client_address text default '',
  email text default '',
  phone text default '',
  shoot_type text not null default 'Portret',
  photographer text not null default 'Žan' check (photographer in ('Žan', 'Teja', 'Žan in Teja')),
  shoot_date date not null,
  shoot_time text default '',
  location text default '',
  workflow_status text not null default 'Rezervirano',
  payment_status text not null default 'Neplačano'
    check (payment_status in ('Neplačano', 'Delno plačano', 'Plačano')),
  payment_method text not null default 'TRR'
    check (payment_method in ('Gotovina', 'TRR')),
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

alter table public.projects
add column if not exists photographer text not null default 'Žan'
check (photographer in ('Žan', 'Teja', 'Žan in Teja'));

alter table public.projects drop constraint if exists projects_photographer_check;
alter table public.projects
add constraint projects_photographer_check
check (photographer in ('Žan', 'Teja', 'Žan in Teja'));

alter table public.projects
add column if not exists project_name text default '';

alter table public.projects
add column if not exists client_address text default '';

alter table public.projects
add column if not exists payment_method text not null default 'TRR'
check (payment_method in ('Gotovina', 'TRR'));

alter table public.projects
add column if not exists shoot_time text default '';

alter table public.projects
add column if not exists delivery_workdays integer not null default 8
check (delivery_workdays >= 0);

alter table public.projects
add column if not exists wedding_video_provider_paid boolean not null default false;

alter table public.projects drop constraint if exists projects_workflow_status_check;

create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists projects_shoot_date_idx on public.projects (shoot_date);
create index if not exists projects_workflow_status_idx on public.projects (workflow_status);
create index if not exists projects_payment_status_idx on public.projects (payment_status);
create index if not exists projects_photographer_idx on public.projects (photographer);
create index if not exists projects_payment_method_idx on public.projects (payment_method);

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
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  type text not null default 'contract' check (type in ('contract', 'timeline', 'custom')),
  status text not null default 'Osnutek' check (status in ('Osnutek', 'Poslano', 'Podpisano')),
  client_name text default '',
  client_email text default '',
  document_html text not null,
  share_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  signed_at timestamptz,
  signer_name text,
  signer_email text,
  signature_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_user_id_idx on public.documents (user_id);
create index if not exists documents_project_id_idx on public.documents (project_id);
create index if not exists documents_share_token_idx on public.documents (share_token);
create index if not exists documents_status_idx on public.documents (status);

create or replace function public.set_document_updated_at()
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

drop trigger if exists set_document_updated_at_trigger on public.documents;
create trigger set_document_updated_at_trigger
before update on public.documents
for each row execute function public.set_document_updated_at();

alter table public.documents enable row level security;

drop policy if exists "Users can read own documents" on public.documents;
create policy "Users can read own documents"
on public.documents for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own documents" on public.documents;
create policy "Users can insert own documents"
on public.documents for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own documents" on public.documents;
create policy "Users can update own documents"
on public.documents for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own documents" on public.documents;
create policy "Users can delete own documents"
on public.documents for delete
using (auth.uid() = user_id);

create or replace function public.get_shared_document(share_token_input text)
returns setof public.documents
language sql
security definer
set search_path = public
as $$
  select *
  from public.documents
  where share_token = share_token_input
  limit 1;
$$;

create or replace function public.sign_shared_document(
  share_token_input text,
  signer_name_input text,
  signer_email_input text,
  signature_text_input text
)
returns setof public.documents
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.documents
  set
    status = 'Podpisano',
    signer_name = signer_name_input,
    signer_email = signer_email_input,
    signature_text = signature_text_input,
    signed_at = now(),
    updated_at = now()
  where share_token = share_token_input
  returning *;
end;
$$;

grant execute on function public.get_shared_document(text) to anon, authenticated;
grant execute on function public.sign_shared_document(text, text, text, text) to anon, authenticated;
create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);

create index if not exists app_settings_user_id_idx on public.app_settings (user_id);
create index if not exists app_settings_key_idx on public.app_settings (key);

create or replace function public.set_app_settings_updated_at()
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

drop trigger if exists set_app_settings_updated_at_trigger on public.app_settings;
create trigger set_app_settings_updated_at_trigger
before update on public.app_settings
for each row execute function public.set_app_settings_updated_at();

alter table public.app_settings enable row level security;

drop policy if exists "Users can read own app settings" on public.app_settings;
create policy "Users can read own app settings"
on public.app_settings for select
using (auth.uid() = user_id);

drop policy if exists "Users can create own app settings" on public.app_settings;
create policy "Users can create own app settings"
on public.app_settings for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own app settings" on public.app_settings;
create policy "Users can update own app settings"
on public.app_settings for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own app settings" on public.app_settings;
create policy "Users can delete own app settings"
on public.app_settings for delete
using (auth.uid() = user_id);

notify pgrst, 'reload schema';
