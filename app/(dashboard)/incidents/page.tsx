import { PageHeader } from "@/components/page-header";
import { getIncidents } from "@/lib/data";

export default async function IncidentsPage() {
  const incidents = await getIncidents();
  return (
    <>
      <PageHeader
        description="Downtime windows are opened when a monitored device goes offline and resolved when it returns."
        eyebrow="Availability history"
        title="Incidents and downtime"
      />
      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {incidents.length === 0 ? (
          <div className="empty-state">No downtime incidents recorded.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {incidents.map((incident) => (
              <li
                className="flex flex-col justify-between gap-4 px-6 py-5 sm:flex-row sm:items-center"
                key={incident.id}
              >
                <div>
                  <p className="font-semibold text-slate-950">
                    {incident.device_name}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {incident.network_name} · Started{" "}
                    {new Date(incident.started_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                    incident.status === "open"
                      ? "bg-rose-50 text-rose-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {incident.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
