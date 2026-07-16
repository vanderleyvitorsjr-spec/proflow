import * as React from "react";

import { cn } from "@/lib/utils";

type SectionHeaderProps = React.HTMLAttributes<HTMLDivElement> & {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  compact?: boolean;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  compact = false,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-end sm:justify-between",
        compact ? "gap-2" : "gap-3",
        className,
      )}
      {...props}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-600 dark:text-sky-400">
            {eyebrow}
          </p>
        )}
        <h2
          className={cn(
            "font-semibold tracking-tight text-foreground",
            compact ? "text-base" : eyebrow ? "mt-1 text-xl" : "text-lg",
          )}
        >
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
