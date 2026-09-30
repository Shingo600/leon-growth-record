begin;

-- p_limit = 0 means no daily cap. Positive values preserve the old app's behavior
-- while the new app is being deployed. Request IDs still prevent duplicate calls.
create or replace function public.reserve_outing_search(p_workspace text, p_request uuid, p_limit integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  today date := (now() at time zone 'Asia/Tokyo')::date;
  ids uuid[];
begin
  if p_workspace is null or btrim(p_workspace) = '' or p_request is null or p_limit is null or p_limit < 0 or p_limit > 100 then
    raise exception 'Invalid reservation';
  end if;
  insert into public.addon_ai_usage(workspace_id, usage_date) values (p_workspace, today) on conflict do nothing;
  select request_ids into ids from public.addon_ai_usage
    where workspace_id = p_workspace and usage_date = today for update;
  if p_request = any(ids) then
    return jsonb_build_object('allowed', false, 'reason', 'duplicate', 'remaining', case when p_limit = 0 then null else greatest(p_limit - cardinality(ids), 0) end);
  end if;
  if p_limit > 0 and cardinality(ids) >= p_limit then
    return jsonb_build_object('allowed', false, 'reason', 'limit', 'remaining', 0);
  end if;
  update public.addon_ai_usage set request_ids = array_append(ids, p_request)
    where workspace_id = p_workspace and usage_date = today;
  delete from public.addon_ai_usage where workspace_id = p_workspace and usage_date < today - 7;
  return jsonb_build_object('allowed', true, 'remaining', case when p_limit = 0 then null else greatest(p_limit - cardinality(ids) - 1, 0) end);
end;
$$;

commit;
