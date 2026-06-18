# Network Guardian

Network Guardian is a multi-site network monitoring MVP. A cloud-hosted Next.js
application provides authentication, role-based dashboards, inventory, realtime
status, incidents, and change approvals. A local Node.js agent performs private
IP scans from inside each managed network.

## Architecture

- Next.js 16 App Router, TypeScript, and Tailwind CSS
- Supabase Auth, PostgreSQL, Row Level Security, and Realtime
- Local Node.js scanner using ICMP ping
- Admin and viewer browser roles
- Token-authenticated scanner agents assigned to exactly one network

The hosted application never scans private IPs. Each scanner only receives
Admin-configured private CIDRs for its assigned site.

## Web application setup

Requirements:

- Node.js 20.9 or newer
- npm
- A Supabase project

Install dependencies:

```bash
npm install
```

Create the local environment file:

```bash
cp .env.example .env.local
```

Add the project URL, publishable key, and server-only service-role key from the
Supabase dashboard. The service-role key must never be exposed to browser code.

Create the database:

1. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor.
2. Optionally run [`supabase/seed.sql`](supabase/seed.sql).
3. Create the first Admin in Supabase Auth.
4. If using seed data, add the Auth user to `organization_members` using the
   commented statement at the end of the seed file.
5. Enable email/password authentication in Supabase Auth settings.

Start the app:

```bash
npm run dev
```

Without Supabase variables, the application intentionally runs with read-only
demo data so the UI can be reviewed before provisioning infrastructure.

## Scanner agent setup

Create a scanner token while signed in as an Admin:

```sql
select * from public.create_scanner_agent(
  'NETWORK_UUID',
  'Site Scanner 01'
);
```

The raw token is returned once. Store it securely on the scanning computer.

Copy the agent folder to a computer inside the target network:

```bash
cd agent
npm install
cp .env.example .env
npm start
```

The agent:

- Fetches only its assigned enabled VLAN/CIDR ranges
- Refuses non-private IPv4 ranges
- Supports `/16` through `/30` in the MVP
- Pings hosts with bounded concurrency
- Reports status and latency through token-scoped RPC functions
- Opens/resolves downtime incidents
- Sends a heartbeat every scan cycle
- Runs every 60 seconds by default
- Polls every 5 seconds for Admin-triggered **Scan** requests

Use `npm run scan-once` inside `agent/` for a single scan.

If the database schema was installed before manual Scan support was added, run
[`supabase/scan-now-migration.sql`](supabase/scan-now-migration.sql) once in the
Supabase SQL editor.

## Permissions

- Admins manage all organization networks, devices, members, agents, incidents,
  and approvals.
- Viewers can read only networks explicitly assigned through
  `viewer_network_access`.
- Viewers can submit change requests but cannot update production devices.
- Scanner agents do not have Supabase user sessions or service-role keys. They
  can call only the narrow scanner RPCs using a hashed agent token.

## Validation

```bash
npm run lint
npm run typecheck
npm run build
```

## MVP limitations

- Ping is the only discovery/check method.
- UI creation and approval buttons are scaffolded; their mutation actions are
  the next implementation layer.
- SNMP, ARP, mDNS, port checks, alert delivery, and public-IP scanning are not
  included.
