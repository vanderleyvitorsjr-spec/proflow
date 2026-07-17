import * as React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = React.HTMLAttributes<HTMLDivElement> & {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  detail?: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
};

const toneClasses = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  danger: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
};

export function MetricCard({ label, value, icon, detail, trend, trendLabel, tone = "neutral", className, ...props }: MetricCardProps) {
  const TrendIcon = trend === undefined || trend === 0 ? Minus : trend > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <Card className={cn("h-full min-h-32", className)} {...props}>
      <CardContent className="flex h-full flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {icon ? <span className={cn("rounded-lg p-2", toneClasses[tone])}>{icon}</span> : null}
        </div>
        <div className="proflow-metric mt-3 text-2xl font-semibold tabular-nums text-foreground">{value}</div>
        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-2 text-xs text-muted-foreground">
          {trend !== undefined ? <span className={cn("inline-flex items-center gap-0.5 font-medium tabular-nums", trend > 0 && "text-emerald-600 dark:text-emerald-400", trend < 0 && "text-rose-600 dark:text-rose-400")}><TrendIcon className="size-3.5" aria-hidden="true" />{Math.abs(trend).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%</span> : null}
          {trendLabel ? <span>{trendLabel}</span> : detail}
        </div>
      </CardContent>
    </Card>
  );
}
