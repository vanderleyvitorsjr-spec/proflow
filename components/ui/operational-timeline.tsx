"use client";

import Link from "next/link";
import { Clock3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { loadGlobalActivities } from "@/lib/integrations/global-activity-gateway";
import { ptBrLabel } from "@/lib/pt-br-labels";
import type { GlobalActivity } from "@/lib/contracts/global-activity.contract";

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function OperationalTimeline({
  clientId,
  serviceOrderId,
  sourceId,
  limit = 12,
}: {
  clientId?: string;
  serviceOrderId?: string;
  sourceId?: string;
  limit?: number;
}) {
  const [activities, setActivities] = useState<GlobalActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [partial, setPartial] = useState(false);

  useEffect(() => {
    let active = true;
    void loadGlobalActivities()
      .then((result) => {
        if (!active) return;
        setActivities(result.items);
        setPartial(result.partial);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      activities
        .filter(
          (item) =>
            (clientId && item.clientId === clientId) ||
            (serviceOrderId && item.serviceOrderId === serviceOrderId) ||
            (sourceId && item.sourceId === sourceId),
        )
        .slice(0, limit),
    [activities, clientId, limit, serviceOrderId, sourceId],
  );

  return (
    <Card>
      <CardHeader className="border-b px-4 py-3">
        <SectionHeader
          compact
          title="Linha do tempo operacional"
          description="Cliente, CRM, Agenda, Ordens, Estoque, Financeiro, documentos e garantias em ordem cronológica."
        />
      </CardHeader>
      <CardContent className="p-4">
        {loading ? (
          <div className="space-y-3" aria-label="Carregando linha do tempo">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-12 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : filtered.length ? (
          <ol className="space-y-0">
            {filtered.map((item, index) => (
              <li key={item.id} className="relative grid grid-cols-[1.25rem_1fr] gap-3 pb-4 last:pb-0">
                {index < filtered.length - 1 ? (
                  <span className="absolute left-[0.6rem] top-5 h-full w-px bg-border" />
                ) : null}
                <span className="relative mt-1 flex h-5 w-5 items-center justify-center rounded-full border bg-card text-primary">
                  <Clock3 className="h-3 w-3" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{item.sourceLabel}</Badge>
                    <time className="text-xs text-muted-foreground">
                      {dateTime.format(new Date(item.occurredAt))}
                    </time>
                  </div>
                  <p className="mt-1 text-sm font-semibold">{ptBrLabel(item.title)}</p>
                  {item.description ? (
                    <p className="text-xs text-muted-foreground">{ptBrLabel(item.description)}</p>
                  ) : null}
                  {item.link ? (
                    <Button asChild variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary hover:bg-transparent">
                      <Link href={item.link}>Abrir registro</Link>
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState
            size="compact"
            title="Nenhuma atividade vinculada"
            description="As próximas etapas deste atendimento aparecerão aqui automaticamente."
          />
        )}
        {partial ? (
          <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
            Parte do histórico não pôde ser carregada. Os registros disponíveis continuam visíveis.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
