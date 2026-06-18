-- Demo inventory. Authentication users are intentionally not seeded here.
-- After creating the first Admin in Supabase Auth, run the final commented
-- membership statements with that user's UUID.

insert into public.organizations (id, name)
values ('10000000-0000-0000-0000-000000000001', 'Network Guardian Demo')
on conflict do nothing;

insert into public.networks (
  id, organization_id, name, description, location
) values
(
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Headquarters',
  'Primary office and server room',
  'Santiago'
),
(
  '20000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  'Warehouse',
  'Operations and security network',
  'Distribution Center'
)
on conflict do nothing;

insert into public.vlans (
  id, organization_id, network_id, name, vlan_id, cidr
) values
(
  '30000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'Management',
  10,
  '192.168.0.0/24'
),
(
  '30000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'Corporate',
  20,
  '10.0.0.0/24'
),
(
  '30000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000002',
  'Cameras',
  30,
  '172.16.0.0/24'
)
on conflict do nothing;

insert into public.devices (
  organization_id, network_id, vlan_id, name, ip_address, device_type, status
) values
(
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  'Core Router',
  '192.168.0.1',
  'Router',
  'unknown'
),
(
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000002',
  '30000000-0000-0000-0000-000000000003',
  'Loading Dock Camera',
  '172.16.0.42',
  'Camera',
  'unknown'
)
on conflict do nothing;

-- Replace USER_UUID after creating an Auth user:
-- insert into public.organization_members (organization_id, user_id, role)
-- values ('10000000-0000-0000-0000-000000000001', 'USER_UUID', 'admin');
