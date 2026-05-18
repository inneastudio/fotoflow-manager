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
