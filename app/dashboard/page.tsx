import { DashboardOverview } from "@/features/dashboard/dashboard-overview";
import { ProFlowQuickLaunch } from "@/features/dashboard/proflow-quick-launch";

export default function DashboardHome() {
  return <div className="space-y-4"><ProFlowQuickLaunch /><DashboardOverview /></div>;
}
