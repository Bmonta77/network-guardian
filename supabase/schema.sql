-- Network Guardian MVP schema.
-- Run in a new Supabase project using the SQL editor or Supabase CLI.

create extension if not exists pgcrypto;

create type public.organization_role as enum ('admin', 'viewer');
create type public.device_status as enum ('online', 'offline', 'unknown', 'warning');
create type public.network_status as enum ('active', 'paused');
create type public.agent_status as enum ('online', 'offline', 'never_connected');
create type public.change_request_status as enum ('pending', 'approved', 'rejected');
create type public.incident_status as enum ('open', 'resolved');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.organization_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.networks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  location text,
  status public.network_status not null default 'active',
  allow_public_scanning boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.scanner_agents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  network_id uuid not null references public.networks(id) on delete cascade,
  name text not null,
  token_hash text not null,
  status public.agent_status not null default 'never_connected',
  version text,
  hostname text,
  last_heartbeat_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (network_id, name)
);

create table public.vlans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  network_id uuid not null references public.networks(id) on delete cascade,
  name text not null,
  vlan_id integer check (vlan_id between 1 and 4094),
  cidr cidr not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (network_id, cidr)
);

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  network_id uuid not null references public.networks(id) on delete cascade,
  vlan_id uuid references public.vlans(id) on delete set null,
  name text not null,
  ip_address inet not null,
  mac_address macaddr,
  device_type text,
  status public.device_status not null default 'unknown',
  last_checked_at timestamptz,
  last_seen_online_at timestamptz,
  latency_ms numeric(10, 2),
  room text,
  rack text,
  department text,
  custom_labels jsonb not null default '{}'::jsonb,
  notes text,
  discovered_by_agent_id uuid references public.scanner_agents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (network_id, ip_address)
);

create table public.device_status_logs (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  network_id uuid not null references public.networks(id) on delete cascade,
  device_id uuid not null references public.devices(id) on delete cascade,
  scanner_agent_id uuid references public.scanner_agents(id) on delete set null,
  status public.device_status not null,
  latency_ms numeric(10, 2),
  checked_at timestamptz not null default now()
);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  network_id uuid not null references public.networks(id) on delete cascade,
  device_id uuid not null references public.devices(id) on delete cascade,
  status public.incident_status not null default 'open',
  started_at timestamptz not null default now(),
  resolved_at timestamptz,
  summary text
);

