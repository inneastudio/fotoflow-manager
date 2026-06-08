alter table public.projects
drop constraint if exists projects_payment_status_check;

alter table public.projects
add constraint projects_payment_status_check
check (
  payment_status in (
    'Neplačano',
    'Delno plačano',
    'Pošlji račun',
    'Račun poslan',
    'Plačano'
  )
);

notify pgrst, 'reload schema';
