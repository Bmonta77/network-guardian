import {
  demoAgents,
  demoChangeRequests,
  demoDevices,
  demoIncidents,
  demoNetworks,
} from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type {
  ChangeRequest,
  Device,
  Incident,
  Network,
  NetworkScanControl,
  OrganizationRole,
  ScannerAgent,
} from "@/lib/types";

export async function getCurrentContext() {
  if (!isSupabaseConfigured()) {
    return {
      user: { id: "demo-user", email: "admin@networkguardian.local" },
      organization: { id: "demo-org", name: "Network Guardian Demo" },
      role: "admin" as OrganizationRole,
      demo: true,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role, organizations(id, name)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const organization = Array.isArray(membership?.organizations)
    ? membership.organizations[0]
    : membership?.organizations;

  return {
    user: { id: user.id, email: user.email ?? "" },
    organization: organization ?? { id: "", name: "No organization" },
    role: (membership?.role ?? "viewer") as OrganizationRole,
    demo: false,
  };
}

export async function getNetworks(): Promise<Network[]> {
  if (!isSupabaseConfigured()) return demoNetworks;
  const supabase = await createClient();
  const { data } = await supabase
    .from("networks")
    .select("id, name, description, location, status")
    .order("name");
  return (data ?? []) as Network[];
}

export async function getDevices(): Promise<Device[]> {
  if (!isSupabaseConfigured()) return demoDevices;
  const supabase = await createClient();
  const { data } = await supabase
    .from("devices")
    .select(
      "id, name, ip_address, status, network_id, last_checked_at, last_seen_online_at, latency_ms, device_type, room, rack, department, notes, networks(name), vlans(name, cidr)",
    )
    .order("name");

  return (data ?? []).map((row: Record<string, unknown>) => {
    const network = row.networks as { name?: string } | null;
    const vlan = row.vlans as { name?: string; cidr?: string } | null;
    return {
      ...row,
      network_name: network?.name ?? "Unknown network",
      vlan_name: vlan
        ? `${vlan.name ?? "VLAN"}${vlan.cidr ? ` · ${vlan.cidr}` : ""}`
        : null,
    } as Device;
  });
}

export async function getIncidents(): Promise<Incident[]> {
  if (!isSupabaseConfigured()) return demoIncidents;
  const supabase = await createClient();
  const { data } = await supabase
    .from("incidents")
    .select("id, started_at, resolved_at, status, devices(name, networks(name))")
    .order("started_at", { ascending: false });
  return (data ?? []).map((row: Record<string, unknown>) => {
    const device = row.devices as
      | { name?: string; networks?: { name?: string } }
      | null;
    return {
      id: String(row.id),
      device_name: device?.name ?? "Unknown device",
      network_name: device?.networks?.name ?? "Unknown network",
      started_at: String(row.started_at),
      resolved_at: row.resolved_at ? String(row.resolved_at) : null,
      status: row.status as "open" | "resolved",
    };
  });
}

export async function getChangeRequests(): Promise<ChangeRequest[]> {
  if (!isSupabaseConfigured()) return demoChangeRequests;
  const supabase = await createClient();
  const { data } = await supabase
    .from("change_requests")
    .select("id, title, description, status, created_at, profiles(full_name)")
    .order("created_at", { ascending: false });
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    title: String(row.title),
    description: String(row.description),
    status: row.status as ChangeRequest["status"],
    created_at: String(row.created_at),
    requested_by_name:
      (row.profiles as { full_name?: string } | null)?.full_name ??
      "Viewer user",
  }));
}

export async function getScannerAgents(): Promise<ScannerAgent[]> {
  if (!isSupabaseConfigured()) return demoAgents;
  const supabase = await createClient();
  const { data } = await supabase
    .from("scanner_agents")
    .select("id, name, status, last_heartbeat_at, version, networks(name)")
    .order("name");
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    name: String(row.name),
    network_name:
      (row.networks as { name?: string } | null)?.name ?? "Unknown network",
    status: row.status as ScannerAgent["status"],
    last_heartbeat_at: row.last_heartbeat_at
      ? String(row.last_heartbeat_at)
      : null,
    version: row.version ? String(row.version) : null,
  }));
}

export async function getNetworkScanControl(
  networkId: string,
): Promise<NetworkScanControl> {
  if (!isSupabaseConfigured()) {
    return {
      agentCount: 1,
      enabledRangeCount: 1,
      scanRequestedAt: null,
      scanStartedAt: null,
      scanCompletedAt: null,
      scanError: null,
    };
  }

  const supabase = await createClient();
  const [{ data: agents }, { count: enabledRangeCount }] = await Promise.all([
    supabase
      .from("scanner_agents")
      .select(
        "scan_requested_at, scan_started_at, scan_completed_at, scan_error",
      )
      .eq("network_id", networkId)
      .is("revoked_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("vlans")
      .select("id", { count: "exact", head: true })
      .eq("network_id", networkId)
      .eq("enabled", true),
  ]);

  const latest = agents?.[0];
  return {
    agentCount: agents?.length ?? 0,
    enabledRangeCount: enabledRangeCount ?? 0,
    scanRequestedAt: latest?.scan_requested_at ?? null,
    scanStartedAt: latest?.scan_started_at ?? null,
    scanCompletedAt: latest?.scan_completed_at ?? null,
    scanError: latest?.scan_error ?? null,
  };
}
