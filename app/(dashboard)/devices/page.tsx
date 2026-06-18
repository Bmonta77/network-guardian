import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getDevices } from "@/lib/data";

export default async function DevicesPage() {
  const devices = await getDevices();
  return (
    <>
      <PageHeader
        description="Searchable organization inventory grouped by site, VLAN, room, rack, department, or custom labels."
        eyebrow="Inventory"
        title="Devices"
      />
      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {devices.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm text-slate-500">
            No devices are available to this account.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-4">Device</th>
                  <th className="px-5 py-4">Network</th>
                  <th className="px-5 py-4">VLAN / subnet</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {devices.map((device) => (
                  <tr className="hover:bg-slate-50" key={device.id}>
                    <td className="px-5 py-4">
                      <Link
                        className="font-semibold text-slate-950 hover:text-blue-700"
                        href={`/devices/${device.id}`}
                      >
                        {device.name}
                      </Link>
                      <p className="mt-1 font-mono text-xs text-slate-400">
                        {device.ip_address}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {device.network_name}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {device.vlan_name ?? "Unassigned"}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={device.status} />
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {device.latency_ms == null
                        ? "—"
                        : `${device.latency_ms.toFixed(1)} ms`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
