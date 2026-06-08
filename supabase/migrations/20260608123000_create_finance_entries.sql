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
