import * as React from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = React.HTMLAttributes<HTMLDivElement> & {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  size?: "compact" | "default";
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  size = "default",
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-border bg-surface-subtle px-6 text-center",
        size === "compact" ? "min-h-40 py-7" : "min-h-56 py-10",
        className,
      )}
      {...props}
    >
      {icon && (
        <div
          className={cn(
            "rounded-xl border border-border bg-card text-muted-foreground shadow-xs",
            size === "compact" ? "mb-3 p-2.5" : "mb-4 p-3",
          )}
        >
          {icon}
        </div>
      )}
      <h3 className="font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
