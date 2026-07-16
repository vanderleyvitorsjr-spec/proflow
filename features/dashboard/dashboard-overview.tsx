import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { ChartsSection } from "@/components/dashboard/charts-section";
import { CommercialSummary } from "@/components/dashboard/commercial-summary";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { FinanceSummary } from "@/components/dashboard/finance-summary";
import { OperationalSummary } from "@/components/dashboard/operational-summary";

export function DashboardOverview() {
  return (
    <div className="space-y-3">
      <DashboardHeader />

      <FinanceSummary />

      <section className="grid items-stretch gap-3 xl:grid-cols-2">
        <CommercialSummary />
        <OperationalSummary />
      </section>

      <ChartsSection />

      <AlertsPanel />
    </div>
  );
}
