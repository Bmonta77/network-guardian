import { DeviceGrid } from "@/components/device-grid";
import { PageHeader } from "@/components/page-header";
import { getDevices } from "@/lib/data";

export default async function ViewerDashboardPage() {
  const devices = await getDevices();
  return (
    <>
      <PageHeader
        description="Read-only health view for the networks assigned to this viewer. Production inventory cannot be edited here."
        eyebrow="Viewer access"
        title="Viewer dashboard"
      />
      <DeviceGrid initialDevices={devices} />
    </>
  );
}
