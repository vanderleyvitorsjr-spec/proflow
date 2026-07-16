import type { HTMLAttributes, ReactNode } from "react";

import { Toolbar } from "@/components/ui/toolbar";
import { cn } from "@/lib/utils";

export function PageHeader({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn("overflow-hidden rounded-xl border bg-card shadow-xs", className)} {...props} />;
}

export function PageHeaderContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between",
        className,
      )}
      {...props}
    />
  );
}

export function PageHeaderIdentity({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex min-w-0 items-center gap-3", className)} {...props} />;
}

export function PageHeaderIcon({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/10 text-primary",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type PageHeaderHeadingProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  title: ReactNode;
  description?: ReactNode;
};

export function PageHeaderHeading({ title, description, className, ...props }: PageHeaderHeadingProps) {
  return (
    <div className={cn("min-w-0", className)} {...props}>
      <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">{title}</h1>
      {description ? <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p> : null}
    </div>
  );
}

export function PageHeaderActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex shrink-0 flex-wrap items-center gap-2", className)} {...props} />;
}

export function PageHeaderToolbar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <Toolbar
      className={cn("rounded-none border-x-0 border-b-0 px-4 py-2.5 shadow-none sm:px-5", className)}
      {...props}
    />
  );
}
