alter table public.projects
add column if not exists wedding_album_size text default '',
add column if not exists wedding_album_shape text default '',
add column if not exists wedding_album_pages integer not null default 0
  check (wedding_album_pages >= 0),
add column if not exists wedding_album_wishes text default '',
add column if not exists wedding_album_inscription text default '',
add column if not exists wedding_album_notes text default '';

notify pgrst, 'reload schema';
