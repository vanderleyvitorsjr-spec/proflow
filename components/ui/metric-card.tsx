import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = React.HTMLAttributes<HTMLDivElement> & {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  detail?: React.ReactNode;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
};

const toneClasses = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  danger: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
};

export function MetricCard({
  label,
  value,
  icon,
  detail,
  tone = "neutral",
  className,
  ...props
}: MetricCardProps) {
  return (
    <Card className={cn("h-full", className)} {...props}>
      <CardContent className="flex h-full flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {icon && <span className={cn("rounded-lg p-2", toneClasses[tone])}>{icon}</span>}
        </div>
        <div className="proflow-metric mt-3 text-2xl font-semibold text-foreground">{value}</div>
        {detail && <div className="mt-2 text-xs text-muted-foreground">{detail}</div>}
      </CardContent>
    </Card>
  );
}
