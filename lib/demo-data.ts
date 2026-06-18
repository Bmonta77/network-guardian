import type {
  ChangeRequest,
  Device,
  Incident,
  Network,
  ScannerAgent,
} from "@/lib/types";

const now = Date.now();
const minutesAgo = (minutes: number) =>
  new Date(now - minutes * 60_000).toISOString();

export const demoNetworks: Network[] = [
  {
    id: "demo-hq",
    name: "Headquarters",
    description: "Primary office and server room",
    location: "Santiago",
    status: "active",
  },
  {
    id: "demo-warehouse",
    name: "Warehouse",
    description: "Operations and security network",
    location: "Distribution Center",
    status: "active",
  },
];

export const demoDevices: Device[] = [
  {
    id: "demo-router",
    name: "Core Router",
    ip_address: "192.168.0.1",
    status: "online",
    network_id: "demo-hq",
    network_name: "Headquarters",
    vlan_name: "Management · 192.168.0.0/24",
    last_checked_at: minutesAgo(1),
    last_seen_online_at: minutesAgo(1),
    latency_ms: 3.8,
    device_type: "Router",
    room: "Server Room",
    rack: "A1",
    department: "IT",
    notes: "Primary gateway",
  },
  {
    id: "demo-switch",
    name: "Access Switch 01",
    ip_address: "10.0.0.12",
    status: "online",
    network_id: "demo-hq",
    network_name: "Headquarters",
    vlan_name: "Corporate · 10.0.0.0/24",
    last_checked_at: minutesAgo(1),
    last_seen_online_at: minutesAgo(1),
    latency_ms: 7.2,
    device_type: "Switch",
    room: "Server Room",
    rack: "A2",
    department: "IT",
    notes: null,
  },
  {
    id: "demo-camera",
    name: "Loading Dock Camera",
    ip_address: "172.16.0.42",
    status: "offline",
    network_id: "demo-warehouse",
    network_name: "Warehouse",
    vlan_name: "Cameras · 172.16.0.0/24",
    last_checked_at: minutesAgo(1),
    last_seen_online_at: minutesAgo(48),
    latency_ms: null,
    device_type: "Camera",
    room: "Loading Dock",
    rack: null,
    department: "Security",
    notes: "Investigate power source",
  },
];

export const demoIncidents: Incident[] = [
  {
    id: "demo-incident",
    device_name: "Loading Dock Camera",
    network_name: "Warehouse",
    started_at: minutesAgo(47),
    resolved_at: null,
    status: "open",
  },
];

export const demoChangeRequests: ChangeRequest[] = [
  {
    id: "demo-change",
    title: "Rename loading dock camera",
    description: "Update the inventory name to match the physical label.",
    status: "pending",
    requested_by_name: "Viewer User",
    created_at: minutesAgo(120),
  },
];

export const demoAgents: ScannerAgent[] = [
  {
    id: "demo-agent",
    name: "HQ Scanner 01",
    network_name: "Headquarters",
    status: "online",
    last_heartbeat_at: minutesAgo(1),
    version: "0.1.0",
  },
  {
    id: "demo-agent-2",
    name: "Warehouse Scanner",
    network_name: "Warehouse",
    status: "offline",
    last_heartbeat_at: minutesAgo(18),
    version: "0.1.0",
  },
];
