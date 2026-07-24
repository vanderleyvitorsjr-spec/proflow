"use client";

import { Plus, Trash2, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import {
  createAutomationWorkflowAction,
  getAutomationCatalogAction,
  updateAutomationWorkflowAction,
} from "@/automation/admin/automation-admin-actions";
import type {
  AutomationWorkflowInput,
  AutomationWorkflowStatus,
  PersistedAutomationWorkflow,
} from "@/automation/admin/automation-admin-types";
import type {
  AutomationActionConfiguration,
  AutomationActionType,
  AutomationConditionConfiguration,
  AutomationConditionType,
  AutomationTriggerType,
} from "@/automation/types/automation-types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type ConfigDraft = { type: string; parameters: Record<string, string> };
const catalog = getAutomationCatalogAction();

function parametersFrom(
  value: Readonly<Record<string, unknown>>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, String(item)]),
  );
}

function parseParameter(value: string): string | number {
  const numeric = Number(value.replace(",", "."));
  return value.trim() !== "" && Number.isFinite(numeric) ? numeric : value.trim();
}

export function AutomationFormDrawer({
  workflow,
  onClose,
  onSaved,
}: {
  workflow: PersistedAutomationWorkflow | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(workflow?.name ?? "");
  const [description, setDescription] = useState(workflow?.description ?? "");
  const [source, setSource] = useState(workflow?.source ?? "Operação");
  const [status, setStatus] = useState<AutomationWorkflowStatus>(
    workflow?.status ?? "DRAFT",
  );
  const [trigger, setTrigger] = useState<AutomationTriggerType>(
    workflow?.trigger.type ?? "CLIENT_CREATED",
  );
  const [conditions, setConditions] = useState<ConfigDraft[]>(
    workflow?.conditions.map((item) => ({
      type: item.type,
      parameters: parametersFrom(item.parameters),
    })) ?? [{ type: "ALWAYS", parameters: {} }],
  );
  const [actions, setActions] = useState<ConfigDraft[]>(
    workflow?.actions.map((item) => ({
      type: item.type,
      parameters: parametersFrom(item.parameters),
    })) ?? [
      {
        type: "CREATE_TASK",
        parameters: { title: "Revisar próximo passo" },
      },
    ],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const triggerDefinition = useMemo(
    () => catalog.triggers.find((item) => item.type === trigger),
    [trigger],
  );

  function updateConfig(
    setter: React.Dispatch<React.SetStateAction<ConfigDraft[]>>,
    index: number,
    next: ConfigDraft,
  ) {
    setter((current) => current.map((item, itemIndex) => itemIndex === index ? next : item));
  }

  function toInput(nextStatus = status): AutomationWorkflowInput {
    return {
      name,
      description,
      source,
      status: nextStatus,
      mode: workflow?.isSystem ? "REAL" : "SIMULATION",
      trigger: { type: trigger },
      conditions: conditions.map((item) => ({
        type: item.type as AutomationConditionType,
        parameters: Object.fromEntries(
          Object.entries(item.parameters).map(([key, value]) => [
            key,
            parseParameter(value),
          ]),
        ),
      })) as AutomationConditionConfiguration[],
      actions: actions.map((item) => ({
        type: item.type as AutomationActionType,
        parameters: Object.fromEntries(
          Object.entries(item.parameters).map(([key, value]) => [
            key,
            parseParameter(value),
          ]),
        ),
      })) as AutomationActionConfiguration[],
    };
  }

  async function submit(event: FormEvent, nextStatus = status) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const input = toInput(nextStatus);
      if (workflow) await updateAutomationWorkflowAction(workflow.id, input);
      else await createAutomationWorkflowAction(input);
      await onSaved();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível salvar a automação.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="automation-form-title"
        onSubmit={(event) => void submit(event)}
        className="flex h-[100dvh] w-full flex-col overflow-hidden border-l bg-background shadow-2xl sm:max-w-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b p-4 sm:p-5">
          <div>
            <h2 id="automation-form-title" className="text-lg font-semibold">
              {workflow ? "Editar automação" : "Nova automação"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Configure cada etapa. Novas automações funcionam somente em simulação.
            </p>
          </div>
          <Button type="button" size="icon" variant="ghost" onClick={onClose} aria-label="Fechar formulário">
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-4 pb-28 sm:p-5">
          <Step number="A" title="Identificação" description="Dê um nome claro e explique o objetivo do fluxo.">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome" required help="Use um nome que descreva quando e o que acontecerá.">
                <Input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Revisar oportunidades sem atividade" />
              </Field>
              <Field label="Origem" required>
                <Input value={source} onChange={(event) => setSource(event.target.value)} placeholder="Ex.: CRM" />
              </Field>
              <Field className="sm:col-span-2" label="Descrição" required>
                <textarea className="min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Explique em uma frase o resultado esperado." />
              </Field>
              <Field label="Modo">
                <Input value={workflow?.isSystem ? "Real" : "Simulação"} disabled />
              </Field>
              <Field label="Status inicial">
                <Select value={status} onChange={(event) => setStatus(event.target.value as AutomationWorkflowStatus)}>
                  {!workflow?.isSystem ? <option value="DRAFT">Rascunho</option> : null}
                  <option value="ACTIVE">{workflow?.isSystem ? "Ativa" : "Ativa em simulação"}</option>
                  {workflow ? <option value="PAUSED">Pausada</option> : null}
                </Select>
              </Field>
            </div>
          </Step>

          <Step number="B" title="Gatilho" description="Escolha a situação que inicia a avaliação.">
            <Field label="Quando isso acontecer" required>
              <Select value={trigger} disabled={workflow?.isSystem} onChange={(event) => setTrigger(event.target.value as AutomationTriggerType)}>
                {catalog.triggers.map((item) => <option key={item.type} value={item.type}>{item.label}</option>)}
              </Select>
            </Field>
            <div className="rounded-lg border bg-muted/30 p-3 text-xs">
              <p className="font-semibold">{triggerDefinition?.label}</p>
              <p className="mt-1 text-muted-foreground">{triggerDefinition?.description}</p>
              <p className="mt-2"><strong>Dados esperados:</strong> {triggerDefinition?.parameterKeys.join(", ")}</p>
            </div>
          </Step>

          <Step number="C" title="Condições" description="Defina o que precisa ser verdadeiro antes das ações.">
            <div className="space-y-3">
              {conditions.map((condition, index) => (
                <ConfigEditor
                  key={`${condition.type}-${index}`}
                  value={condition}
                  definitions={catalog.conditions}
                  disabled={workflow?.isSystem}
                  onChange={(next) => updateConfig(setConditions, index, next)}
                  onRemove={conditions.length > 1 ? () => setConditions((current) => current.filter((_, itemIndex) => itemIndex !== index)) : undefined}
                />
              ))}
              {!workflow?.isSystem ? <Button type="button" size="sm" variant="secondary" onClick={() => setConditions((current) => [...current, { type: "ALWAYS", parameters: {} }])}><Plus className="h-4 w-4" />Adicionar condição</Button> : null}
            </div>
          </Step>

          <Step number="D" title="Ações" description="Escolha o que seria planejado quando o fluxo for aceito.">
            <div className="space-y-3">
              {actions.map((action, index) => (
                <ConfigEditor
                  key={`${action.type}-${index}`}
                  value={action}
                  definitions={catalog.actions}
                  disabled={workflow?.isSystem}
                  onChange={(next) => updateConfig(setActions, index, next)}
                  onRemove={actions.length > 1 ? () => setActions((current) => current.filter((_, itemIndex) => itemIndex !== index)) : undefined}
                />
              ))}
              {!workflow?.isSystem ? <Button type="button" size="sm" variant="secondary" onClick={() => setActions((current) => [...current, { type: "CREATE_TASK", parameters: { title: "" } }])}><Plus className="h-4 w-4" />Adicionar ação</Button> : null}
            </div>
          </Step>

          <Step number="E" title="Revisão" description="Confira a sequência antes de salvar.">
            <div className="grid gap-2 text-sm sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
              <FlowBox label="Gatilho" value={triggerDefinition?.label ?? trigger} />
              <span className="hidden text-muted-foreground sm:block">→</span>
              <FlowBox label="Condições" value={`${conditions.length} configurada(s)`} />
              <span className="hidden text-muted-foreground sm:block">→</span>
              <FlowBox label="Ações" value={`${actions.length} planejada(s)`} />
            </div>
            {!conditions.length || !actions.length ? <p className="mt-2 text-xs text-amber-700">Adicione ao menos uma condição e uma ação.</p> : null}
            {!workflow?.isSystem ? <p className="mt-2 text-xs text-muted-foreground">Por segurança, este fluxo não poderá alterar dados reais.</p> : null}
          </Step>

          {error ? <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p> : null}
        </div>

        <footer className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          {!workflow?.isSystem ? <Button type="button" variant="secondary" disabled={saving} onClick={(event) => void submit(event, "DRAFT")}>Salvar rascunho</Button> : null}
          <Button type="submit" disabled={saving}>{saving ? "Salvando..." : workflow?.isSystem ? "Salvar alterações" : "Ativar em simulação"}</Button>
        </footer>
      </form>
    </div>
  );
}

function Step({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) {
  return <section className="space-y-3"><div className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{number}</span><div><h3 className="text-sm font-semibold">{title}</h3><p className="text-xs text-muted-foreground">{description}</p></div></div><div className="ml-0 sm:ml-10">{children}</div></section>;
}

function ConfigEditor({ value, definitions, disabled, onChange, onRemove }: { value: ConfigDraft; definitions: ReadonlyArray<{ type: string; label: string; parameterKeys: readonly string[] }>; disabled?: boolean; onChange: (value: ConfigDraft) => void; onRemove?: () => void }) {
  const definition = definitions.find((item) => item.type === value.type) ?? definitions[0];
  return <div className="rounded-lg border p-3"><div className="flex items-center gap-2"><Select value={value.type} disabled={disabled} onChange={(event) => { const next = definitions.find((item) => item.type === event.target.value); onChange({ type: event.target.value, parameters: Object.fromEntries((next?.parameterKeys ?? []).map((key) => [key, ""])) }); }}>{definitions.map((item) => <option key={item.type} value={item.type}>{item.label}</option>)}</Select>{onRemove && !disabled ? <Button type="button" size="icon" variant="ghost" onClick={onRemove} aria-label="Remover item"><Trash2 className="h-4 w-4" /></Button> : null}</div>{definition?.parameterKeys.length ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{definition.parameterKeys.map((key) => <label key={key} className="space-y-1 text-xs"><span className="font-medium">{parameterLabel(key)}</span><Input value={value.parameters[key] ?? ""} disabled={disabled} onChange={(event) => onChange({ ...value, parameters: { ...value.parameters, [key]: event.target.value } })} placeholder={parameterPlaceholder(key)} /></label>)}</div> : <p className="mt-2 text-xs text-muted-foreground">Esta opção não exige parâmetros adicionais.</p>}</div>;
}

function parameterLabel(key: string) {
  return ({ title: "Título", description: "Descrição", amountCents: "Valor em centavos", days: "Dias sem movimentação", category: "Categoria", serviceType: "Tipo de serviço", responsibleId: "Responsável", status: "Status", scheduledAt: "Data e hora", message: "Mensagem", priority: "Prioridade" } as Record<string, string>)[key] ?? key;
}
function parameterPlaceholder(key: string) {
  return key === "days" ? "Ex.: 7" : key === "amountCents" ? "Ex.: 100000" : "Informe o valor";
}
function FlowBox({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border bg-muted/30 p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-xs font-medium">{value}</p></div>;
}
