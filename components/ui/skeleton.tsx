import * as React from "react";

import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}

export function MetricStripSkeleton({ items = 4, className }: { items?: number; className?: string }) {
  return (
    <div
      role="status"
      aria-label="Carregando indicadores"
      className={cn("grid overflow-hidden rounded-[var(--radius-card)] border bg-card sm:grid-cols-2 xl:grid-cols-4", className)}
    >
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="space-y-3 border-b p-4 last:border-b-0 sm:border-r xl:border-b-0">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
      <span className="sr-only">Carregando indicadores...</span>
    </div>
  );
}

export function TableSkeleton({ rows = 6, columns = 5, className }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div role="status" aria-label="Carregando tabela" className={cn("overflow-hidden rounded-[var(--radius-card)] border bg-card", className)}>
      <div className="grid min-w-[42rem] gap-4 border-b bg-muted/40 px-4 py-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, index) => <Skeleton key={index} className="h-3 w-3/4" />)}
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="grid min-w-[42rem] gap-4 px-4 py-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {Array.from({ length: columns }).map((_, column) => <Skeleton key={column} className={cn("h-4", column === 0 ? "w-4/5" : "w-2/3")} />)}
          </div>
        ))}
      </div>
      <span className="sr-only">Carregando dados...</span>
    </div>
  );
}

export function CardGridSkeleton({ items = 6, className }: { items?: number; className?: string }) {
  return (
    <div role="status" aria-label="Carregando cartões" className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-3", className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="space-y-4 rounded-[var(--radius-card)] border bg-card p-4">
          <div className="flex items-center justify-between gap-4"><Skeleton className="h-5 w-1/2" /><Skeleton className="size-8 rounded-lg" /></div>
          <Skeleton className="h-4 w-4/5" /><Skeleton className="h-4 w-3/5" /><Skeleton className="h-9 w-full" />
        </div>
      ))}
      <span className="sr-only">Carregando conteúdo...</span>
    </div>
  );
}

export function PageSkeleton({ metrics = 4, rows = 6, columns = 5, className }: { metrics?: number; rows?: number; columns?: number; className?: string }) {
  return (
    <div role="status" aria-label="Carregando página" className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2"><Skeleton className="h-7 w-52" /><Skeleton className="h-4 w-72 max-w-full" /></div>
        <Skeleton className="h-10 w-36" />
      </div>
      <MetricStripSkeleton items={metrics} />
      <Skeleton className="h-14 w-full rounded-[var(--radius-card)]" />
      <TableSkeleton rows={rows} columns={columns} />
      <span className="sr-only">Carregando página...</span>
    </div>
  );
}
