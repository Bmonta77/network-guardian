export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <svg
        aria-hidden="true"
        className="size-9 text-blue-600"
        fill="none"
        viewBox="0 0 32 32"
      >
        <path
          d="M16 2.75 27 7.2v7.35c0 6.78-4.47 12.55-11 14.7-6.53-2.15-11-7.92-11-14.7V7.2L16 2.75Z"
          fill="currentColor"
          opacity=".15"
        />
        <path
          d="M16 4.5 25.25 8v6.55c0 5.7-3.64 10.65-9.25 12.8-5.61-2.15-9.25-7.1-9.25-12.8V8L16 4.5Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M11.5 16a6.36 6.36 0 0 1 9 0M13.9 18.4a3 3 0 0 1 4.2 0M16 21h.01"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        />
      </svg>
      {!compact && (
        <div>
          <p className="font-bold tracking-tight text-slate-950">
            Network Guardian
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Cloud network operations
          </p>
        </div>
      )}
    </div>
  );
}
