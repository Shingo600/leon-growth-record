create table if not exists public.app_snapshots (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_snapshots enable row level security;

create policy "Allow anon read snapshots"
on public.app_snapshots
for select
to anon
using (true);

create policy "Allow anon write snapshots"
on public.app_snapshots
for insert
to anon
with check (true);

create policy "Allow anon update snapshots"
on public.app_snapshots
for update
to anon
using (true)
with check (true);
