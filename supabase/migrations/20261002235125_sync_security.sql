begin;

create table if not exists public.sync_sessions (
  workspace_id text not null,
  token_hash text not null check (token_hash ~ '^[a-f0-9]{64}$'),
  code_version text not null check (code_version ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  primary key (workspace_id, token_hash),
  check (expires_at > created_at and expires_at <= created_at + interval '30 days')
);
create index if not exists sync_sessions_expiry on public.sync_sessions (workspace_id, expires_at);

create table if not exists public.sync_login_attempts (
  workspace_id text primary key,
  window_started_at timestamptz not null default clock_timestamp(),
  attempts integer not null default 0 check (attempts between 0 and 10)
);

alter table public.sync_sessions enable row level security;
alter table public.sync_login_attempts enable row level security;
revoke all on public.sync_sessions, public.sync_login_attempts from public, anon, authenticated;
grant select, insert, update, delete on public.sync_sessions, public.sync_login_attempts to service_role;

-- One shared budget across instances and IPs; authenticated requests never use it.
create or replace function public.reserve_sync_login_attempt(p_workspace text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_row public.sync_login_attempts%rowtype;
  v_now timestamptz;
begin
  if p_workspace is null or length(p_workspace) = 0 then raise exception 'Invalid workspace'; end if;
  insert into public.sync_login_attempts (workspace_id) values (p_workspace) on conflict do nothing;
  select * into strict v_row from public.sync_login_attempts where workspace_id = p_workspace for update;
  v_now := clock_timestamp();
  if v_row.window_started_at + interval '5 minutes' <= v_now then
    update public.sync_login_attempts set window_started_at = v_now, attempts = 1 where workspace_id = p_workspace;
  elsif v_row.attempts >= 10 then
    return jsonb_build_object('allowed', false, 'retry_after', greatest(1, ceil(extract(epoch from (v_row.window_started_at + interval '5 minutes' - v_now)))::integer));
  else
    update public.sync_login_attempts set attempts = attempts + 1 where workspace_id = p_workspace;
  end if;
  return jsonb_build_object('allowed', true, 'retry_after', 0);
end;
$$;

create or replace function public.issue_sync_session(p_workspace text, p_token_hash text, p_code_version text)
returns void language plpgsql security invoker set search_path = '' as $$
declare v_now timestamptz := clock_timestamp();
begin
  if p_workspace is null or length(p_workspace) = 0 then raise exception 'Invalid workspace'; end if;
  delete from public.sync_sessions where workspace_id = p_workspace and expires_at <= v_now;
  insert into public.sync_sessions (workspace_id, token_hash, code_version, created_at, expires_at)
  values (p_workspace, p_token_hash, p_code_version, v_now, v_now + interval '30 days');
end;
$$;

create or replace function public.validate_sync_session(p_workspace text, p_token_hash text, p_code_version text)
returns boolean language sql security invoker set search_path = '' as $$
  select exists (
    select 1 from public.sync_sessions
    where workspace_id = p_workspace and token_hash = p_token_hash
      and code_version = p_code_version and expires_at > clock_timestamp()
  );
$$;

revoke all on function public.reserve_sync_login_attempt(text), public.issue_sync_session(text, text, text), public.validate_sync_session(text, text, text) from public, anon, authenticated;
grant execute on function public.reserve_sync_login_attempt(text), public.issue_sync_session(text, text, text), public.validate_sync_session(text, text, text) to service_role;

commit;
