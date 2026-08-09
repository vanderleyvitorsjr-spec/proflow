import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function MetricStrip({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <div
        className={cn("grid min-w-0 grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4", className)}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

type MetricTone = "neutral" | "info" | "success" | "warning" | "danger" | "violet";

const toneStyles: Record<MetricTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  danger: "bg-red-500/10 text-red-600 dark:text-red-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

type MetricItemProps = HTMLAttributes<HTMLDivElement> & {
  label: ReactNode;
  value: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  trend?: ReactNode;
  tone?: MetricTone;
};

export function MetricItem({
  label,
  value,
  description,
  icon,
  trend,
  tone = "neutral",
  className,
  ...props
}: MetricItemProps) {
  return (
    <div className={cn("flex min-h-20 items-start gap-3 p-3.5", className)} {...props}>
      {icon ? (
        <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", toneStyles[tone])}>
          {icon}
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-medium leading-4 text-muted-foreground">{label}</p>
          {trend ? <div className="shrink-0 text-[10px] font-medium">{trend}</div> : null}
        </div>
        <p className="mt-1 break-words text-lg font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
        {description ? <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">{description}</p> : null}
      </div>
    </div>
  );
}
