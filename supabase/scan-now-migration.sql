-- Apply this migration if schema.sql was already run before Scan Now support.

alter table public.scanner_agents
  add column if not exists scan_requested_at timestamptz,
  add column if not exists scan_started_at timestamptz,
  add column if not exists scan_completed_at timestamptz,
  add column if not exists scan_error text;

create or replace function public.request_network_scan(target_network_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_org uuid;
  affected_agents integer;
begin
  select organization_id into target_org
  from public.networks where id = target_network_id;

  if target_org is null or not public.is_org_admin(target_org) then
    raise exception 'not authorized';
  end if;

  update public.scanner_agents
  set scan_requested_at = now(), scan_error = null
  where network_id = target_network_id and revoked_at is null;
  get diagnostics affected_agents = row_count;

  if affected_agents = 0 then
    raise exception 'no active scanner agent is assigned to this network';
  end if;

  return affected_agents;
end;
$$;

create or replace function public.agent_get_config(raw_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  agent public.scanner_agents;
begin
  select * into agent
  from public.scanner_agents
  where revoked_at is null and crypt(raw_token, token_hash) = token_hash
  limit 1;
  if agent.id is null then raise exception 'invalid agent token'; end if;

  return jsonb_build_object(
    'agent_id', agent.id,
    'network_id', agent.network_id,
    'organization_id', agent.organization_id,
    'scan_requested_at', agent.scan_requested_at,
    'scan_started_at', agent.scan_started_at,
    'scan_completed_at', agent.scan_completed_at,
    'known_ips', coalesce((
      select jsonb_agg(ip_address::text)
      from public.devices
      where network_id = agent.network_id
    ), '[]'::jsonb),
    'ranges', coalesce((
      select jsonb_agg(jsonb_build_object(
        'vlan_id', id, 'name', name, 'cidr', cidr::text
      ))
      from public.vlans
      where network_id = agent.network_id and enabled
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.agent_start_scan(
  raw_token text,
  requested_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected integer;
begin
  update public.scanner_agents
  set scan_started_at = now(), scan_error = null
  where revoked_at is null
    and crypt(raw_token, token_hash) = token_hash
    and scan_requested_at = requested_at
    and (scan_completed_at is null or scan_completed_at < requested_at);
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

create or replace function public.agent_complete_scan(
  raw_token text,
  requested_at timestamptz,
  error_message text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.scanner_agents
  set scan_completed_at = now(), scan_error = error_message
  where revoked_at is null
    and crypt(raw_token, token_hash) = token_hash
    and scan_requested_at = requested_at;

  if not found then raise exception 'invalid agent token or scan request'; end if;
end;
$$;

grant execute on function public.request_network_scan(uuid) to authenticated;
grant execute on function public.agent_get_config(text) to anon, authenticated;
grant execute on function public.agent_start_scan(text, timestamptz) to anon, authenticated;
grant execute on function public.agent_complete_scan(text, timestamptz, text) to anon, authenticated;
