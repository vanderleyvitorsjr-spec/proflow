import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CircleDot,
  Clock3,
  Gauge,
  TrendingUp,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const cashFlowData = [
  { month: "Fev", revenue: 52, expenses: 29 },
  { month: "Mar", revenue: 63, expenses: 35 },
  { month: "Abr", revenue: 58, expenses: 32 },
  { month: "Mai", revenue: 76, expenses: 41 },
  { month: "Jun", revenue: 68, expenses: 38 },
  { month: "Jul", revenue: 88, expenses: 45 },
];

const serviceDistribution = [
  {
    label: "Manutenção corretiva",
    value: 148,
    percentage: 53.60,
    barClass: "bg-sky-500",
  },
  {
    label: "Manutenção preventiva",
    value: 86,
    percentage: 31.20,
    barClass: "bg-emerald-500",
  },
  {
    label: "Instalação",
    value: 42,
    percentage: 15.20,
    barClass: "bg-amber-500",
  },
];

const operationalIndicators = [
  { label: "Concluídas", value: "22", detail: "no período", icon: CheckCircle2, tone: "text-emerald-600" },
  { label: "Tempo médio", value: "2h 18min", detail: "por atendimento", icon: Clock3, tone: "text-amber-600" },
  { label: "Eficiência", value: "92,40%", detail: "da capacidade", icon: Gauge, tone: "text-sky-600" },
];

export function ChartsSection() {
  return (
    <section className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.8fr)_minmax(15rem,0.7fr)]">
      <Card className="rounded-[var(--radius-card)] border-border bg-card shadow-xs">
        <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border px-3.5 py-2.5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Movimentação mensal
            </p>
            <CardTitle className="mt-0.5 text-base">
              Receita e despesas
            </CardTitle>
          </div>

          <div className="hidden items-center gap-4 text-xs font-medium text-muted-foreground sm:flex">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
              Receita
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
              Despesas
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-3.5 pt-2.5">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Resultado acumulado
              </p>
              <p className="proflow-metric mt-1 text-xl font-bold text-foreground">
                R$ 126.840,00
              </p>
            </div>

            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              14,80% acima do período anterior
            </div>
          </div>

          <div className="relative">
            <div
              className="pointer-events-none absolute inset-0 flex flex-col justify-between"
              aria-hidden="true"
            >
              {Array.from({ length: 5 }).map((_, index) => (
                <span
                  key={index}
                  className="block border-t border-dashed border-border"
                />
              ))}
            </div>

            <div className="relative flex h-36 items-end gap-3 sm:gap-4">
              {cashFlowData.map((item) => (
                <div
                  key={item.month}
                  className="flex h-full min-w-0 flex-1 flex-col justify-end"
                >
                  <div className="flex h-full items-end justify-center gap-1 sm:gap-1.5">
                    <div
                      className="w-full max-w-5 rounded-t-md bg-sky-500 transition-opacity hover:opacity-80 sm:max-w-7"
                      style={{ height: `${item.revenue}%` }}
                      title={`${item.month}: receita`}
                    />
                    <div
                      className="w-full max-w-5 rounded-t-md bg-slate-300 transition-opacity hover:opacity-80 dark:bg-slate-600 sm:max-w-7"
                      style={{ height: `${item.expenses}%` }}
                      title={`${item.month}: despesas`}
                    />
                  </div>

                  <p className="mt-3 text-center text-xs font-medium text-muted-foreground">
                    {item.month}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[var(--radius-card)] border-border bg-card shadow-xs">
        <CardHeader className="border-b border-border px-3.5 py-2.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Volume operacional
              </p>
              <CardTitle className="mt-0.5 text-base">
                Serviços por tipo
              </CardTitle>
            </div>

            <div className="rounded-lg bg-sky-50 p-2 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
              <BarChart3 className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3.5 pt-2.5">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Total de atendimentos
              </p>
              <p className="proflow-metric mt-1 text-xl font-bold text-foreground">
                276
              </p>
            </div>

            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              9,30%
            </span>
          </div>

          <div className="space-y-3.5">
            {serviceDistribution.map((service) => (
              <div key={service.label}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <CircleDot
                      className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="truncate text-sm font-medium text-foreground">
                      {service.label}
                    </span>
                  </div>

                  <span className="text-sm font-bold text-foreground">
                    {service.value}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${service.barClass}`}
                    style={{ width: `${service.percentage}%` }}
                  />
                </div>

                <p className="mt-1.5 text-right text-[0.68rem] font-medium text-muted-foreground">
                  {service.percentage.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  %
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[var(--radius-card)] border-border bg-card shadow-xs">
        <CardHeader className="border-b border-border px-3.5 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Performance</p>
          <CardTitle className="mt-0.5 text-base">Indicadores operacionais</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {operationalIndicators.map((indicator) => {
            const Icon = indicator.icon;
            return (
              <div key={indicator.label} className="flex items-center gap-3 px-3.5 py-2.5">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted ${indicator.tone}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">{indicator.label}</p>
                  <p className="proflow-metric mt-0.5 text-base font-bold text-foreground">{indicator.value}</p>
                </div>
                <span className="text-[0.65rem] text-muted-foreground">{indicator.detail}</span>
              </div>
            );
          })}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Meta mensal</span>
              <span className="font-bold text-foreground">84%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full w-[84%] rounded-full bg-sky-500" /></div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default ChartsSection;
