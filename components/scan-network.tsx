"use client";

import { useActionState } from "react";
import {
  requestNetworkScan,
  type RequestScanState,
} from "@/app/(dashboard)/actions";
import type { NetworkScanControl } from "@/lib/types";

const initialState: RequestScanState = {
  status: "idle",
  message: "",
};

function formatTime(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : "Never";
}

export function ScanNetwork({
  networkId,
  control,
}: {
  networkId: string;
  control: NetworkScanControl;
}) {
  const [state, formAction, pending] = useActionState(
    requestNetworkScan,
    initialState,
  );
  const unavailable =
    control.agentCount === 0 || control.enabledRangeCount === 0;

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <form action={formAction}>
        <input name="networkId" type="hidden" value={networkId} />
        <button
          className="primary-button"
          disabled={pending || unavailable}
          title={
            control.agentCount === 0
              ? "Register a scanner agent first"
              : control.enabledRangeCount === 0
                ? "Configure an enabled private VLAN/subnet first"
                : "Queue an immediate scan on the local agent"
          }
          type="submit"
        >
          {pending ? "Queuing scan…" : "Scan"}
        </button>
      </form>
      <p className="max-w-xs text-right text-xs text-slate-400">
        {control.agentCount === 0
          ? "No scanner agent assigned"
          : control.enabledRangeCount === 0
            ? "No enabled scan ranges"
            : `${control.agentCount} agent · ${control.enabledRangeCount} private range${
                control.enabledRangeCount === 1 ? "" : "s"
              }`}
      </p>
      {state.message && (
        <p
          aria-live="polite"
          className={`max-w-sm text-right text-xs font-medium ${
            state.status === "error" ? "text-rose-600" : "text-emerald-600"
          }`}
        >
          {state.message}
        </p>
      )}
      {control.scanCompletedAt && (
        <p className="text-right text-xs text-slate-400">
          Last manual scan completed {formatTime(control.scanCompletedAt)}
        </p>
      )}
      {control.scanError && (
        <p className="max-w-sm text-right text-xs text-rose-600">
          Last scan error: {control.scanError}
        </p>
      )}
    </div>
  );
}
