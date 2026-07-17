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
  maxHeight?: string;
};

export function TableFrame({ className, scrollHint = false, maxHeight, children, style, ...props }: TableFrameProps) {
  return (
    <div
      className={cn(
        "proflow-scrollbar relative w-full overflow-auto rounded-[var(--radius-card)] border border-border bg-card",
        className,
      )}
      style={{ ...style, maxHeight }}
      {...props}
    >
      {scrollHint ? (
        <div className="sticky left-0 top-0 z-30 flex items-center justify-end gap-1 border-b bg-card/95 px-3 py-1 text-[10px] text-muted-foreground backdrop-blur sm:hidden">
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
  stickyHeader = false,
  striped = false,
  maxHeight,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement> & {
  density?: TableDensity;
  scrollHint?: boolean;
  framed?: boolean;
  stickyHeader?: boolean;
  striped?: boolean;
  maxHeight?: string;
}) {
  const table = (
    <table
      className={cn(
        "w-full border-collapse text-sm [&_[data-align='right']]:text-right [&_[data-align='right']]:tabular-nums [&_[data-align='center']]:text-center",
        densityStyles[density],
        stickyHeader && "[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-20 [&_thead]:bg-card/95 [&_thead]:backdrop-blur",
        striped && "[&_tbody_tr:nth-child(even)]:bg-muted/25",
        className,
      )}
      {...props}
    />
  );

  return framed ? <TableFrame scrollHint={scrollHint} maxHeight={maxHeight}>{table}</TableFrame> : table;
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("border-b bg-surface-subtle", className)} {...props} />;
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-border bg-card", className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("transition-colors hover:bg-muted/55 data-[selected=true]:bg-primary/5", className)} {...props} />;
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("whitespace-nowrap text-left align-middle text-xs font-semibold text-muted-foreground", className)} {...props} />;
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("align-middle text-foreground", className)} {...props} />;
}

export function TableNumericCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <TableCell data-align="right" className={cn("font-medium tabular-nums", className)} {...props} />;
}

export function TableActionsCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <TableCell data-align="right" className={cn("w-px whitespace-nowrap", className)} {...props} />;
}
