alter table public.projects
add column if not exists external_source text,
add column if not exists external_id text;

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

create index if not exists projects_external_source_idx
on public.projects (external_source);

notify pgrst, 'reload schema';
