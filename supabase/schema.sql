create table if not exists public.app_snapshots (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_snapshots enable row level security;

drop policy if exists "Allow anon read snapshots" on public.app_snapshots;
drop policy if exists "Allow anon write snapshots" on public.app_snapshots;
drop policy if exists "Allow anon update snapshots" on public.app_snapshots;

revoke all on public.app_snapshots from anon;
revoke all on public.app_snapshots from authenticated;
