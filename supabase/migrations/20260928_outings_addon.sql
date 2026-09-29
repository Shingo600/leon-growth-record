begin;

create table if not exists public.addon_outing_favorites (
  workspace_id text not null,
  id text not null,
  data jsonb not null,
  saved_at timestamptz not null default now(),
  primary key (workspace_id, id)
);
create table if not exists public.addon_ai_usage (
  workspace_id text not null,
  usage_date date not null,
  request_ids uuid[] not null default '{}',
  primary key (workspace_id, usage_date)
);
alter table public.addon_outing_favorites enable row level security;
alter table public.addon_ai_usage enable row level security;
revoke all on public.addon_outing_favorites, public.addon_ai_usage from public, anon, authenticated;
grant select, insert, update, delete on public.addon_outing_favorites, public.addon_ai_usage to service_role;

-- A row lock serializes reservations across serverless instances and devices.
create or replace function public.reserve_outing_search(p_workspace text, p_request uuid, p_limit integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  today date := (now() at time zone 'Asia/Tokyo')::date;
  ids uuid[];
begin
  if p_workspace is null or btrim(p_workspace) = '' or p_request is null or p_limit is null or p_limit < 1 or p_limit > 100 then
    raise exception 'Invalid reservation';
  end if;
  insert into public.addon_ai_usage(workspace_id, usage_date) values (p_workspace, today) on conflict do nothing;
  select request_ids into ids from public.addon_ai_usage
    where workspace_id = p_workspace and usage_date = today for update;
  if p_request = any(ids) then
    return jsonb_build_object('allowed', false, 'reason', 'duplicate', 'remaining', greatest(p_limit - cardinality(ids), 0));
  end if;
  if cardinality(ids) >= p_limit then
    return jsonb_build_object('allowed', false, 'reason', 'limit', 'remaining', 0);
  end if;
  update public.addon_ai_usage set request_ids = array_append(ids, p_request)
    where workspace_id = p_workspace and usage_date = today;
  delete from public.addon_ai_usage where workspace_id = p_workspace and usage_date < today - 7;
  return jsonb_build_object('allowed', true, 'remaining', greatest(p_limit - cardinality(ids) - 1, 0));
end;
$$;

-- Import/add is one transaction and never replaces the family's existing list.
create or replace function public.mutate_outing_favorites(p_workspace text, p_items jsonb, p_delete text default null)
returns void language plpgsql security invoker set search_path = '' as $$
declare item jsonb;
begin
  if p_workspace is null or btrim(p_workspace) = '' or p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Invalid favorites';
  end if;
  if jsonb_array_length(p_items) > 200 then
    raise exception 'Invalid favorites';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('outings:' || p_workspace, 0));
  if p_delete is not null then
    delete from public.addon_outing_favorites where workspace_id = p_workspace and id = p_delete;
  end if;
  for item in select value from jsonb_array_elements(p_items) loop
    insert into public.addon_outing_favorites(workspace_id, id, data)
      values(p_workspace, item->>'id', item)
      on conflict (workspace_id, id) do update set data = excluded.data;
  end loop;
  if (select count(*) from public.addon_outing_favorites where workspace_id = p_workspace) > 200 then
    raise exception 'OUTINGS_FAVORITES_LIMIT';
  end if;
end;
$$;
revoke all on function public.reserve_outing_search(text, uuid, integer) from public, anon, authenticated;
revoke all on function public.mutate_outing_favorites(text, jsonb, text) from public, anon, authenticated;
grant execute on function public.reserve_outing_search(text, uuid, integer) to service_role;
grant execute on function public.mutate_outing_favorites(text, jsonb, text) to service_role;
commit;
