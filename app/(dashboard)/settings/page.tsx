import { PageHeader } from "@/components/page-header";
import { getCurrentContext } from "@/lib/data";

export default async function SettingsPage() {
  const context = await getCurrentContext();
  return (
    <>
      <PageHeader
        description="Organization profile, member invitations, notification defaults, retention, and security configuration."
        eyebrow="Administration"
        title="Settings"
      />
      {context?.role !== "admin" ? (
        <div className="empty-state mt-8">
          Admin access is required to change organization settings.
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {[
            [
              "Organization",
              "Manage the organization name, primary contact, and account ownership.",
            ],
            [
              "Members and access",
              "Invite viewers and assign them to specific networks.",
            ],
            [
              "Notifications",
              "Configure default offline alerts and incident escalation.",
            ],
            [
              "Security",
              "Review scanner tokens, session controls, and audit requirements.",
            ],
          ].map(([title, description]) => (
            <section
              className="rounded-2xl border border-slate-200 bg-white p-6"
              key={title}
            >
              <h2 className="font-semibold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {description}
              </p>
              <button className="small-button mt-5" type="button">
                Configure
              </button>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
