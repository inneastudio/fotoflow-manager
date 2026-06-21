create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  email text not null default '',
  phone text not null default '',
  hourly_rate numeric(10, 2) not null default 0 check (hourly_rate >= 0),
  active boolean not null default true,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  shift_date date not null,
  start_time time not null,
  end_time time not null,
  work_type text not null default 'Studio'
    check (work_type in ('Studio', 'Teren', 'Poroka', 'Booth', 'Drugo')),
  hourly_rate numeric(10, 2) not null default 0 check (hourly_rate >= 0),
  hours numeric(8, 2) not null default 0 check (hours >= 0),
  amount numeric(12, 2) not null default 0 check (amount >= 0),
  billing_status text not null default 'Ni obračunano'
    check (billing_status in ('Ni obračunano', 'Obračunano', 'Plačano')),
  payment_method text not null default 'TRR'
    check (payment_method in ('Gotovina', 'TRR')),
  location text not null default '',
  notes text not null default '',
  email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists students_user_id_idx
on public.students (user_id);

create index if not exists student_shifts_user_id_idx
on public.student_shifts (user_id);

create index if not exists student_shifts_student_id_idx
on public.student_shifts (student_id);

create index if not exists student_shifts_shift_date_idx
on public.student_shifts (shift_date);

create or replace function public.set_students_updated_at()
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

drop trigger if exists set_students_updated_at_trigger
on public.students;

create trigger set_students_updated_at_trigger
before update on public.students
for each row execute function public.set_students_updated_at();

create or replace function public.set_student_shifts_updated_at()
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

drop trigger if exists set_student_shifts_updated_at_trigger
on public.student_shifts;

create trigger set_student_shifts_updated_at_trigger
before update on public.student_shifts
for each row execute function public.set_student_shifts_updated_at();

alter table public.students enable row level security;
alter table public.student_shifts enable row level security;

drop policy if exists "Users can read own students" on public.students;
create policy "Users can read own students"
on public.students for select
using (auth.uid() = user_id);

drop policy if exists "Users can create own students" on public.students;
create policy "Users can create own students"
on public.students for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own students" on public.students;
create policy "Users can update own students"
on public.students for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own students" on public.students;
create policy "Users can delete own students"
on public.students for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read own student shifts" on public.student_shifts;
create policy "Users can read own student shifts"
on public.student_shifts for select
using (auth.uid() = user_id);

drop policy if exists "Users can create own student shifts" on public.student_shifts;
create policy "Users can create own student shifts"
on public.student_shifts for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.students
    where students.id = student_shifts.student_id
      and students.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own student shifts" on public.student_shifts;
create policy "Users can update own student shifts"
on public.student_shifts for update
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.students
    where students.id = student_shifts.student_id
      and students.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete own student shifts" on public.student_shifts;
create policy "Users can delete own student shifts"
on public.student_shifts for delete
using (auth.uid() = user_id);

notify pgrst, 'reload schema';
