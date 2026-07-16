import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const surfaceVariants = cva("border border-border", {
  variants: {
    level: {
      subtle: "rounded-[var(--radius-card)] bg-surface-subtle",
      base: "rounded-[var(--radius-card)] bg-card shadow-xs",
      raised: "rounded-[var(--radius-panel)] bg-surface-raised shadow-md",
    },
  },
  defaultVariants: { level: "base" },
});

export interface SurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {}

export function Surface({ level, className, ...props }: SurfaceProps) {
  return <div className={cn(surfaceVariants({ level }), className)} {...props} />;
}
