import { PageHeader } from "@/components/page-header";
import { RegisterAgent } from "@/components/register-agent";
import {
  getCurrentContext,
  getNetworks,
  getScannerAgents,
} from "@/lib/data";

export default async function ScannerAgentsPage() {
  const [context, agents, networks] = await Promise.all([
    getCurrentContext(),
    getScannerAgents(),
    getNetworks(),
  ]);

  return (
    <>
      <PageHeader
        action={
          context?.role === "admin" ? (
            <RegisterAgent networks={networks} />
          ) : undefined
        }
        description="Local Node.js processes assigned to one site. Tokens are shown only when an Admin creates or rotates them."
        eyebrow="Local scanners"
        title="Scanner agents"
      />
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {agents.map((agent) => (
          <article
            className="rounded-2xl border border-slate-200 bg-white p-6"
            key={agent.id}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-slate-950">{agent.name}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {agent.network_name}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                  agent.status === "online"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {agent.status.replace("_", " ")}
              </span>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm">
              <div>
                <dt className="text-xs text-slate-400">Last heartbeat</dt>
                <dd className="mt-1 font-medium text-slate-700">
                  {agent.last_heartbeat_at
                    ? new Date(agent.last_heartbeat_at).toLocaleString()
                    : "Never"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Version</dt>
                <dd className="mt-1 font-medium text-slate-700">
                  {agent.version ?? "Unknown"}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </>
  );
}
