import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { Logo } from "@/components/logo";
import type { OrganizationRole } from "@/lib/types";

const navigation = [
  ["Dashboard", "/dashboard"],
  ["Networks", "/networks"],
  ["Devices", "/devices"],
  ["Scanner agents", "/scanner-agents"],
  ["Change requests", "/change-requests"],
  ["Incidents", "/incidents"],
  ["Viewer dashboard", "/viewer"],
  ["Settings", "/settings"],
] as const;

export function AppShell({
  children,
  organizationName,
  role,
  email,
  demo,
}: {
  children: React.ReactNode;
  organizationName: string;
  role: OrganizationRole;
  email: string;
  demo: boolean;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-[1500px] items-center justify-between px-5 lg:px-8">
          <Logo />
          <div className="flex items-center gap-3 text-right">
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-800">{email}</p>
              <p className="text-xs capitalize text-slate-400">
                {role} · {organizationName}
              </p>
            </div>
            <form action={signOut}>
              <button
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                type="submit"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      {demo && (
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-2 text-center text-xs font-medium text-amber-800">
          Demo mode: add Supabase environment variables to enable authentication,
          realtime data, and RLS.
        </div>
      )}
      <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[230px_1fr]">
        <aside className="border-b border-slate-200 bg-white p-3 lg:min-h-[calc(100vh-65px)] lg:border-r lg:border-b-0 lg:p-5">
          <nav className="flex gap-2 overflow-x-auto lg:flex-col">
            {navigation.map(([label, href]) => {
              if (
                role === "viewer" &&
                ["/scanner-agents", "/settings"].includes(href)
              ) {
                return null;
              }
              return (
                <Link
                  className="whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
                  href={href}
                  key={href}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0 p-5 sm:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
