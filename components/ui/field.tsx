import * as React from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FieldProps = React.HTMLAttributes<HTMLDivElement> & {
  label?: string;
  htmlFor?: string;
  description?: string;
  error?: string;
  required?: boolean;
};

export function Field({
  label,
  htmlFor,
  description,
  error,
  required,
  children,
  className,
  ...props
}: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)} {...props}>
      {label && (
        <Label htmlFor={htmlFor}>
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </Label>
      )}
      {children}
      {(error || description) && (
        <p className={cn("text-xs text-muted-foreground", error && "text-destructive")}>
          {error ?? description}
        </p>
      )}
    </div>
  );
}
