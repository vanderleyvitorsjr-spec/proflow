import * as React from "react";

import { cn } from "@/lib/utils";

export function Toolbar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="toolbar"
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-card p-3 shadow-xs lg:flex-row lg:items-center",
        className,
      )}
      {...props}
    />
  );
}

export function ToolbarGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex w-full min-w-0 flex-wrap items-center gap-2 lg:w-auto", className)} {...props} />;
}
