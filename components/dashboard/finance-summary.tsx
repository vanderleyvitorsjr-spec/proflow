import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CircleDollarSign,
  Clock3,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const financialIndicators = [
  {
    label: "Receita recebida",
    value: "R$ 38.740,00",
    comparison: "+12,50% no período",
    icon: Banknote,
    tone: "success",
  },
  {
    label: "Despesas",
    value: "R$ 14.280,00",
    comparison: "-3,20% no período",
    icon: ArrowDownRight,
    tone: "danger",
  },
  {
    label: "Contas a receber",
    value: "R$ 8.650,00",
    comparison: "7 lançamentos pendentes",
    icon: Clock3,
    tone: "warning",
  },
  {
    label: "Ticket médio",
    value: "R$ 1.384,00",
    comparison: "+8,40% no período",
    icon: WalletCards,
    tone: "info",
  },
] as const;

const toneClasses = {
  success: {
    icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    comparison: "text-emerald-600 dark:text-emerald-400",
  },
  danger: {
    icon: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
    comparison: "text-rose-600 dark:text-rose-400",
  },
  warning: {
    icon: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    comparison: "text-amber-600 dark:text-amber-400",
  },
  info: {
    icon: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
    comparison: "text-sky-600 dark:text-sky-400",
  },
};

export function FinanceSummary() {
  return (
    <section aria-label="Indicadores financeiros">
      <div className="grid overflow-hidden rounded-[var(--radius-card)] border border-border bg-card shadow-xs sm:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-border">
        <Card className="overflow-hidden rounded-none border-0 bg-gradient-to-br from-sky-500 to-blue-700 text-white shadow-none">
          <CardContent className="relative flex h-20 items-center justify-between gap-3 p-3">
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10"
              aria-hidden="true"
            />

            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-sky-100">
                  Lucro líquido estimado
                </p>
                <p className="proflow-metric mt-0.5 text-lg font-bold">
                  R$ 24.460,00
                </p>
              </div>

              <div className="rounded-lg bg-white/15 p-2">
                <CircleDollarSign className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>

            <div className="relative text-right">
              <div className="flex items-center justify-end gap-1 text-xs font-semibold text-white">
                <TrendingUp className="h-4 w-4" aria-hidden="true" />
                18,70%
              </div>

              <p className="mt-1 text-[0.65rem] text-sky-100">Margem líquida</p>
            </div>
          </CardContent>
        </Card>

        {financialIndicators.slice(1).map((indicator) => {
          const Icon = indicator.icon;
          const colors = toneClasses[indicator.tone];

          return (
            <Card
              key={indicator.label}
              className="rounded-none border-0 border-b border-border bg-card shadow-none transition-colors hover:bg-muted/25 sm:odd:border-r xl:border-b-0 xl:border-r-0"
            >
              <CardContent className="flex h-20 items-center gap-3 p-3">
                <div className={`rounded-lg p-2 ${colors.icon}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">{indicator.label}</p>
                  <p className="proflow-metric mt-0.5 truncate text-base font-bold text-foreground">{indicator.value}</p>
                  <p className={`mt-1 truncate text-[0.68rem] font-medium ${colors.comparison}`}>{indicator.comparison}</p>
                </div>
                <div className="self-start">
                  {indicator.tone !== "danger" && (
                    <ArrowUpRight
                      className="h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                </div>

              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export default FinanceSummary;
