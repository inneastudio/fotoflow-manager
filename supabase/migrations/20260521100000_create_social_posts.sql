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

notify pgrst, 'reload schema';
