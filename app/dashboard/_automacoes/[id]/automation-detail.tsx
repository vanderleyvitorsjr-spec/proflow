"use client";

import Link from "next/link";
import { ArrowLeft, Copy, Pause, Play, Sparkles, Trash2, Workflow } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  changeAutomationWorkflowStatusAction,
  duplicateAutomationWorkflowAction,
  deleteAutomationWorkflowAction,
  getAutomationWorkflowAction,
  listAutomationHistoryAction,
} from "@/automation/admin/automation-admin-actions";
import {
  automationHistoryStatusLabels,
  workflowModeLabels,
  workflowStatusLabels,
} from "@/automation/admin/automation-admin-labels";
import type {
  AutomationHistoryEntry,
  PersistedAutomationWorkflow,
} from "@/automation/admin/automation-admin-types";
import { automationRegistry } from "@/automation/registry/automation-registry";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricItem, MetricStrip } from "@/components/ui/metric-strip";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderHeading,
  PageHeaderIdentity,
} from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { formatDateTimeBR } from "@/lib/br-formatters";
import { AutomationFormDrawer } from "../automation-form-drawer";
import { AutomationSimulationDialog } from "../automation-simulation-dialog";

export function AutomationDetail({ id }: { id: string }) {
  const router = useRouter();
  const [workflow, setWorkflow] = useState<PersistedAutomationWorkflow | null>(null);
  const [history, setHistory] = useState<AutomationHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextWorkflow, nextHistory] = await Promise.all([
        getAutomationWorkflowAction(id),
        listAutomationHistoryAction({ workflowId: id }),
      ]);
      setWorkflow(nextWorkflow);
      setHistory(nextHistory);
      setError(nextWorkflow ? "" : "Automação não encontrada.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar a automação.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  if (loading) return <div className="h-72 animate-pulse rounded-xl bg-muted" />;
  if (!workflow)
    return <EmptyState icon={<Workflow className="h-6 w-6" />} title="Automação não encontrada" description={error || "O identificador informado não corresponde a uma automação disponível."} action={<Button asChild variant="secondary"><Link href="/dashboard/automacoes">Voltar para Automações</Link></Button>} />;

  const trigger = automationRegistry.getTrigger(workflow.trigger.type);
  return (
    <div className="space-y-4">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderIdentity>
            <Workflow className="h-5 w-5" />
            <PageHeaderHeading title={workflow.name} description={workflow.description} />
          </PageHeaderIdentity>
          <PageHeaderActions>
            <Button asChild size="sm" variant="secondary"><Link href="/dashboard/automacoes"><ArrowLeft className="h-4 w-4" />Voltar</Link></Button>
            <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>Editar</Button>
            {!workflow.isSystem ? <Button size="sm" variant="secondary" onClick={() => void duplicateAutomationWorkflowAction(workflow.id)}><Copy className="h-4 w-4" />Duplicar</Button> : null}
            <Button size="sm" variant="secondary" onClick={() => setSimulating(true)}><Sparkles className="h-4 w-4" />Simular</Button>
            <Button size="sm" onClick={async () => { await changeAutomationWorkflowStatusAction(workflow.id, workflow.status === "ACTIVE" ? "PAUSED" : "ACTIVE"); await load(); }}>{workflow.status === "ACTIVE" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{workflow.status === "ACTIVE" ? "Pausar" : "Ativar"}</Button>
            {!workflow.isSystem ? <Button size="sm" variant="destructive" onClick={async () => { if (!window.confirm(`Excluir “${workflow.name}”?`)) return; await deleteAutomationWorkflowAction(workflow.id); router.push("/dashboard/automacoes"); }}><Trash2 className="h-4 w-4" />Excluir</Button> : null}
          </PageHeaderActions>
        </PageHeaderContent>
      </PageHeader>

      <MetricStrip>
        <MetricItem label="Status" value={workflowStatusLabels[workflow.status]} />
        <MetricItem label="Modo" value={workflowModeLabels[workflow.mode]} />
        <MetricItem label="Execuções reais" value={String(history.filter((item) => item.status === "SUCCESS").length)} />
        <MetricItem label="Simulações" value={String(history.filter((item) => item.status === "SIMULATED").length)} />
        <MetricItem label="Ocorrências" value={String(history.filter((item) => item.status === "FAILED" || item.status === "REJECTED").length)} />
      </MetricStrip>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader className="border-b px-4 py-3"><SectionHeader compact title="Fluxo configurado" description="Sequência validada pelos registries do Motor de Automações." /></CardHeader>
          <CardContent className="space-y-3 p-4">
            <Flow title="Gatilho" items={[trigger?.label ?? workflow.trigger.type]} />
            <div className="pl-5 text-muted-foreground">↓</div>
            <Flow title="Condições" items={workflow.conditions.map((item) => automationRegistry.getCondition(item.type)?.label ?? item.type)} />
            <div className="pl-5 text-muted-foreground">↓</div>
            <Flow title="Ações" items={workflow.actions.map((item) => automationRegistry.getAction(item.type)?.label ?? item.type)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b px-4 py-3"><SectionHeader compact title="Informações administrativas" /></CardHeader>
          <CardContent className="space-y-3 p-4 text-sm">
            <Info label="Origem" value={workflow.source} />
            <Info label="Criada em" value={formatDateTimeBR(workflow.createdAt)} />
            <Info label="Atualizada em" value={formatDateTimeBR(workflow.updatedAt)} />
            <Info label="Proteção" value={workflow.isSystem ? "Obrigatória do sistema" : "Criada pelo usuário"} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b px-4 py-3"><SectionHeader compact title="Histórico e auditoria" description="Eventos recentes sem armazenamento de payloads pessoais completos." /></CardHeader>
        <CardContent className="divide-y p-0">
          {history.length ? history.map((entry) => <article key={entry.id} className="grid gap-2 p-4 sm:grid-cols-[1fr_auto]"><div><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{automationHistoryStatusLabels[entry.status]}</Badge><p className="text-sm font-semibold">{entry.result}</p></div><p className="mt-1 text-xs text-muted-foreground">{entry.source} · {entry.plannedActions.length} planejada(s) · {entry.executedActions.length} executada(s) · {entry.skippedActions.length} ignorada(s)</p>{entry.errorMessage ? <p className="mt-1 text-xs text-rose-600">{entry.errorMessage}</p> : null}</div><div className="text-xs text-muted-foreground sm:text-right"><p>{formatDateTimeBR(entry.finishedAt)}</p><p>{entry.durationMs} ms</p></div></article>) : <div className="p-4"><EmptyState size="compact" title="Sem histórico" description="As próximas simulações e execuções aparecerão aqui." /></div>}
        </CardContent>
      </Card>

      {editing ? <AutomationFormDrawer workflow={workflow} onClose={() => setEditing(false)} onSaved={async () => { setEditing(false); await load(); }} /> : null}
      {simulating ? <AutomationSimulationDialog workflow={workflow} onClose={() => setSimulating(false)} onSimulated={load} /> : null}
    </div>
  );
}

function Flow({ title, items }: { title: string; items: string[] }) {
  return <div className="rounded-xl border bg-muted/20 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p><div className="mt-2 flex flex-wrap gap-2">{items.map((item, index) => <Badge key={`${item}-${index}`} variant="outline">{item}</Badge>)}</div></div>;
}
function Info({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 border-b pb-2 last:border-0"><span className="text-muted-foreground">{label}</span><span className="text-right font-medium">{value}</span></div>;
}
