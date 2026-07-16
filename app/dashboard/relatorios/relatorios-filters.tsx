import {
  CalendarRange,
  Download,
  FileSpreadsheet,
  Filter,
  Printer,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import type {
  ReportArea,
  ReportPeriod,
} from "./relatorios-data";

type RelatoriosFiltersProps = {
  period: ReportPeriod;
  area: ReportArea;
  comparisonEnabled: boolean;
  onPeriodChange: (value: ReportPeriod) => void;
  onAreaChange: (value: ReportArea) => void;
  onComparisonChange: (value: boolean) => void;
};

export function RelatoriosFilters({
  period,
  area,
  comparisonEnabled,
  onPeriodChange,
  onAreaChange,
  onComparisonChange,
}: RelatoriosFiltersProps) {
  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-card px-4 py-3 shadow-xs">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-white">
            <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
          </div>

          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Relatórios
            </h2>

            <p className="mt-0.5 text-xs text-muted-foreground">
              Analise desempenho financeiro, comercial e operacional.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm">
            <Printer className="h-4 w-4" aria-hidden="true" />
            Imprimir
          </Button>

          <Button type="button" variant="secondary" size="sm">
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            Excel
          </Button>

          <Button type="button" variant="secondary" size="sm">
            <Download className="h-4 w-4" aria-hidden="true" />
            Exportar PDF
          </Button>

          <Button type="button" size="sm">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="mt-3 grid gap-2 border-t border-border pt-3 lg:grid-cols-[12rem_12rem_minmax(16rem,1fr)_auto]">
        <label className="space-y-1.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <CalendarRange className="h-3.5 w-3.5" aria-hidden="true" />
            Período
          </span>

          <select
            value={period}
            onChange={(event) =>
              onPeriodChange(event.target.value as ReportPeriod)
            }
            className="h-9 w-full rounded-[var(--radius-control)] border border-input bg-background px-3 text-sm font-medium text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
          >
            <option value="CURRENT_MONTH">Este mês</option>
            <option value="LAST_MONTH">Mês anterior</option>
            <option value="LAST_3_MONTHS">Últimos 3 meses</option>
            <option value="LAST_6_MONTHS">Últimos 6 meses</option>
            <option value="CURRENT_YEAR">Este ano</option>
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Filter className="h-3.5 w-3.5" aria-hidden="true" />
            Área
          </span>

          <select
            value={area}
            onChange={(event) =>
              onAreaChange(event.target.value as ReportArea)
            }
            className="h-9 w-full rounded-[var(--radius-control)] border border-input bg-background px-3 text-sm font-medium text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
          >
            <option value="ALL">Todas as áreas</option>
            <option value="FINANCIAL">Financeiro</option>
            <option value="COMMERCIAL">Comercial</option>
            <option value="OPERATIONAL">Operacional</option>
            <option value="STOCK">Estoque</option>
          </select>
        </label>

        <div className="flex items-end">
          <div className="flex h-9 w-full items-center justify-between rounded-[var(--radius-control)] border border-border bg-muted/35 px-3">
            <div>
              <p className="text-xs font-semibold text-foreground">
                Comparar com período anterior
              </p>
              <p className="hidden text-[0.65rem] text-muted-foreground sm:block">
                Exibe variações nos indicadores.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onComparisonChange(!comparisonEnabled)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                comparisonEnabled
                  ? "bg-sky-500"
                  : "bg-slate-300 dark:bg-slate-700"
              }`}
              aria-pressed={comparisonEnabled}
              aria-label="Ativar comparação"
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  comparisonEnabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex items-end">
          <Button type="button" variant="secondary" className="h-9">
            <Filter className="h-4 w-4" aria-hidden="true" />
            Mais filtros
          </Button>
        </div>
      </div>
    </section>
  );
}
