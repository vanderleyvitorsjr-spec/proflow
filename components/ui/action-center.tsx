"use client";

import Link from "next/link";
import { CheckCircle2, ListChecks, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { Select } from "@/components/ui/select";
import {
  transformInsightsToActions,
  type ActionCenterTask,
} from "@/lib/action-center";
import type {
  OperationalInsight,
  OperationalInsightModule,
  OperationalInsightPriority,
} from "@/lib/operational-insights";

const priorityLabels: Record<OperationalInsightPriority, string> = {
  CRITICAL: "Crítico",
  WARNING: "Atenção",
  INFO: "Informativo",
};

const priorityVariants: Record<
  OperationalInsightPriority,
  "destructive" | "warning" | "info"
> = {
  CRITICAL: "destructive",
  WARNING: "warning",
  INFO: "info",
};

const moduleLabels: Record<OperationalInsightModule, string> = {
  CLIENTS: "Clientes",
  CRM: "CRM",
  AGENDA: "Agenda",
  ORDERS: "Ordens",
  STOCK: "Estoque",
  EQUIPMENT: "Equipamentos",
  FINANCE: "Financeiro",
};

export function ActionCenter({ insights }: { insights: OperationalInsight[] }) {
  const tasks = useMemo(() => transformInsightsToActions(insights), [insights]);
  const [priority, setPriority] = useState("ALL");
  const [module, setModule] = useState("ALL");
  const [type, setType] = useState("ALL");

  const types = useMemo(
    () =>
      [...new Map(tasks.map((task) => [task.type, task.typeLabel])).entries()].sort(
        (a, b) => a[1].localeCompare(b[1], "pt-BR"),
      ),
    [tasks],
  );

  const filtered = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (priority === "ALL" || task.priority === priority) &&
          (module === "ALL" || task.module === module) &&
          (type === "ALL" || task.type === type),
      ),
    [module, priority, tasks, type],
  );

  const reset = () => {
    setPriority("ALL");
    setModule("ALL");
    setType("ALL");
  };

  return (
    <Card>
      <CardHeader className="border-b px-4 py-3">
        <SectionHeader
          compact
          title="Ações recomendadas"
          description="Transforme as situações identificadas em próximos passos práticos."
          actions={<Badge variant="secondary">{filtered.length} ação(ões)</Badge>}
        />
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[12rem_14rem_minmax(14rem,1fr)_auto]">
          <Filter label="Prioridade">
            <Select value={priority} onChange={(event) => setPriority(event.target.value)}>
              <option value="ALL">Todas as prioridades</option>
              <option value="CRITICAL">Crítico</option>
              <option value="WARNING">Atenção</option>
              <option value="INFO">Informativo</option>
            </Select>
          </Filter>
          <Filter label="Módulo">
            <Select value={module} onChange={(event) => setModule(event.target.value)}>
              <option value="ALL">Todos os módulos</option>
              {Object.entries(moduleLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </Filter>
          <Filter label="Tipo">
            <Select value={type} onChange={(event) => setType(event.target.value)}>
              <option value="ALL">Todos os tipos</option>
              {types.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </Filter>
          <Button
            type="button"
            variant="secondary"
            className="self-end"
            onClick={reset}
            disabled={priority === "ALL" && module === "ALL" && type === "ALL"}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Limpar filtros
          </Button>
        </div>

        {filtered.length ? (
          <div className="divide-y rounded-xl border">
            {filtered.map((task) => <ActionRow key={task.id} task={task} />)}
          </div>
        ) : (
          <EmptyState
            size="compact"
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="Nenhuma ação encontrada"
            description="Altere ou limpe os filtros para visualizar outras recomendações."
          />
        )}
      </CardContent>
    </Card>
  );
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1 text-xs font-medium text-muted-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}

function ActionRow({ task }: { task: ActionCenterTask }) {
  return (
    <article className="grid gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <ListChecks className="h-4 w-4 text-primary" aria-hidden="true" />
          <h3 className="text-sm font-semibold">{task.title}</h3>
          <Badge variant={priorityVariants[task.priority]}>
            {priorityLabels[task.priority]}
          </Badge>
          <Badge variant="outline">{moduleLabels[task.module]}</Badge>
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {task.description}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 lg:justify-end">
        {task.secondaryAction ? (
          <Button asChild size="sm" variant="secondary">
            <Link href={task.secondaryAction.href}>{task.secondaryAction.label}</Link>
          </Button>
        ) : null}
        <Button asChild size="sm">
          <Link href={task.primaryAction.href}>{task.primaryAction.label}</Link>
        </Button>
      </div>
    </article>
  );
}
