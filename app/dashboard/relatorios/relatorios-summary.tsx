import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CircleDollarSign,
  Clock3,
  PackageCheck,
  Percent,
  ReceiptText,
  Target,
  Wrench,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { ReportMetric } from "./relatorios-data";

type RelatoriosSummaryProps = {
  metrics: ReportMetric[];
  comparisonEnabled: boolean;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
});

const percentageFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const metricIcons = {
  "metric-revenue": CircleDollarSign,
  "metric-expenses": ReceiptText,
  "metric-profit": BarChart3,
  "metric-margin": Percent,
  "metric-leads": Target,
  "metric-conversion": Percent,
  "metric-ticket": CircleDollarSign,
  "metric-orders": Wrench,
  "metric-time": Clock3,
  "metric-rework": ArrowDownRight,
  "metric-stock": PackageCheck,
  "metric-turnover": BarChart3,
};

const areaStyles: Record<
  ReportMetric["area"],
  string
> = {
  FINANCIAL:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  COMMERCIAL:
    "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
  OPERATIONAL:
    "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  STOCK:
    "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
};

function formatValue(metric: ReportMetric) {
  if (metric.format === "currency") {
    return currencyFormatter.format(metric.value);
  }

  if (metric.format === "percentage") {
    return `${percentageFormatter.format(metric.value)}%`;
  }

  if (metric.format === "hours") {
    return `${numberFormatter.format(metric.value)} h`;
  }

  return numberFormatter.format(metric.value);
}

function calculateVariation(metric: ReportMetric) {
  if (metric.previousValue === 0) {
    return 0;
  }

  return (
    ((metric.value - metric.previousValue) /
      Math.abs(metric.previousValue)) *
    100
  );
}

function isPositiveVariation(metric: ReportMetric, variation: number) {
  const inverseMetrics = [
    "metric-expenses",
    "metric-time",
    "metric-rework",
  ];

  return inverseMetrics.includes(metric.id)
    ? variation <= 0
    : variation >= 0;
}

export function RelatoriosSummary({
  metrics,
  comparisonEnabled,
}: RelatoriosSummaryProps) {
  return (
    <section className="grid overflow-hidden rounded-[var(--radius-card)] border border-border bg-card shadow-xs sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 [&>*]:border-b [&>*]:border-r [&>*]:border-border">
      {metrics.map((metric) => {
        const Icon =
          metricIcons[metric.id as keyof typeof metricIcons] ??
          BarChart3;

        const variation = calculateVariation(metric);
        const positive = isPositiveVariation(metric, variation);
        const VariationIcon = positive
          ? ArrowUpRight
          : ArrowDownRight;

        return (
          <Card
            key={metric.id}
            className="rounded-none border-0 bg-card shadow-none"
          >
            <CardContent className="flex min-h-20 items-center gap-3 p-3">
              <div className="flex shrink-0 items-center gap-2">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    areaStyles[metric.area],
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>

                {comparisonEnabled && (
                  <span
                    className={cn(
                      "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold",
                      positive
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
                    )}
                  >
                    <VariationIcon
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />

                    {percentageFormatter.format(Math.abs(variation))}%
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-muted-foreground">
                  {metric.label}
                </p>

                <p className="mt-0.5 truncate text-base font-bold tracking-tight text-foreground">
                  {formatValue(metric)}
                </p>

                <p className="mt-0.5 truncate text-[0.65rem] text-muted-foreground">
                  {comparisonEnabled
                    ? "Comparado ao período anterior"
                    : "Resultado do período selecionado"}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
