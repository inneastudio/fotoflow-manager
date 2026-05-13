alter table public.projects
add column if not exists photographer text not null default 'Žan' check (photographer in ('Žan', 'Doroteja', 'Teja'));

alter table public.projects
add column if not exists payment_method text not null default 'TRR' check (payment_method in ('Gotovina', 'TRR'));
