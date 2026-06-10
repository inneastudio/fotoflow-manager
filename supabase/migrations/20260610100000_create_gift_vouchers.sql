create table if not exists public.gift_vouchers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  serial_number text not null,
  buyer_name text not null,
  recipient_name text not null default '',
  value numeric(12, 2) not null default 0 check (value >= 0),
  issue_date date not null,
  expiry_date date,
  redeemed_date date,
  status text not null default 'Aktiven'
    check (status in ('Aktiven', 'Unovčen', 'Potekel')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, serial_number)
);

create index if not exists gift_vouchers_user_id_idx
on public.gift_vouchers (user_id);

create index if not exists gift_vouchers_issue_date_idx
on public.gift_vouchers (issue_date);

create index if not exists gift_vouchers_status_idx
on public.gift_vouchers (status);

create or replace function public.set_gift_vouchers_updated_at()
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

drop trigger if exists set_gift_vouchers_updated_at_trigger
on public.gift_vouchers;

create trigger set_gift_vouchers_updated_at_trigger
before update on public.gift_vouchers
for each row execute function public.set_gift_vouchers_updated_at();

alter table public.gift_vouchers enable row level security;

drop policy if exists "Users can read own gift vouchers" on public.gift_vouchers;
create policy "Users can read own gift vouchers"
on public.gift_vouchers for select
using (auth.uid() = user_id);

drop policy if exists "Users can create own gift vouchers" on public.gift_vouchers;
create policy "Users can create own gift vouchers"
on public.gift_vouchers for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own gift vouchers" on public.gift_vouchers;
create policy "Users can update own gift vouchers"
on public.gift_vouchers for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own gift vouchers" on public.gift_vouchers;
create policy "Users can delete own gift vouchers"
on public.gift_vouchers for delete
using (auth.uid() = user_id);

notify pgrst, 'reload schema';
