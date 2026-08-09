"use client";

import { CheckCircle2, Play, XCircle } from "lucide-react";
import { useState } from "react";

import {
  getAutomationExamplePayloadAction,
  simulateAutomationWorkflowAction,
} from "@/automation/admin/automation-admin-actions";
import type { PersistedAutomationWorkflow } from "@/automation/admin/automation-admin-types";
import type { AutomationSimulationReport } from "@/automation/types/automation-types";
import { automationRegistry } from "@/automation/registry/automation-registry";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTimeBR } from "@/lib/br-formatters";

export function AutomationSimulationDialog({
  workflow,
  onClose,
  onSimulated,
}: {
  workflow: PersistedAutomationWorkflow;
  onClose: () => void;
  onSimulated: () => Promise<void>;
}) {
  const example = getAutomationExamplePayloadAction(workflow.trigger.type);
  const [payload, setPayload] = useState(JSON.stringify(example, null, 2));
  const [report, setReport] = useState<AutomationSimulationReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function simulate() {
    setBusy(true);
    setError("");
    try {
      const parsed = JSON.parse(payload) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        throw new Error("Informe os dados do evento como um objeto válido.");
      const result = await simulateAutomationWorkflowAction(
        workflow.id,
        parsed as Readonly<Record<string, unknown>>,
      );
      setReport(result.report);
      await onSimulated();
    } catch (cause) {
      setError(
        cause instanceof SyntaxError
          ? "Revise o formato dos dados do evento."
          : cause instanceof Error
            ? cause.message
            : "Não foi possível executar a simulação.",
      );
    } finally {
      setBusy(false);
    }
  }

  const accepted = report?.acceptedWorkflows.includes(workflow.id) ?? false;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-3">
      <section role="dialog" aria-modal="true" aria-labelledby="simulation-title" className="flex max-h-[min(92dvh,50rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border bg-background shadow-2xl">
        <header className="border-b p-4 sm:p-5">
          <h2 id="simulation-title" className="text-lg font-semibold">Simular automação</h2>
          <p className="mt-1 text-xs text-muted-foreground">{workflow.name} · nenhuma alteração real será executada.</p>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Gatilho" value={automationRegistry.getTrigger(workflow.trigger.type)?.label ?? workflow.trigger.type} />
            <Info label="Estrutura" value={`${workflow.conditions.length} condição(ões) · ${workflow.actions.length} ação(ões)`} />
          </div>
          <label className="block space-y-1 text-sm font-medium">
            <span>Dados de exemplo do evento</span>
            <textarea className="min-h-48 w-full rounded-lg border bg-background p-3 font-mono text-xs" value={payload} onChange={(event) => setPayload(event.target.value)} spellCheck={false} />
            <span className="block text-xs font-normal text-muted-foreground">Use somente dados fictícios. O conteúdo serve exclusivamente para esta simulação.</span>
          </label>
          {error ? <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p> : null}
          {report ? (
            <div className="space-y-3 rounded-xl border p-4">
              <div className="flex flex-wrap items-center gap-2">
                {accepted ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-rose-500" />}
                <p className="font-semibold">{accepted ? "Workflow aceito" : "Workflow rejeitado"}</p>
                <Badge variant="secondary">{formatDateTimeBR(report.simulatedAt)}</Badge>
              </div>
              <div>
                <p className="text-xs font-semibold">Ações planejadas</p>
                {report.plannedActions.length ? <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">{report.plannedActions.map((item, index) => <li key={`${item.type}-${index}`}>{automationRegistry.getAction(item.type)?.label ?? item.type}</li>)}</ul> : <p className="mt-1 text-sm text-muted-foreground">Nenhuma ação seria executada.</p>}
              </div>
              {report.rejectedWorkflows.length ? <div><p className="text-xs font-semibold">Razões</p><ul className="mt-1 list-disc pl-5 text-sm text-rose-700 dark:text-rose-300">{report.rejectedWorkflows.flatMap((item) => item.reasons).map((item, index) => <li key={`${item.path}-${index}`}>{item.message}</li>)}</ul></div> : null}
            </div>
          ) : null}
        </div>
        <footer className="flex justify-end gap-2 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
          <Button variant="secondary" onClick={onClose}>Fechar</Button>
          <Button onClick={() => void simulate()} disabled={busy}><Play className="h-4 w-4" />{busy ? "Simulando..." : report ? "Repetir simulação" : "Executar simulação"}</Button>
        </footer>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>;
}
