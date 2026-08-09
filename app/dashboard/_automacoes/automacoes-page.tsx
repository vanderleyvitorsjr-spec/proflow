"use client";

import Link from "next/link";
import {
  Copy,
  Eye,
  History,
  Pause,
  Play,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Workflow,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  changeAutomationWorkflowStatusAction,
  deleteAutomationWorkflowAction,
  duplicateAutomationWorkflowAction,
  listAutomationHistoryAction,
  listAutomationWorkflowsAction,
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
import { Input } from "@/components/ui/input";
import { MetricItem, MetricStrip } from "@/components/ui/metric-strip";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderHeading,
  PageHeaderIdentity,
  PageHeaderToolbar,
} from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableActionsCell,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTimeBR } from "@/lib/br-formatters";
import { AutomationFormDrawer } from "./automation-form-drawer";
import { AutomationSimulationDialog } from "./automation-simulation-dialog";

export function AutomacoesPage() {
  const [workflows, setWorkflows] = useState<PersistedAutomationWorkflow[]>([]);
  const [history, setHistory] = useState<AutomationHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [mode, setMode] = useState("ALL");
  const [trigger, setTrigger] = useState("ALL");
  const [action, setAction] = useState("ALL");
  const [source, setSource] = useState("ALL");
  const [historyWorkflow, setHistoryWorkflow] = useState("ALL");
  const [historyStatus, setHistoryStatus] = useState("ALL");
  const [historyMode, setHistoryMode] = useState("ALL");
  const [historyTrigger, setHistoryTrigger] = useState("ALL");
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");
  const [editing, setEditing] = useState<PersistedAutomationWorkflow | null | undefined>();
  const [simulating, setSimulating] = useState<PersistedAutomationWorkflow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextWorkflows, nextHistory] = await Promise.all([
        listAutomationWorkflowsAction(),
        listAutomationHistoryAction(),
      ]);
      setWorkflows(nextWorkflows);
      setHistory(nextHistory);
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível carregar as automações.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return workflows.filter((workflow) => {
      const triggerDefinition = automationRegistry.getTrigger(workflow.trigger.type);
      const actionLabels = workflow.actions.map(
        (item) => automationRegistry.getAction(item.type)?.label ?? item.type,
      );
      const haystack = [
        workflow.name,
        workflow.description,
        triggerDefinition?.label ?? "",
        ...actionLabels,
      ]
        .join(" ")
        .toLocaleLowerCase("pt-BR");
      return (
        (!term || haystack.includes(term)) &&
        (status === "ALL" || workflow.status === status) &&
        (mode === "ALL" || workflow.mode === mode) &&
        (trigger === "ALL" || workflow.trigger.type === trigger) &&
        (action === "ALL" || workflow.actions.some((item) => item.type === action)) &&
        (source === "ALL" || workflow.source === source)
      );
    });
  }, [action, mode, search, source, status, trigger, workflows]);
  const filteredHistory = useMemo(
    () =>
      history.filter(
        (entry) =>
          (historyWorkflow === "ALL" || entry.workflowId === historyWorkflow) &&
          (historyStatus === "ALL" || entry.status === historyStatus) &&
          (historyMode === "ALL" || entry.mode === historyMode) &&
          (historyTrigger === "ALL" || entry.trigger === historyTrigger) &&
          (!historyFrom || entry.startedAt.slice(0, 10) >= historyFrom) &&
          (!historyTo || entry.startedAt.slice(0, 10) <= historyTo),
      ),
    [
      history,
      historyFrom,
      historyMode,
      historyStatus,
      historyTo,
      historyTrigger,
      historyWorkflow,
    ],
  );

  const realExecutions = history.filter((item) => item.status === "SUCCESS").length;
  const simulations = history.filter((item) => item.status === "SIMULATED").length;
  const recentFailures = history.filter(
    (item) => item.status === "FAILED" || item.status === "REJECTED",
  ).length;

  async function mutate(operation: () => Promise<unknown>) {
    try {
      await operation();
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Não foi possível atualizar a automação.",
      );
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderIdentity>
            <Workflow className="h-5 w-5" aria-hidden="true" />
            <PageHeaderHeading
              title="Automações"
              description="Organize fluxos automáticos e simulações sem perder o controle das decisões."
            />
          </PageHeaderIdentity>
          <PageHeaderActions>
            <Button size="sm" onClick={() => setEditing(null)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nova automação
            </Button>
          </PageHeaderActions>
        </PageHeaderContent>
        <PageHeaderToolbar>
          <div className="relative min-w-52 flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, gatilho ou ação"
              aria-label="Buscar automações"
            />
          </div>
          <Filter value={status} onChange={setStatus} label="Status">
            <option value="ALL">Todos os status</option>
            <option value="ACTIVE">Ativas</option>
            <option value="PAUSED">Pausadas</option>
            <option value="DRAFT">Rascunhos</option>
          </Filter>
          <Filter value={mode} onChange={setMode} label="Modo">
            <option value="ALL">Todos os modos</option>
            <option value="SIMULATION">Simulação</option>
            <option value="REAL">Real</option>
          </Filter>
          <Filter value={trigger} onChange={setTrigger} label="Gatilho">
            <option value="ALL">Todos os gatilhos</option>
            {automationRegistry.listTriggers().map((item) => (
              <option key={item.type} value={item.type}>{item.label}</option>
            ))}
          </Filter>
          <Filter value={action} onChange={setAction} label="Ação">
            <option value="ALL">Todas as ações</option>
            {automationRegistry.listActions().map((item) => (
              <option key={item.type} value={item.type}>{item.label}</option>
            ))}
          </Filter>
          <Filter value={source} onChange={setSource} label="Origem">
            <option value="ALL">Todas as origens</option>
            {[...new Set(workflows.map((item) => item.source))].map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </Filter>
        </PageHeaderToolbar>
      </PageHeader>

      <MetricStrip>
        <MetricItem label="Total" value={String(workflows.length)} />
        <MetricItem label="Ativas" value={String(workflows.filter((item) => item.status === "ACTIVE").length)} tone="success" />
        <MetricItem label="Pausadas" value={String(workflows.filter((item) => item.status === "PAUSED").length)} tone="warning" />
        <MetricItem label="Em simulação" value={String(workflows.filter((item) => item.mode === "SIMULATION").length)} tone="info" />
        <MetricItem label="Execuções reais" value={String(realExecutions)} />
        <MetricItem label="Simulações" value={String(simulations)} />
        <MetricItem label="Ocorrências recentes" value={String(recentFailures)} tone={recentFailures ? "danger" : "neutral"} />
      </MetricStrip>

      {error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">{error}</p> : null}

      <Card>
        <CardHeader className="border-b px-4 py-3">
          <SectionHeader compact title="Workflows" description={`${filtered.length} automação(ões) encontrada(s).`} />
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-12 animate-pulse rounded-lg bg-muted" />)}</div>
          ) : filtered.length ? (
            <Table density="compact" scrollHint>
              <TableHeader>
                <TableRow>
                  <TableHead>Automação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Modo</TableHead>
                  <TableHead>Gatilho e ações</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Atividade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((workflow) => {
                  const entries = history.filter((item) => item.workflowId === workflow.id);
                  const lastFailure = entries.find(
                    (item) => item.status === "FAILED" || item.status === "REJECTED",
                  );
                  return (
                    <TableRow key={workflow.id}>
                      <TableCell className="min-w-64">
                        <p className="font-semibold">{workflow.name}</p>
                        <p className="line-clamp-1 text-xs text-muted-foreground">{workflow.description}</p>
                        {workflow.isSystem ? <Badge variant="outline" className="mt-1">Obrigatória do sistema</Badge> : null}
                      </TableCell>
                      <TableCell><Badge variant={workflow.status === "ACTIVE" ? "success" : workflow.status === "PAUSED" ? "warning" : "secondary"}>{workflowStatusLabels[workflow.status]}</Badge></TableCell>
                      <TableCell>{workflowModeLabels[workflow.mode]}</TableCell>
                      <TableCell className="min-w-56">
                        <p className="text-xs font-semibold">{automationRegistry.getTrigger(workflow.trigger.type)?.label}</p>
                        <p className="text-xs text-muted-foreground">{workflow.conditions.length} condição(ões) · {workflow.actions.length} ação(ões)</p>
                      </TableCell>
                      <TableCell>{workflow.source}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        <p>{entries.filter((item) => item.status === "SUCCESS").length} execução(ões)</p>
                        <p>{entries.filter((item) => item.status === "SIMULATED").length} simulação(ões)</p>
                        <p>{entries[0] ? formatDateTimeBR(entries[0].finishedAt) : "Sem atividade"}</p>
                        {lastFailure ? <p className="text-rose-600">Última ocorrência: {formatDateTimeBR(lastFailure.finishedAt)}</p> : null}
                      </TableCell>
                      <TableActionsCell>
                        <div className="flex justify-end gap-1">
                          <Button asChild size="icon" variant="ghost" aria-label="Visualizar automação"><Link href={`/dashboard/automacoes/${workflow.id}`}><Eye className="h-4 w-4" /></Link></Button>
                          <Button size="icon" variant="ghost" aria-label="Editar automação" onClick={() => setEditing(workflow)}><Workflow className="h-4 w-4" /></Button>
                          {!workflow.isSystem ? <Button size="icon" variant="ghost" aria-label="Duplicar automação" onClick={() => void mutate(() => duplicateAutomationWorkflowAction(workflow.id))}><Copy className="h-4 w-4" /></Button> : null}
                          <Button size="icon" variant="ghost" aria-label="Simular automação" onClick={() => setSimulating(workflow)}><Sparkles className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" aria-label={workflow.status === "ACTIVE" ? "Pausar automação" : "Ativar automação"} onClick={() => void mutate(() => changeAutomationWorkflowStatusAction(workflow.id, workflow.status === "ACTIVE" ? "PAUSED" : "ACTIVE"))}>{workflow.status === "ACTIVE" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</Button>
                          {!workflow.isSystem ? <Button size="icon" variant="ghost" aria-label="Excluir automação" onClick={() => { if (window.confirm(`Excluir “${workflow.name}”? Esta ação não poderá ser desfeita.`)) void mutate(() => deleteAutomationWorkflowAction(workflow.id)); }}><Trash2 className="h-4 w-4 text-rose-500" /></Button> : null}
                        </div>
                      </TableActionsCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="p-4"><EmptyState size="compact" icon={<Workflow className="h-5 w-5" />} title="Nenhuma automação encontrada" description="Altere os filtros ou crie uma automação em modo de simulação." /></div>
          )}
        </CardContent>
      </Card>

      <Card id="historico">
        <CardHeader className="border-b px-4 py-3">
          <SectionHeader compact title="Histórico geral" description="Execuções, simulações, rejeições e eventos ignorados." actions={<History className="h-4 w-4 text-muted-foreground" />} />
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid gap-2 border-b p-3 sm:grid-cols-2 xl:grid-cols-6">
            <Filter value={historyWorkflow} onChange={setHistoryWorkflow} label="Automação"><option value="ALL">Todas as automações</option>{workflows.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Filter>
            <Filter value={historyStatus} onChange={setHistoryStatus} label="Resultado"><option value="ALL">Todos os resultados</option>{Object.entries(automationHistoryStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Filter>
            <Filter value={historyMode} onChange={setHistoryMode} label="Modo"><option value="ALL">Todos os modos</option><option value="SIMULATION">Simulação</option><option value="REAL">Real</option></Filter>
            <Filter value={historyTrigger} onChange={setHistoryTrigger} label="Gatilho"><option value="ALL">Todos os gatilhos</option>{automationRegistry.listTriggers().map((item) => <option key={item.type} value={item.type}>{item.label}</option>)}</Filter>
            <label className="text-xs text-muted-foreground">De<Input type="date" value={historyFrom} onChange={(event) => setHistoryFrom(event.target.value)} /></label>
            <label className="text-xs text-muted-foreground">Até<Input type="date" value={historyTo} onChange={(event) => setHistoryTo(event.target.value)} /></label>
          </div>
          {filteredHistory.length ? (
            <Table density="compact" scrollHint>
              <TableHeader><TableRow><TableHead>Automação</TableHead><TableHead>Resultado</TableHead><TableHead>Modo</TableHead><TableHead>Origem</TableHead><TableHead>Quando</TableHead><TableHead>Duração</TableHead></TableRow></TableHeader>
              <TableBody>{filteredHistory.slice(0, 50).map((entry) => <TableRow key={entry.id}><TableCell className="font-medium">{entry.workflowName}</TableCell><TableCell><Badge variant={entry.status === "FAILED" || entry.status === "REJECTED" ? "destructive" : entry.status === "SKIPPED" ? "warning" : "secondary"}>{automationHistoryStatusLabels[entry.status]}</Badge><p className="mt-1 text-xs text-muted-foreground">{entry.result}</p></TableCell><TableCell>{workflowModeLabels[entry.mode]}</TableCell><TableCell>{entry.source}</TableCell><TableCell>{formatDateTimeBR(entry.finishedAt)}</TableCell><TableCell>{entry.durationMs} ms</TableCell></TableRow>)}</TableBody>
            </Table>
          ) : <div className="p-4"><EmptyState size="compact" icon={<History className="h-5 w-5" />} title="Histórico vazio" description="As próximas simulações e execuções aparecerão aqui." /></div>}
        </CardContent>
      </Card>

      {editing !== undefined ? <AutomationFormDrawer workflow={editing} onClose={() => setEditing(undefined)} onSaved={async () => { setEditing(undefined); await load(); }} /> : null}
      {simulating ? <AutomationSimulationDialog workflow={simulating} onClose={() => setSimulating(null)} onSimulated={load} /> : null}
    </div>
  );
}

function Filter({ value, onChange, label, children }: { value: string; onChange: (value: string) => void; label: string; children: React.ReactNode }) {
  return <label className="min-w-36"><span className="sr-only">{label}</span><Select value={value} onChange={(event) => onChange(event.target.value)}>{children}</Select></label>;
}
