import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-blue-600 bg-blue-600 text-white shadow-xs hover:border-blue-700 hover:bg-blue-700 hover:shadow-sm dark:border-sky-500 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400",
        secondary:
          "border border-border bg-card text-foreground shadow-xs hover:border-slate-300 hover:bg-muted dark:hover:border-slate-600",
        ghost:
          "border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
        destructive:
          "border border-rose-600 bg-rose-600 text-white shadow-xs hover:bg-rose-700 dark:border-rose-500 dark:bg-rose-500 dark:text-white",
        outline:
          "border border-border bg-transparent text-foreground hover:border-slate-300 hover:bg-muted dark:hover:border-slate-600",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-5",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { buttonVariants };
