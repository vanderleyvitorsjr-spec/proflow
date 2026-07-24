import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/utils";

export type QuickAction = {
  label: string;
  description?: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
};

export function QuickActions({
  title = "Próximos passos",
  description = "Continue o atendimento sem perder o contexto deste registro.",
  actions,
  className,
}: {
  title?: string;
  description?: string;
  actions: QuickAction[];
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="border-b px-4 py-3">
        <SectionHeader compact title={title} description={description} />
      </CardHeader>
      <CardContent className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => {
          const content = (
            <>
              {action.icon ? (
                <span className="mt-0.5 text-primary" aria-hidden="true">
                  {action.icon}
                </span>
              ) : null}
              <span className="min-w-0 text-left">
                <span className="block text-sm font-semibold">{action.label}</span>
                {action.description ? (
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    {action.description}
                  </span>
                ) : null}
              </span>
            </>
          );

          if (action.href && !action.disabled) {
            return (
              <Button
                key={action.label}
                asChild
                variant="secondary"
                className="h-auto min-h-12 justify-start gap-2 whitespace-normal px-3 py-2"
              >
                <Link href={action.href}>{content}</Link>
              </Button>
            );
          }

          return (
            <Button
              key={action.label}
              type="button"
              variant="secondary"
              disabled={action.disabled}
              onClick={action.onClick}
              className="h-auto min-h-12 justify-start gap-2 whitespace-normal px-3 py-2"
            >
              {content}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
