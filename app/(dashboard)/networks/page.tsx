import Link from "next/link";
import { createNetwork } from "@/app/(dashboard)/actions";
import { PageHeader } from "@/components/page-header";
import { getCurrentContext, getDevices, getNetworks } from "@/lib/data";

export default async function NetworksPage() {
  const [context, networks, devices] = await Promise.all([
    getCurrentContext(),
    getNetworks(),
    getDevices(),
  ]);

  return (
    <>
      <PageHeader
        description="Each site has its own local scanner, private subnets, VLANs, inventory, and access rules."
        eyebrow="Sites and locations"
        title="Networks"
      />
      {context?.role === "admin" && (
        <details className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
          <summary className="cursor-pointer font-semibold text-slate-950">
            Create a network/site
          </summary>
          <form
            action={createNetwork}
            className="mt-5 grid gap-4 md:grid-cols-3"
          >
            <input
              className="form-input"
              name="name"
              placeholder="Site name"
              required
            />
            <input
              className="form-input"
              name="location"
              placeholder="Location"
            />
            <input
              className="form-input"
              name="description"
              placeholder="Description"
            />
            <button className="primary-button md:w-fit" type="submit">
              Create network
            </button>
          </form>
        </details>
      )}
      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {networks.map((network) => {
          const networkDevices = devices.filter(
            (device) => device.network_id === network.id,
          );
          return (
            <Link
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              href={`/networks/${network.id}`}
              key={network.id}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    {network.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {network.location ?? "No location"}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-700">
                  {network.status}
                </span>
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-500">
                {network.description ?? "No description provided."}
              </p>
              <div className="mt-6 flex gap-6 border-t border-slate-100 pt-4 text-sm">
                <span>
                  <strong>{networkDevices.length}</strong> devices
                </span>
                <span className="text-emerald-700">
                  <strong>
                    {
                      networkDevices.filter(
                        (device) => device.status === "online",
                      ).length
                    }
                  </strong>{" "}
                  online
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
