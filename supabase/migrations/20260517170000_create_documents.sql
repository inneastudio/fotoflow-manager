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
