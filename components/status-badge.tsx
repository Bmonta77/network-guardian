import type { DeviceStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: DeviceStatus }) {
  const styles = {
    online: "bg-emerald-50 text-emerald-700",
    offline: "bg-rose-50 text-rose-700",
    warning: "bg-amber-50 text-amber-700",
    unknown: "bg-amber-50 text-amber-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles[status]}`}
    >
      <span
        className={`size-2 rounded-full ${
          status === "online"
            ? "bg-emerald-500"
            : status === "offline"
              ? "bg-rose-500"
              : "bg-amber-500"
        }`}
      />
      {status}
    </span>
  );
}
