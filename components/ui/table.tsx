import * as React from "react";
import { MoveHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

type TableDensity = "compact" | "standard" | "wide";

const densityStyles: Record<TableDensity, string> = {
  compact: "[&_th]:h-9 [&_th]:px-3 [&_td]:px-3 [&_td]:py-2",
  standard: "[&_th]:h-10 [&_th]:px-4 [&_td]:px-4 [&_td]:py-3",
  wide: "[&_th]:h-11 [&_th]:px-5 [&_td]:px-5 [&_td]:py-4",
};

type TableFrameProps = React.HTMLAttributes<HTMLDivElement> & {
  scrollHint?: boolean;
};

export function TableFrame({ className, scrollHint = false, children, ...props }: TableFrameProps) {
  return (
    <div
      className={cn(
        "proflow-scrollbar relative w-full overflow-x-auto rounded-[var(--radius-card)] border border-border",
        className,
      )}
      {...props}
    >
      {scrollHint ? (
        <div className="sticky left-0 flex items-center justify-end gap-1 border-b px-3 py-1 text-[10px] text-muted-foreground sm:hidden">
          <MoveHorizontal className="size-3" aria-hidden="true" />
          Deslize para ver mais
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function Table({
  className,
  density = "standard",
  scrollHint = false,
  framed = true,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement> & {
  density?: TableDensity;
  scrollHint?: boolean;
  framed?: boolean;
}) {
  const table = <table className={cn("w-full border-collapse text-sm", densityStyles[density], className)} {...props} />;

  return framed ? <TableFrame scrollHint={scrollHint}>{table}</TableFrame> : table;
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("bg-surface-subtle", className)} {...props} />;
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-border bg-card", className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("transition-colors hover:bg-muted/55", className)} {...props} />;
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn("text-left align-middle text-xs font-semibold text-muted-foreground", className)}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("align-middle text-foreground", className)} {...props} />;
}
