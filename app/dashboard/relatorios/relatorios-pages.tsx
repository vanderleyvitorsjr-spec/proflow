"use client";

import { useMemo, useState } from "react";

import {
  cityPerformance,
  customerRanking,
  monthlyReportData,
  reportMetrics,
  serviceRanking,
  technicianPerformance,
  type ReportArea,
  type ReportPeriod,
} from "./relatorios-data";
import { RelatoriosCharts } from "./relatorios-charts";
import { RelatoriosFilters } from "./relatorios-filters";
import { RelatoriosRanking } from "./relatorios-ranking";
import { RelatoriosSummary } from "./relatorios-summary";

const periodMonthCount: Record<ReportPeriod, number> = {
  CURRENT_MONTH: 1,
  LAST_MONTH: 1,
  LAST_3_MONTHS: 3,
  LAST_6_MONTHS: 6,
  CURRENT_YEAR: 12,
};

export function RelatoriosPageContent() {
  const [period, setPeriod] =
    useState<ReportPeriod>("LAST_6_MONTHS");
  const [area, setArea] = useState<ReportArea>("ALL");
  const [comparisonEnabled, setComparisonEnabled] =
    useState(true);

  const filteredMetrics = useMemo(() => {
    if (area === "ALL") {
      return reportMetrics;
    }

    return reportMetrics.filter(
      (metric) => metric.area === area,
    );
  }, [area]);

  const filteredMonthlyData = useMemo(() => {
    const monthCount = periodMonthCount[period];

    if (period === "LAST_MONTH") {
      return monthlyReportData.slice(-2, -1);
    }

    return monthlyReportData.slice(-monthCount);
  }, [period]);

  return (
    <div className="space-y-3">
      <RelatoriosFilters
        period={period}
        area={area}
        comparisonEnabled={comparisonEnabled}
        onPeriodChange={setPeriod}
        onAreaChange={setArea}
        onComparisonChange={setComparisonEnabled}
      />

      <RelatoriosSummary
        metrics={filteredMetrics}
        comparisonEnabled={comparisonEnabled}
      />

      <RelatoriosCharts data={filteredMonthlyData} />

      <RelatoriosRanking
        services={serviceRanking}
        customers={customerRanking}
        technicians={technicianPerformance}
        cities={cityPerformance}
      />
    </div>
  );
}

export default RelatoriosPageContent;
