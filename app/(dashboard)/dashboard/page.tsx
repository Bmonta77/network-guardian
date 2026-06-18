import { DeviceGrid } from "@/components/device-grid";
import { PageHeader } from "@/components/page-header";
import { getDevices, getIncidents, getNetworks } from "@/lib/data";

export default async function DashboardPage() {
  const [devices, networks, incidents] = await Promise.all([
    getDevices(),
    getNetworks(),
    getIncidents(),
  ]);
  const online = devices.filter((device) => device.status === "online").length;
  const offline = devices.filter((device) => device.status === "offline").length;

  return (
    <>
      <PageHeader
        description="Live device health across every network and site available to your account."
        eyebrow="Organization overview"
        title="Admin dashboard"
      />
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Networks", networks.length, "text-blue-700"],
          ["Online devices", online, "text-emerald-600"],
          ["Offline devices", offline, "text-rose-600"],
          [
            "Open incidents",
            incidents.filter((incident) => incident.status === "open").length,
            "text-amber-600",
          ],
        ].map(([label, value, color]) => (
          <div
            className="rounded-2xl border border-slate-200 bg-white p-5"
            key={String(label)}
          >
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </section>
      <DeviceGrid initialDevices={devices} />
    </>
  );
}
