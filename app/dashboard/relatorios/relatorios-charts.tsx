import {
  BarChart3,
  CircleDollarSign,
  Percent,
  Target,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { MonthlyReportData } from "./relatorios-data";

type RelatoriosChartsProps = {
  data: MonthlyReportData[];
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

const percentageFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function RelatoriosCharts({
  data,
}: RelatoriosChartsProps) {
  const maximumFinancialValue = Math.max(
    ...data.flatMap((item) => [
      item.revenue,
      item.expenses,
      item.profit,
    ]),
    1,
  );

  const maximumOrders = Math.max(
    ...data.map((item) => item.serviceOrders),
    1,
  );

  const totalRevenue = data.reduce(
    (total, item) => total + item.revenue,
    0,
  );

  const totalProfit = data.reduce(
    (total, item) => total + item.profit,
    0,
  );

  const averageMargin =
    totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const totalProposals = data.reduce(
    (total, item) => total + item.proposals,
    0,
  );

  const totalApprovals = data.reduce(
    (total, item) => total + item.approvals,
    0,
  );

  const conversion =
    totalProposals > 0
      ? (totalApprovals / totalProposals) * 100
      : 0;

  return (
    <section className="grid gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.45fr)]">
      <Card className="rounded-[var(--radius-card)] border-border bg-card shadow-xs">
        <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Evolução financeira
            </p>

            <CardTitle className="mt-1 text-lg">
              Receita, despesas e resultado
            </CardTitle>
          </div>

          <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <CircleDollarSign className="h-5 w-5" aria-hidden="true" />
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="mb-3 flex flex-wrap gap-3 text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Receita
            </span>

            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              Despesas
            </span>

            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
              Resultado
            </span>
          </div>

          <div className="relative">
            <div
              className="pointer-events-none absolute inset-0 flex flex-col justify-between"
              aria-hidden="true"
            >
              {Array.from({ length: 5 }).map((_, index) => (
                <span
                  key={index}
                  className="border-t border-dashed border-border"
                />
              ))}
            </div>

            <div className="relative flex h-48 items-end gap-3 sm:gap-5">
              {data.map((item) => (
                <div
                  key={item.month}
                  className="flex h-full min-w-0 flex-1 flex-col justify-end"
                >
                  <div className="flex h-full items-end justify-center gap-1">
                    <div
                      className="w-full max-w-6 rounded-t-md bg-emerald-500"
                      style={{
                        height: `${(item.revenue / maximumFinancialValue) * 100}%`,
                      }}
                      title={`${item.month}: ${currencyFormatter.format(item.revenue)}`}
                    />

                    <div
                      className="w-full max-w-6 rounded-t-md bg-rose-400"
                      style={{
                        height: `${(item.expenses / maximumFinancialValue) * 100}%`,
                      }}
                      title={`${item.month}: ${currencyFormatter.format(item.expenses)}`}
                    />

                    <div
                      className="w-full max-w-6 rounded-t-md bg-sky-500"
                      style={{
                        height: `${(item.profit / maximumFinancialValue) * 100}%`,
                      }}
                      title={`${item.month}: ${currencyFormatter.format(item.profit)}`}
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <Card className="rounded-[var(--radius-card)] border-border bg-card shadow-xs">
          <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Margem
              </p>

              <CardTitle className="mt-1 text-lg">
                Rentabilidade
              </CardTitle>
            </div>

            <Percent
              className="h-5 w-5 text-emerald-600"
              aria-hidden="true"
            />
          </CardHeader>

          <CardContent className="p-4">
            <p className="text-2xl font-bold text-foreground">
              {percentageFormatter.format(averageMargin)}%
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Margem acumulada no período.
            </p>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{
                  width: `${Math.min(100, averageMargin)}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[var(--radius-card)] border-border bg-card shadow-xs">
          <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Comercial
              </p>

              <CardTitle className="mt-1 text-lg">
                Conversão de propostas
              </CardTitle>
            </div>

            <Target
              className="h-5 w-5 text-violet-600"
              aria-hidden="true"
            />
          </CardHeader>

          <CardContent className="p-4">
            <p className="text-2xl font-bold text-foreground">
              {percentageFormatter.format(conversion)}%
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {totalApprovals} aprovações em {totalProposals} propostas.
            </p>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-violet-500"
                style={{
                  width: `${Math.min(100, conversion)}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[var(--radius-card)] border-border bg-card shadow-xs xl:col-span-2">
        <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Operação
            </p>

            <CardTitle className="mt-1 text-lg">
              Ordens de Serviço concluídas
            </CardTitle>
          </div>

          <BarChart3
            className="h-5 w-5 text-sky-600"
            aria-hidden="true"
          />
        </CardHeader>

        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {data.map((item) => (
              <div key={item.month}>
                <div className="flex h-20 items-end rounded-lg bg-muted/40 p-2">
                  <div
                    className="w-full rounded-lg bg-sky-500"
                    style={{
                      height: `${Math.max(
                        10,
                        (item.serviceOrders / maximumOrders) * 100,
                      )}%`,
                    }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {item.month}
                  </span>

                  <strong className="text-sm text-foreground">
                    {item.serviceOrders}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
