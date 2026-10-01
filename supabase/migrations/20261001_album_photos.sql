begin;

create table if not exists public.album_photos (
  id uuid primary key,
  workspace_id text not null,
  storage_path text not null unique,
  thumbnail_path text not null unique,
  taken_on date not null,
  caption text not null default '',
  favorite boolean not null default false,
  byte_size integer not null check (byte_size > 0),
  created_at timestamptz not null default now(),
  constraint album_photos_caption_length check (char_length(caption) <= 200)
);

create index if not exists album_photos_workspace_date_idx
  on public.album_photos (workspace_id, taken_on desc, created_at desc);

alter table public.album_photos enable row level security;
revoke all on public.album_photos from public, anon, authenticated;
grant select, insert, update, delete on public.album_photos to service_role;

commit;
