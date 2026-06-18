"use client";

import { useActionState, useState } from "react";
import { registerScannerAgent } from "@/app/(dashboard)/actions";
import type { RegisterAgentState } from "@/app/(dashboard)/actions";
import type { Network } from "@/lib/types";

const initialRegisterAgentState: RegisterAgentState = {
  status: "idle",
  message: "",
};

export function RegisterAgent({ networks }: { networks: Network[] }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [state, formAction, pending] = useActionState(
    registerScannerAgent,
    initialRegisterAgentState,
  );

  const copyToken = async () => {
    if (!state.token) return;
    await navigator.clipboard.writeText(state.token);
    setCopied(true);
  };

  return (
    <>
      <button
        className="primary-button"
        disabled={networks.length === 0}
        onClick={() => setOpen(true)}
        title={
          networks.length === 0
            ? "Create a network before registering an agent"
            : undefined
        }
        type="button"
      >
        Register agent
      </button>

      {open && (
        <div
          aria-labelledby="register-agent-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-blue-700">
                  Local scanner
                </p>
                <h2
                  className="mt-1 text-2xl font-bold tracking-tight text-slate-950"
                  id="register-agent-title"
                >
                  Register scanner agent
                </h2>
              </div>
              <button
                aria-label="Close registration dialog"
                className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                onClick={() => setOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>

            {state.status === "success" && state.token ? (
              <div className="mt-6">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  {state.message}
                </div>
                <dl className="mt-5 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-400">
                      Agent
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-800">
                      {state.agentName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-400">
                      Network
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-800">
                      {state.networkName}
                    </dd>
                  </div>
                </dl>
                <label className="mt-5 block">
                  <span className="text-sm font-semibold text-slate-700">
                    One-time agent token
                  </span>
                  <textarea
                    className="mt-2 min-h-28 w-full resize-none rounded-xl border border-slate-300 bg-slate-950 p-3 font-mono text-xs leading-5 text-blue-100"
                    readOnly
                    value={state.token}
                  />
                </label>
                <button
                  className="primary-button mt-3 w-full"
                  onClick={copyToken}
                  type="button"
                >
                  {copied ? "Token copied" : "Copy token"}
                </button>
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  Add this value to{" "}
                  <code className="font-mono text-xs">
                    agent/.env
                  </code>{" "}
                  as{" "}
                  <code className="font-mono text-xs">
                    NETWORK_GUARDIAN_AGENT_TOKEN
                  </code>
                  . Store it securely; only its hash exists in Supabase.
                </div>
              </div>
            ) : (
              <form action={formAction} className="mt-6 space-y-4">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Agent name
                  </span>
                  <input
                    className="form-input mt-2"
                    name="agentName"
                    placeholder="Headquarters Scanner 01"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Assigned network
                  </span>
                  <select
                    className="form-input mt-2"
                    defaultValue=""
                    name="networkId"
                    required
                  >
                    <option disabled value="">
                      Select a network
                    </option>
                    {networks.map((network) => (
                      <option key={network.id} value={network.id}>
                        {network.name}
                        {network.location ? ` · ${network.location}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="text-xs leading-5 text-slate-500">
                  The agent will only receive enabled private scan ranges for
                  this network.
                </p>
                {state.status === "error" && (
                  <p
                    aria-live="polite"
                    className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
                  >
                    {state.message}
                  </p>
                )}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    className="small-button"
                    onClick={() => setOpen(false)}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="primary-button"
                    disabled={pending}
                    type="submit"
                  >
                    {pending ? "Registering…" : "Register agent"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
