-- FotoFlow Manager production setup
-- Copy/paste this whole file into Supabase SQL Editor and run it once.

create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  external_source text,
  external_id text,
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
    check (payment_status in ('Neplačano', 'Delno plačano', 'Pošlji račun', 'Račun poslan', 'Plačano')),
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

alter table public.projects
add column if not exists wedding_extra_hours numeric(8, 2) not null default 0
check (wedding_extra_hours >= 0),
add column if not exists wedding_extra_hour_price numeric(12, 2) not null default 90
check (wedding_extra_hour_price >= 0);

alter table public.projects drop constraint if exists projects_workflow_status_check;
alter table public.projects drop constraint if exists projects_payment_status_check;
alter table public.projects
add constraint projects_payment_status_check
check (payment_status in ('Neplačano', 'Delno plačano', 'Pošlji račun', 'Račun poslan', 'Plačano'));

alter table public.projects
add column if not exists external_source text,
add column if not exists external_id text;

create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists projects_shoot_date_idx on public.projects (shoot_date);
create index if not exists projects_workflow_status_idx on public.projects (workflow_status);
create index if not exists projects_payment_status_idx on public.projects (payment_status);
create index if not exists projects_photographer_idx on public.projects (photographer);
create index if not exists projects_payment_method_idx on public.projects (payment_method);
create index if not exists projects_external_source_idx on public.projects (external_source);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_external_source_external_id_unique'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects
    add constraint projects_external_source_external_id_unique
    unique (external_source, external_id);
  end if;
end $$;

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

alter table public.projects
  add column if not exists shoot_reminder_sent_at timestamptz;

create index if not exists projects_shoot_reminder_idx
  on public.projects(shoot_date, shoot_reminder_sent_at);

notify pgrst, 'reload schema';

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users can read own push subscriptions" on public.push_subscriptions;
create policy "Users can read own push subscriptions"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own push subscriptions" on public.push_subscriptions;
create policy "Users can insert own push subscriptions"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own push subscriptions" on public.push_subscriptions;
create policy "Users can update own push subscriptions"
  on public.push_subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own push subscriptions" on public.push_subscriptions;
create policy "Users can delete own push subscriptions"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

create or replace function public.set_push_subscriptions_updated_at()
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

drop trigger if exists set_push_subscriptions_updated_at on public.push_subscriptions;
create trigger set_push_subscriptions_updated_at
  before update on public.push_subscriptions
  for each row execute function public.set_push_subscriptions_updated_at();

notify pgrst, 'reload schema';
create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  platform text not null default 'Instagram',
  scheduled_at timestamptz not null,
  status text not null default 'Planirano',
  caption text not null default '',
  gallery_url text not null default '',
  storage_urls text[] not null default '{}',
  notes text not null default '',
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists social_posts_user_id_idx on public.social_posts(user_id);
create index if not exists social_posts_scheduled_at_idx on public.social_posts(scheduled_at);

alter table public.social_posts enable row level security;

drop policy if exists "Users can read own social posts" on public.social_posts;
create policy "Users can read own social posts"
  on public.social_posts for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own social posts" on public.social_posts;
create policy "Users can insert own social posts"
  on public.social_posts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own social posts" on public.social_posts;
create policy "Users can update own social posts"
  on public.social_posts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own social posts" on public.social_posts;
create policy "Users can delete own social posts"
  on public.social_posts for delete
  using (auth.uid() = user_id);

create or replace function public.set_social_posts_updated_at()
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

drop trigger if exists set_social_posts_updated_at on public.social_posts;
create trigger set_social_posts_updated_at
  before update on public.social_posts
  for each row execute function public.set_social_posts_updated_at();

insert into storage.buckets (id, name, public)
values ('social-media', 'social-media', true)
on conflict (id) do update set public = true;

drop policy if exists "Users can upload own social media" on storage.objects;
create policy "Users can upload own social media"
  on storage.objects for insert
  with check (
    bucket_id = 'social-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can read own social media" on storage.objects;
create policy "Users can read own social media"
  on storage.objects for select
  using (
    bucket_id = 'social-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete own social media" on storage.objects;
create policy "Users can delete own social media"
  on storage.objects for delete
  using (
    bucket_id = 'social-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create table if not exists public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entry_date date not null,
  title text not null,
  category text not null default 'Inkaso',
  payment_method text not null default 'Gotovina'
    check (payment_method in ('Gotovina', 'TRR')),
  amount numeric(12, 2) not null default 0 check (amount >= 0),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists finance_entries_user_id_idx
on public.finance_entries (user_id);

create index if not exists finance_entries_entry_date_idx
on public.finance_entries (entry_date);

create index if not exists finance_entries_payment_method_idx
on public.finance_entries (payment_method);

create or replace function public.set_finance_entries_updated_at()
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

drop trigger if exists set_finance_entries_updated_at_trigger
on public.finance_entries;

create trigger set_finance_entries_updated_at_trigger
before update on public.finance_entries
for each row execute function public.set_finance_entries_updated_at();

alter table public.finance_entries enable row level security;

drop policy if exists "Users can read own finance entries" on public.finance_entries;
create policy "Users can read own finance entries"
on public.finance_entries for select
using (auth.uid() = user_id);

drop policy if exists "Users can create own finance entries" on public.finance_entries;
create policy "Users can create own finance entries"
on public.finance_entries for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own finance entries" on public.finance_entries;
create policy "Users can update own finance entries"
on public.finance_entries for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own finance entries" on public.finance_entries;
create policy "Users can delete own finance entries"
on public.finance_entries for delete
using (auth.uid() = user_id);

notify pgrst, 'reload schema';
