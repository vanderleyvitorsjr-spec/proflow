import Link from "next/link";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import type {
  OperationalInsight,
  OperationalInsightPriority,
} from "@/lib/operational-insights";

const groups: Array<{
  priority: OperationalInsightPriority;
  label: string;
  icon: typeof AlertCircle;
  style: string;
}> = [
  { priority: "CRITICAL", label: "Crítico", icon: AlertCircle, style: "text-rose-600 dark:text-rose-300" },
  { priority: "WARNING", label: "Atenção", icon: AlertTriangle, style: "text-amber-600 dark:text-amber-300" },
  { priority: "INFO", label: "Informativo", icon: Info, style: "text-sky-600 dark:text-sky-300" },
];

const moduleLabels: Record<OperationalInsight["module"], string> = {
  CLIENTS: "Clientes",
  CRM: "CRM",
  AGENDA: "Agenda",
  ORDERS: "Ordens",
  STOCK: "Estoque",
  EQUIPMENT: "Equipamentos",
  FINANCE: "Financeiro",
};

export function OperationalInsights({
  insights,
}: {
  insights: OperationalInsight[];
}) {
  return (
    <Card>
      <CardHeader className="border-b px-4 py-3">
        <SectionHeader
          compact
          title="O que precisa da sua atenção"
          description="Análises automáticas feitas com os dados operacionais já disponíveis."
        />
      </CardHeader>
      <CardContent className="grid gap-4 p-4 xl:grid-cols-3">
        {insights.length ? (
          groups.map((group) => {
            const items = insights.filter((insight) => insight.priority === group.priority);
            const Icon = group.icon;
            return (
              <section key={group.priority} aria-labelledby={`insights-${group.priority}`}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 id={`insights-${group.priority}`} className={`flex items-center gap-2 text-sm font-semibold ${group.style}`}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {group.label}
                  </h3>
                  <Badge variant="outline">{items.length}</Badge>
                </div>
                <div className="space-y-2">
                  {items.length ? (
                    items.map((insight) => (
                      <article key={insight.id} className="rounded-lg border bg-card p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold">{insight.title}</p>
                          <Badge variant="secondary">{moduleLabels[insight.module]}</Badge>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {insight.description}
                        </p>
                        <Button asChild size="sm" variant="ghost" className="mt-2 h-7 px-0 text-xs text-primary hover:bg-transparent">
                          <Link href={insight.action.href}>{insight.action.label}</Link>
                        </Button>
                      </article>
                    ))
                  ) : (
                    <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                      Nenhum insight neste grupo.
                    </p>
                  )}
                </div>
              </section>
            );
          })
        ) : (
          <div className="xl:col-span-3">
            <EmptyState
              size="compact"
              title="Nenhuma situação exige atenção"
              description="Os dados disponíveis não indicam pendências neste momento."
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
