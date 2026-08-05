import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireCompanyContext } from "@/lib/auth/context";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await requireCompanyContext();
  return <DashboardShell context={context}>{children}</DashboardShell>;
}
