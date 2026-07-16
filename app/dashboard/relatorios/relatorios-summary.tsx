import { ArrowDownRight, ArrowUpRight, Minus, CircleHelp } from "lucide-react";
import { MetricItem, MetricStrip } from "@/components/ui/metric-strip";
import type { ReportMetric } from "./relatorios-types";
export function RelatoriosSummary({
  metrics,
  comparisonEnabled,
}: {
  metrics: ReportMetric[];
  comparisonEnabled: boolean;
}) {
  return (
    <MetricStrip className="auto-cols-[minmax(13rem,1fr)]">
      {metrics.map((item) => {
        const favorable = item.inverse ? item.trend === "DOWN" : item.trend === "UP";
        const Icon =
          item.trend === "UP"
            ? ArrowUpRight
            : item.trend === "DOWN"
              ? ArrowDownRight
              : item.trend === "STABLE"
                ? Minus
                : CircleHelp;
        const trend = comparisonEnabled ? (
          <span
            title={item.description}
            className={
              favorable
                ? "text-emerald-600"
                : item.trend === "UP" || item.trend === "DOWN"
                  ? "text-rose-600"
                  : "text-muted-foreground"
            }
          >
            <Icon className="inline h-3 w-3" />{" "}
            {item.percentageChange === undefined
              ? item.trend === "NOT_COMPARABLE"
                ? "Sem base"
                : "—"
              : `${Math.abs(item.percentageChange).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}
          </span>
        ) : undefined;
        return (
          <MetricItem
            key={item.id}
            label={item.title}
            value={item.formattedValue}
            description={
              item.status === "PARTIAL" ? "Dados parciais" : item.source.join(" + ")
            }
            trend={trend}
            tone={
              item.status === "UNAVAILABLE" ? "warning" : favorable ? "success" : "info"
            }
          />
        );
      })}
    </MetricStrip>
  );
}
