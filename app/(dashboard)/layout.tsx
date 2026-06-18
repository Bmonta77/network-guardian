import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentContext } from "@/lib/data";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getCurrentContext();
  if (!context) redirect("/");

  return (
    <AppShell
      demo={context.demo}
      email={context.user.email}
      organizationName={context.organization.name}
      role={context.role}
    >
      {children}
    </AppShell>
  );
}
