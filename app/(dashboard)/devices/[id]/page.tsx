import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getDevices } from "@/lib/data";

function displayTime(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Never";
}

export default async function DeviceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const devices = await getDevices();
  const device = devices.find((item) => item.id === id);
  if (!device) notFound();

  const fields = [
    ["IP address", device.ip_address],
    ["Network", device.network_name],
    ["VLAN / subnet", device.vlan_name ?? "Unassigned"],
    ["Device type", device.device_type ?? "Unknown"],
    ["Last checked", displayTime(device.last_checked_at)],
    ["Last seen online", displayTime(device.last_seen_online_at)],
    [
      "Latency",
      device.latency_ms == null ? "Unavailable" : `${device.latency_ms} ms`,
    ],
    ["Room", device.room ?? "Unassigned"],
    ["Rack", device.rack ?? "Unassigned"],
    ["Department", device.department ?? "Unassigned"],
  ];

  return (
    <>
      <PageHeader
        action={<StatusBadge status={device.status} />}
        description={`${device.network_name} · ${device.ip_address}`}
        eyebrow="Device detail"
        title={device.name}
      />
      <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-3">
        {fields.map(([label, value]) => (
          <div className="bg-white p-5" key={label}>
            <dt className="text-xs uppercase tracking-wide text-slate-400">
              {label}
            </dt>
            <dd className="mt-2 font-medium text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-950">Notes</h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {device.notes ?? "No notes have been added."}
        </p>
      </section>
    </>
  );
}
