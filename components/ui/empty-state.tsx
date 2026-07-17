import * as React from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = React.HTMLAttributes<HTMLDivElement> & {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  size?: "compact" | "default";
  tone?: "neutral" | "info" | "warning" | "danger";
};

const toneStyles = {
  neutral: "bg-surface-subtle",
  info: "bg-sky-50/50 dark:bg-sky-500/5",
  warning: "bg-amber-50/50 dark:bg-amber-500/5",
  danger: "bg-rose-50/50 dark:bg-rose-500/5",
};

export function EmptyState({ icon, title, description, action, secondaryAction, size = "default", tone = "neutral", className, ...props }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-border px-6 text-center", toneStyles[tone], size === "compact" ? "min-h-40 py-7" : "min-h-56 py-10", className)} {...props}>
      {icon ? <div className={cn("rounded-xl border border-border bg-card text-muted-foreground shadow-xs", size === "compact" ? "mb-3 p-2.5" : "mb-4 p-3")}>{icon}</div> : null}
      <h3 className="font-semibold text-foreground">{title}</h3>
      {description ? <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p> : null}
      {action || secondaryAction ? <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{action}{secondaryAction}</div> : null}
    </div>
  );
}
