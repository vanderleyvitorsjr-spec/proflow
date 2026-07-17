import type { ReactNode } from "react";
import { CircleAlert, Lightbulb } from "lucide-react";

import { cn } from "@/lib/utils";

export function RequiredFieldsNotice({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border border-border/80 bg-muted/35 px-3 py-2.5 text-xs text-muted-foreground",
        className,
      )}
    >
      <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <p>
        Os campos marcados com <span className="font-semibold text-destructive">*</span> são
        obrigatórios. As orientações abaixo dos campos explicam o que deve ser informado.
      </p>
    </div>
  );
}

export function FormSectionIntro({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
    </div>
  );
}

export function FormTip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2.5 text-xs text-muted-foreground",
        className,
      )}
    >
      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
