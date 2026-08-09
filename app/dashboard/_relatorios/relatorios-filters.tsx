import {
  BarChart3,
  CalendarRange,
  Download,
  Filter,
  Printer,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderHeading,
  PageHeaderIcon,
  PageHeaderIdentity,
  PageHeaderToolbar,
} from "@/components/ui/page-header";
import type { ReportArea, ReportFilter, ReportPeriodPreset } from "./relatorios-types";
import { RelatoriosAdvancedFilters } from "./relatorios-advanced-filters";
type Props = {
  filters: ReportFilter;
  onChange: (value: ReportFilter) => void;
  onRefresh: () => void;
  onExport: () => void;
  onPrint: () => void;
  loading: boolean;
};
export function RelatoriosFilters({
  filters,
  onChange,
  onRefresh,
  onExport,
  onPrint,
  loading,
}: Props) {
  const update = <K extends keyof ReportFilter>(key: K, value: ReportFilter[K]) =>
    onChange({ ...filters, [key]: value });
  return (
    <PageHeader className="print:border-0 print:shadow-none">
      <PageHeaderContent>
        <PageHeaderIdentity>
          <PageHeaderIcon>
            <BarChart3 className="h-4 w-4" />
          </PageHeaderIcon>
          <PageHeaderHeading
            title="Relatórios"
            description="Análises consolidadas das fontes operacionais do ProFlow."
          />
        </PageHeaderIdentity>
        <PageHeaderActions className="print:hidden">
          <Button variant="secondary" size="sm" onClick={onPrint}>
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
          <Button variant="secondary" size="sm" onClick={onExport}>
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </PageHeaderActions>
      </PageHeaderContent>
      <PageHeaderToolbar className="grid gap-2 lg:grid-cols-[11rem_12rem_12rem_minmax(12rem,1fr)] print:hidden">
        <label className="space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground">Período</span>
          <Select
            className="h-9"
            value={filters.preset}
            onChange={(event) =>
              update("preset", event.target.value as ReportPeriodPreset)
            }
          >
            <option value="TODAY">Hoje</option>
            <option value="LAST_7_DAYS">Últimos 7 dias</option>
            <option value="LAST_30_DAYS">Últimos 30 dias</option>
            <option value="CURRENT_MONTH">Mês atual</option>
            <option value="PREVIOUS_MONTH">Mês anterior</option>
            <option value="CURRENT_QUARTER">Trimestre atual</option>
            <option value="CURRENT_YEAR">Ano atual</option>
            <option value="CUSTOM">Personalizado</option>
          </Select>
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground">Área</span>
          <Select
            className="h-9"
            value={filters.area}
            onChange={(event) => update("area", event.target.value as ReportArea)}
          >
            <option value="ALL">Todas as áreas</option>
            <option value="COMMERCIAL">Comercial</option>
            <option value="OPERATIONAL">Operacional</option>
            <option value="FINANCIAL">Financeiro</option>
            <option value="INVENTORY">Estoque</option>
            <option value="ASSETS">Equipamentos</option>
            <option value="PRICING">Precificação</option>
          </Select>
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground">
            Comparação
          </span>
          <Select
            className="h-9"
            value={filters.comparison}
            onChange={(event) =>
              update("comparison", event.target.value as ReportFilter["comparison"])
            }
          >
            <option value="NONE">Sem comparação</option>
            <option value="PREVIOUS_PERIOD">Período anterior equivalente</option>
            <option value="CUSTOM">Período personalizado</option>
          </Select>
        </label>
        <div className="flex items-end gap-2">
          {filters.preset === "CUSTOM" ? (
            <>
              <input
                aria-label="Início do período"
                type="date"
                value={filters.startDate}
                onChange={(event) => update("startDate", event.target.value)}
                className="h-9 min-w-0 flex-1 rounded-md border bg-card px-2 text-xs"
              />
              <input
                aria-label="Fim do período"
                type="date"
                value={filters.endDate}
                onChange={(event) => update("endDate", event.target.value)}
                className="h-9 min-w-0 flex-1 rounded-md border bg-card px-2 text-xs"
              />
            </>
          ) : (
            <div className="flex h-9 flex-1 items-center gap-2 rounded-md border bg-card px-3 text-xs text-muted-foreground">
              <CalendarRange className="h-4 w-4" />
              Intervalo calculado automaticamente
            </div>
          )}
          <Button
            variant="secondary"
            size="sm"
            title="Filtros avançados"
            onClick={() => update("includeArchived", !filters.includeArchived)}
          >
            <Filter className="h-4 w-4" />
            {filters.includeArchived ? "Com arquivados" : "Ativos"}
          </Button>
        </div>
        {filters.comparison === "CUSTOM" ? (
          <div className="flex gap-2 lg:col-start-4">
            <input
              aria-label="Início da comparação"
              type="date"
              value={filters.comparisonStartDate}
              onChange={(event) => update("comparisonStartDate", event.target.value)}
              className="h-9 flex-1 rounded-md border bg-card px-2 text-xs"
            />
            <input
              aria-label="Fim da comparação"
              type="date"
              value={filters.comparisonEndDate}
              onChange={(event) => update("comparisonEndDate", event.target.value)}
              className="h-9 flex-1 rounded-md border bg-card px-2 text-xs"
            />
          </div>
        ) : null}
    </PageHeaderToolbar>
    <RelatoriosAdvancedFilters filters={filters} onChange={onChange} />
  </PageHeader>
  );
}
