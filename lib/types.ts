export type OrganizationRole = "admin" | "viewer";
export type DeviceStatus = "online" | "offline" | "unknown" | "warning";

export type Network = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  status: "active" | "paused";
};

export type Device = {
  id: string;
  name: string;
  ip_address: string;
  status: DeviceStatus;
  network_id: string;
  network_name: string;
  vlan_name: string | null;
  last_checked_at: string | null;
  last_seen_online_at: string | null;
  latency_ms: number | null;
  device_type: string | null;
  room: string | null;
  rack: string | null;
  department: string | null;
  notes: string | null;
};

export type Incident = {
  id: string;
  device_name: string;
  network_name: string;
  started_at: string;
  resolved_at: string | null;
  status: "open" | "resolved";
};

export type ChangeRequest = {
  id: string;
  title: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  requested_by_name: string;
  created_at: string;
};

export type ScannerAgent = {
  id: string;
  name: string;
  network_name: string;
  status: "online" | "offline" | "never_connected";
  last_heartbeat_at: string | null;
  version: string | null;
};
