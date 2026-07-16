"use client";
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, BarChart3 } from "lucide-react";
import { generateReportAction } from "./relatorios-actions";
import { downloadReportCsv } from "./relatorios-export";
import type { ReportDataset, ReportFilter } from "./relatorios-types";
import { RelatoriosFilters } from "./relatorios-filters";
import { RelatoriosSummary } from "./relatorios-summary";
import { RelatoriosCharts } from "./relatorios-charts";
import { RelatoriosRanking } from "./relatorios-ranking";
import { RelatoriosSourceStatus } from "./relatorios-source-status";
import { RelatoriosLoading } from "./relatorios-loading";
import { EmptyState } from "@/components/ui/empty-state";
const initialFilters: ReportFilter = {
  preset: "LAST_30_DAYS",
  startDate: "",
  endDate: "",
  comparison: "PREVIOUS_PERIOD",
  comparisonStartDate: "",
  comparisonEndDate: "",
  area: "ALL",
  clientId: "",
  salesOwner: "",
  technician: "",
  category: "",
  status: "",
  origin: "",
  city: "",
  state: "",
  serviceType: "",
  financialAccount: "",
  financialNature: "",
  assetOwnership: "",
  divergence: "",
  includeArchived: false,
};
export function RelatoriosPageContent() {
  const [filters, setFilters] = useState(initialFilters),
    [dataset, setDataset] = useState<ReportDataset>(),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    const result = await generateReportAction(filters);
    if (result.ok) setDataset(result.data);
    else setError(result.error);
    setLoading(false);
  }, [filters]);
  useEffect(() => {
    let active = true;
    void generateReportAction(filters).then((result) => {
      if (!active) return;
      if (result.ok) setDataset(result.data);
      else setError(result.error);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [filters]);
  const exportCsv = () => {
    if (!dataset) return;
    try {
      downloadReportCsv(dataset);
      setNotice("Arquivo CSV gerado com os filtros atuais.");
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Não foi possível exportar.");
    }
  };
  return (
    <div className="space-y-3">
      <RelatoriosFilters
        filters={filters}
        onChange={setFilters}
        onRefresh={() => void refresh()}
        onExport={exportCsv}
        onPrint={() => window.print()}
        loading={loading}
      />
      {notice ? (
        <div
          role="status"
          className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300"
        >
          {notice}
        </div>
      ) : null}
      {error ? (
        <EmptyState
          icon={<AlertCircle className="h-5 w-5" />}
          title="Não foi possível gerar os relatórios"
          description={error}
        />
      ) : loading && !dataset ? (
        <RelatoriosLoading />
      ) : dataset ? (
        <>
          <RelatoriosSourceStatus
            statuses={dataset.sourceStatus}
            generatedAt={dataset.generatedAt}
            executionTimeMs={dataset.executionTimeMs}
          />
          {dataset.sections.length ? (
            dataset.sections.map((section) => (
              <section
                key={section.area}
                className="space-y-3 rounded-xl border border-border/80 bg-muted/15 p-3"
              >
                <div>
                  <h2 className="text-base font-semibold">{section.title}</h2>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </div>
                <RelatoriosSummary
                  metrics={section.metrics}
                  comparisonEnabled={filters.comparison !== "NONE"}
                />
                <RelatoriosCharts charts={section.charts} />
                <RelatoriosRanking rankings={section.rankings} />
              </section>
            ))
          ) : (
            <EmptyState
              icon={<BarChart3 className="h-5 w-5" />}
              title="Nenhum dado no período"
              description="Ajuste o período ou remova filtros para ampliar a consulta."
            />
          )}
        </>
      ) : null}
    </div>
  );
}
export default RelatoriosPageContent;