create table public.change_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  network_id uuid references public.networks(id) on delete cascade,
  device_id uuid references public.devices(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  reviewed_by uuid references public.profiles(id) on delete set null,
  title text not null,
  description text not null,
  proposed_changes jsonb not null default '{}'::jsonb,
  status public.change_request_status not null default 'pending',
  review_notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table public.viewer_network_access (
  user_id uuid not null references auth.users(id) on delete cascade,
  network_id uuid not null references public.networks(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, network_id)
);

create table public.agent_heartbeats (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  network_id uuid not null references public.networks(id) on delete cascade,
  scanner_agent_id uuid not null references public.scanner_agents(id) on delete cascade,
  hostname text,
  version text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index devices_network_status_idx on public.devices(network_id, status);
create index status_logs_device_checked_idx on public.device_status_logs(device_id, checked_at desc);
create index incidents_network_status_idx on public.incidents(network_id, status);
create unique index one_open_incident_per_device_idx
  on public.incidents(device_id) where status = 'open';
create index heartbeats_agent_created_idx on public.agent_heartbeats(scanner_agent_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_org_admin(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id
      and user_id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.can_view_network(target_network_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.networks n
    where n.id = target_network_id
      and (
        public.is_org_admin(n.organization_id)
        or exists (
          select 1 from public.viewer_network_access vna
          where vna.network_id = n.id and vna.user_id = auth.uid()
        )
      )
  );
$$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.networks enable row level security;
alter table public.scanner_agents enable row level security;
alter table public.vlans enable row level security;
alter table public.devices enable row level security;
alter table public.device_status_logs enable row level security;
alter table public.incidents enable row level security;
alter table public.change_requests enable row level security;
alter table public.viewer_network_access enable row level security;
alter table public.agent_heartbeats enable row level security;

create policy "members read organizations" on public.organizations
for select using (public.is_org_member(id));
create policy "admins manage organizations" on public.organizations
for all using (public.is_org_admin(id)) with check (public.is_org_admin(id));

create policy "users read organization profiles" on public.profiles
for select using (
  id = auth.uid() or exists (
    select 1
    from public.organization_members mine
    join public.organization_members theirs
      on mine.organization_id = theirs.organization_id
    where mine.user_id = auth.uid() and theirs.user_id = profiles.id
  )
);
create policy "users update own profile" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

create policy "members read memberships" on public.organization_members
for select using (public.is_org_member(organization_id));
create policy "admins manage memberships" on public.organization_members
for all using (public.is_org_admin(organization_id))
with check (public.is_org_admin(organization_id));

create policy "authorized users read networks" on public.networks
for select using (public.can_view_network(id));
create policy "admins manage networks" on public.networks
for all using (public.is_org_admin(organization_id))
with check (public.is_org_admin(organization_id));

create policy "admins read agents" on public.scanner_agents
for select using (public.is_org_admin(organization_id));
create policy "admins manage agents" on public.scanner_agents
for all using (public.is_org_admin(organization_id))
with check (public.is_org_admin(organization_id));

create policy "authorized users read vlans" on public.vlans
for select using (public.can_view_network(network_id));
create policy "admins manage vlans" on public.vlans
for all using (public.is_org_admin(organization_id))
with check (public.is_org_admin(organization_id));

create policy "authorized users read devices" on public.devices
for select using (public.can_view_network(network_id));
create policy "admins manage devices" on public.devices
for all using (public.is_org_admin(organization_id))
with check (public.is_org_admin(organization_id));

create policy "authorized users read status logs" on public.device_status_logs
for select using (public.can_view_network(network_id));
create policy "admins manage status logs" on public.device_status_logs
for all using (public.is_org_admin(organization_id))
with check (public.is_org_admin(organization_id));

create policy "authorized users read incidents" on public.incidents
for select using (public.can_view_network(network_id));
create policy "admins manage incidents" on public.incidents
for all using (public.is_org_admin(organization_id))
with check (public.is_org_admin(organization_id));

create policy "members read change requests" on public.change_requests
for select using (public.is_org_member(organization_id));
create policy "viewers create change requests" on public.change_requests
for insert with check (
  requested_by = auth.uid()
  and public.is_org_member(organization_id)
  and (network_id is null or public.can_view_network(network_id))
);
create policy "admins review change requests" on public.change_requests
for update using (public.is_org_admin(organization_id))
with check (public.is_org_admin(organization_id));

create policy "users read own network access" on public.viewer_network_access
for select using (
  user_id = auth.uid()
  or public.is_org_admin((select organization_id from public.networks where id = network_id))
);
create policy "admins manage network access" on public.viewer_network_access
for all using (
  public.is_org_admin((select organization_id from public.networks where id = network_id))
) with check (
  public.is_org_admin((select organization_id from public.networks where id = network_id))
);

create policy "admins read heartbeats" on public.agent_heartbeats
for select using (public.is_org_admin(organization_id));

create or replace function public.create_organization(organization_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  insert into public.organizations (name, created_by)
  values (organization_name, auth.uid())
  returning id into created_id;
  insert into public.organization_members (organization_id, user_id, role)
  values (created_id, auth.uid(), 'admin');
  return created_id;
end;
$$;

-- Admin-only token creation. The plaintext token is returned once and only its
-- bcrypt hash is persisted.
create or replace function public.create_scanner_agent(
  target_network_id uuid,
  agent_name text
)
returns table (agent_id uuid, token text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_token text := encode(gen_random_bytes(32), 'hex');
  target_org uuid;
  created_id uuid;
begin
  select organization_id into target_org
  from public.networks where id = target_network_id;

  if target_org is null or not public.is_org_admin(target_org) then
    raise exception 'not authorized';
  end if;

  insert into public.scanner_agents (
    organization_id, network_id, name, token_hash
  ) values (
    target_org, target_network_id, agent_name, crypt(raw_token, gen_salt('bf'))
  ) returning id into created_id;

  return query select created_id, raw_token;
end;
$$;

-- The agent uses these RPCs with the public Supabase key plus its own token.
-- No service-role key is installed on scanning computers.
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

create or replace function public.agent_report_scan(
  raw_token text,
  report jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  agent public.scanner_agents;
  found_device public.devices;
  reported_status public.device_status;
  checked_time timestamptz := coalesce((report->>'checked_at')::timestamptz, now());
begin
  select * into agent
  from public.scanner_agents
  where revoked_at is null and crypt(raw_token, token_hash) = token_hash
  limit 1;
  if agent.id is null then raise exception 'invalid agent token'; end if;

  reported_status := (report->>'status')::public.device_status;

  insert into public.devices (
    organization_id, network_id, vlan_id, name, ip_address, status,
    latency_ms, last_checked_at, last_seen_online_at, discovered_by_agent_id
  ) values (
    agent.organization_id,
    agent.network_id,
    nullif(report->>'vlan_id', '')::uuid,
    coalesce(nullif(report->>'name', ''), report->>'ip_address'),
    (report->>'ip_address')::inet,
    reported_status,
    nullif(report->>'latency_ms', '')::numeric,
    checked_time,
    case when reported_status = 'online' then checked_time else null end,
    agent.id
  )
  on conflict (network_id, ip_address) do update set
    status = excluded.status,
    latency_ms = excluded.latency_ms,
    last_checked_at = excluded.last_checked_at,
    last_seen_online_at = case
      when excluded.status = 'online' then excluded.last_checked_at
      else public.devices.last_seen_online_at
    end,
    vlan_id = coalesce(excluded.vlan_id, public.devices.vlan_id),
    discovered_by_agent_id = agent.id,
    updated_at = now()
  returning * into found_device;

  insert into public.device_status_logs (
    organization_id, network_id, device_id, scanner_agent_id,
    status, latency_ms, checked_at
  ) values (
    agent.organization_id, agent.network_id, found_device.id, agent.id,
    reported_status, nullif(report->>'latency_ms', '')::numeric, checked_time
  );

  if reported_status = 'offline' then
    insert into public.incidents (
      organization_id, network_id, device_id, status, summary
    ) values (
      agent.organization_id, agent.network_id, found_device.id, 'open',
      found_device.name || ' is unreachable'
    ) on conflict (device_id) where status = 'open' do nothing;
  elsif reported_status = 'online' then
    update public.incidents
    set status = 'resolved', resolved_at = checked_time
    where device_id = found_device.id and status = 'open';
  end if;
end;
$$;

create or replace function public.agent_heartbeat(
  raw_token text,
  heartbeat jsonb
)
returns void
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

  update public.scanner_agents set
    status = 'online',
    last_heartbeat_at = now(),
    hostname = heartbeat->>'hostname',
    version = heartbeat->>'version'
  where id = agent.id;

  insert into public.agent_heartbeats (
    organization_id, network_id, scanner_agent_id, hostname, version, metadata
  ) values (
    agent.organization_id, agent.network_id, agent.id,
    heartbeat->>'hostname', heartbeat->>'version',
    coalesce(heartbeat->'metadata', '{}'::jsonb)
  );
end;
$$;

grant execute on function public.agent_get_config(text) to anon, authenticated;
grant execute on function public.agent_report_scan(text, jsonb) to anon, authenticated;
grant execute on function public.agent_heartbeat(text, jsonb) to anon, authenticated;
grant execute on function public.create_scanner_agent(uuid, text) to authenticated;
grant execute on function public.create_organization(text) to authenticated;

alter publication supabase_realtime add table public.devices;
alter publication supabase_realtime add table public.incidents;
