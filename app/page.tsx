import { redirect } from "next/navigation";
import { signIn } from "@/app/auth/actions";
import { Logo } from "@/components/logo";
import { getCurrentContext } from "@/lib/data";

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const context = await getCurrentContext();
  if (context && !context.demo) redirect("/dashboard");
  const { error } = await searchParams;

  return (
    <main className="grid min-h-screen bg-slate-950 lg:grid-cols-2">
      <section className="flex flex-col justify-between bg-blue-950 p-8 text-white sm:p-12 lg:p-16">
        <Logo />
        <div className="my-16 max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
            Multi-site network operations
          </p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl">
            Monitor every private network from one secure dashboard.
          </h1>
          <p className="mt-6 text-lg leading-8 text-blue-100/80">
            Network Guardian connects cloud visibility with local scanning
            agents, role-based access, incident history, and controlled change
            approvals.
          </p>
        </div>
        <p className="text-sm text-blue-200/60">
          Private IP scanning always happens inside the target network.
        </p>
      </section>
      <section className="flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-9">
          <p className="text-sm font-semibold text-blue-700">Welcome back</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Sign in
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Admins, scanner operators, and viewers use organization-managed
            accounts.
          </p>
          <form action={signIn} className="mt-7 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Email</span>
              <input
                className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                name="email"
                required
                type="email"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Password
              </span>
              <input
                className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                minLength={8}
                name="password"
                required
                type="password"
              />
            </label>
            {error && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            )}
            <button
              className="h-12 w-full rounded-xl bg-blue-700 font-semibold text-white hover:bg-blue-800"
              type="submit"
            >
              Sign in
            </button>
          </form>
          {context?.demo && (
            <a
              className="mt-4 block text-center text-sm font-semibold text-blue-700"
              href="/dashboard"
            >
              Continue in demo mode
            </a>
          )}
        </div>
      </section>
    </main>
  );
}
