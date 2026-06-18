import { notFound } from "next/navigation";
import { DeviceGrid } from "@/components/device-grid";
import { PageHeader } from "@/components/page-header";
import { ScanNetwork } from "@/components/scan-network";
import {
  getCurrentContext,
  getDevices,
  getNetworkScanControl,
  getNetworks,
} from "@/lib/data";

export default async function NetworkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [context, networks, devices, scanControl] = await Promise.all([
    getCurrentContext(),
    getNetworks(),
    getDevices(),
    getNetworkScanControl(id),
  ]);
  const network = networks.find((item) => item.id === id);
  if (!network) notFound();
  const networkDevices = devices.filter((device) => device.network_id === id);

  return (
    <>
      <PageHeader
        action={
          context?.role === "admin" ? (
            <ScanNetwork control={scanControl} networkId={id} />
          ) : undefined
        }
        description={
          network.description ??
          "Device inventory and scanner status for this network."
        }
        eyebrow={network.location ?? "Network site"}
        title={network.name}
      />
      <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900">
        Scan ranges and VLANs are managed by Admins and fetched by the assigned
        local agent. The hosted application never probes this private network.
      </div>
      <DeviceGrid initialDevices={networkDevices} />
    </>
  );
}
