"use server";

import { revalidatePath } from "next/cache";
import { getCurrentContext } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type RegisterAgentState = {
  status: "idle" | "error" | "success";
  message: string;
  agentId?: string;
  agentName?: string;
  networkName?: string;
  token?: string;
};

export type RequestScanState = {
  status: "idle" | "error" | "success";
  message: string;
  requestedAt?: string;
};

export async function createNetwork(formData: FormData) {
  const context = await getCurrentContext();
  if (!context || context.role !== "admin") throw new Error("Not authorized.");
  if (!isSupabaseConfigured()) return;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Network name is required.");

  const supabase = await createClient();
  const { error } = await supabase.from("networks").insert({
    organization_id: context.organization.id,
    name,
    location: String(formData.get("location") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/networks");
}

export async function submitChangeRequest(formData: FormData) {
  const context = await getCurrentContext();
  if (!context) throw new Error("Not authorized.");
  if (!isSupabaseConfigured()) return;

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title || !description) throw new Error("Title and description are required.");

  const supabase = await createClient();
  const { error } = await supabase.from("change_requests").insert({
    organization_id: context.organization.id,
    requested_by: context.user.id,
    title,
    description,
    proposed_changes: {},
  });
  if (error) throw new Error(error.message);
  revalidatePath("/change-requests");
}

export async function reviewChangeRequest(formData: FormData) {
  const context = await getCurrentContext();
  if (!context || context.role !== "admin") throw new Error("Not authorized.");
  if (!isSupabaseConfigured()) return;

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (decision !== "approved" && decision !== "rejected") {
    throw new Error("Invalid review decision.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("change_requests")
    .update({
      status: decision,
      reviewed_by: context.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", context.organization.id)
    .eq("status", "pending");
  if (error) throw new Error(error.message);
  revalidatePath("/change-requests");
}

export async function registerScannerAgent(
  _previousState: RegisterAgentState,
  formData: FormData,
): Promise<RegisterAgentState> {
  const context = await getCurrentContext();
  if (!context || context.role !== "admin") {
    return {
      status: "error",
      message: "Admin access is required to register a scanner agent.",
    };
  }
  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "Connect the application to Supabase before registering agents.",
    };
  }

  const agentName = String(formData.get("agentName") ?? "").trim();
  const networkId = String(formData.get("networkId") ?? "").trim();
  if (agentName.length < 2 || !networkId) {
    return {
      status: "error",
      message: "Select a network and enter an agent name.",
    };
  }

  const supabase = await createClient();
  const { data: network, error: networkError } = await supabase
    .from("networks")
    .select("id, name")
    .eq("id", networkId)
    .eq("organization_id", context.organization.id)
    .maybeSingle();

  if (networkError || !network) {
    return {
      status: "error",
      message: "The selected network is unavailable or not in your organization.",
    };
  }

  const { data, error } = await supabase.rpc("create_scanner_agent", {
    target_network_id: networkId,
    agent_name: agentName,
  });
  const result = Array.isArray(data) ? data[0] : data;

  if (error || !result?.agent_id || !result?.token) {
    return {
      status: "error",
      message: error?.message ?? "Supabase did not return an agent token.",
    };
  }

  revalidatePath("/scanner-agents");
  return {
    status: "success",
    message:
      "Agent registered. Copy this token now—it cannot be displayed again.",
    agentId: String(result.agent_id),
    agentName,
    networkName: network.name,
    token: String(result.token),
  };
}

export async function requestNetworkScan(
  _previousState: RequestScanState,
  formData: FormData,
): Promise<RequestScanState> {
  const context = await getCurrentContext();
  if (!context || context.role !== "admin") {
    return {
      status: "error",
      message: "Admin access is required to request a network scan.",
    };
  }
  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "Connect the application to Supabase before requesting scans.",
    };
  }

  const networkId = String(formData.get("networkId") ?? "");
  if (!networkId) {
    return { status: "error", message: "A network ID is required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("request_network_scan", {
    target_network_id: networkId,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath(`/networks/${networkId}`);
  return {
    status: "success",
    message: `Scan queued for ${Number(data) || 1} local scanner agent${
      Number(data) === 1 ? "" : "s"
    }.`,
    requestedAt: new Date().toISOString(),
  };
}
