"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Device } from "@/lib/types";

function timeLabel(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function DeviceGrid({ initialDevices }: { initialDevices: Device[] }) {
  const [devices, setDevices] = useState(initialDevices);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    const channel = supabase
      .channel("dashboard-device-status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "devices" },
        (payload) => {
          const updated = payload.new as Partial<Device> & { id: string };
          setDevices((current) =>
            current.map((device) =>
              device.id === updated.id ? { ...device, ...updated } : device,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  if (devices.length === 0) {
    return (
      <div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <h2 className="font-semibold text-slate-900">No devices discovered</h2>
        <p className="mt-2 text-sm text-slate-500">
          Register a scanner agent and configure a private subnet to begin.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-7 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
      {devices.map((device) => (
        <Link
          className={`rounded-2xl border-2 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
            device.status === "online"
              ? "border-emerald-500/80"
              : device.status === "offline"
                ? "border-rose-500/80"
                : "border-amber-400/80"
          }`}
          href={`/devices/${device.id}`}
          key={device.id}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-950">{device.name}</h2>
              <p className="mt-1 font-mono text-sm text-slate-500">
                {device.ip_address}
              </p>
            </div>
            <StatusBadge status={device.status} />
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm">
            <div>
              <dt className="text-xs text-slate-400">Network</dt>
              <dd className="mt-1 font-medium text-slate-700">
                {device.network_name}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">VLAN / subnet</dt>
              <dd className="mt-1 truncate font-medium text-slate-700">
                {device.vlan_name ?? "Unassigned"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Latency</dt>
              <dd className="mt-1 font-medium text-slate-700">
                {device.latency_ms == null
                  ? "—"
                  : `${device.latency_ms.toFixed(1)} ms`}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Last checked</dt>
              <dd className="mt-1 font-medium text-slate-700">
                {timeLabel(device.last_checked_at)}
              </dd>
            </div>
          </dl>
        </Link>
      ))}
    </div>
  );
}
