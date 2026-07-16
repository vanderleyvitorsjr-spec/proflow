"use client";
import { useEffect, useMemo, useState } from "react";
import { Calculator, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { MetricItem, MetricStrip } from "@/components/ui/metric-strip";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderHeading,
  PageHeaderIcon,
  PageHeaderIdentity,
  PageHeaderToolbar,
} from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import {
  archivePricingSimulationAction,
  archivePricingTemplateAction,
  createPricingCompositionAction,
  createPricingSimulationAction,
  createPricingTemplateAction,
  duplicatePricingSimulationAction,
  duplicatePricingTemplateAction,
  listPricingAction,
  saveLaborProfileAction,
  savePricingPreferencesAction,
  updatePricingSimulationAction,
  updatePricingTemplateAction,
} from "./precificacao-actions";
import { PricingComparison } from "./precificacao-comparison";
import { PricingCompositionDialog } from "./precificacao-composition-dialog";
import { PricingConfirmationDialog } from "./precificacao-confirmation-dialog";
import { PricingLaborProfileDialog } from "./precificacao-labor-profile-dialog";
import type {
  LaborProfileFormValues,
  PricingSimulationFormValues,
  PricingTemplateFormValues,
} from "./precificacao-schema";
import { calculatePricing } from "./precificacao-selectors";
import { PricingSimulationDialog } from "./precificacao-simulation-dialog";
import { PricingSimulationsList } from "./precificacao-simulations-list";
import { defaultPricingPreferences } from "./precificacao-storage-adapter";
import { PricingTemplateDialog } from "./precificacao-template-dialog";
import type {
  LaborProfile,
  PricingPreferences,
  PricingSimulation,
  PricingTemplate,
} from "./precificacao-types";
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export function PrecificacaoPageContent() {
  const [templates, setTemplates] = useState<PricingTemplate[]>([]),
    [simulations, setSimulations] = useState<PricingSimulation[]>([]),
    [laborProfiles, setLaborProfiles] = useState<LaborProfile[]>([]),
    [preferences, setPreferences] = useState<PricingPreferences>(
      defaultPricingPreferences,
    ),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [success, setSuccess] = useState<string | null>(null),
    [simulationOpen, setSimulationOpen] = useState(false),
    [editingSimulation, setEditingSimulation] = useState<PricingSimulation | null>(null),
    [templateOpen, setTemplateOpen] = useState(false),
    [editingTemplate, setEditingTemplate] = useState<PricingTemplate | null>(null),
    [laborOpen, setLaborOpen] = useState(false),
    [compositionTemplate, setCompositionTemplate] = useState<PricingTemplate | null>(
      null,
    ),
    [archiving, setArchiving] = useState<{
      kind: "simulation" | "template";
      id: string;
    } | null>(null);
  async function load() {
    setLoading(true);
    const result = await listPricingAction();
    if (result.ok) {
      setTemplates(result.data.templates);
      setSimulations(result.data.simulations);
      setLaborProfiles(result.data.laborProfiles);
      setPreferences(result.data.preferences);
    } else setError(result.error.message);
    setLoading(false);
  }
  useEffect(() => {
    queueMicrotask(() => void load());
  }, []);
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => void savePricingPreferencesAction(preferences), 250);
    return () => clearTimeout(timer);
  }, [preferences, loading]);
  const filtered = useMemo(
    () =>
      simulations.filter((item) => {
        const q = preferences.searchTerm.toLocaleLowerCase("pt-BR"),
          template = templates.find((t) => t.id === item.templateId),
          result = calculatePricing(item.costComponents, item.commercialRules);
        return (
          (!q ||
            [
              item.title,
              item.parameters.description,
              item.parameters.category,
              template?.name,
              template?.code,
            ]
              .filter(Boolean)
              .join(" ")
              .toLocaleLowerCase("pt-BR")
              .includes(q)) &&
          (preferences.statusFilter === "ALL" ||
            item.status === preferences.statusFilter) &&
          (preferences.indicatorFilter === "ALL" ||
            result.indicator === preferences.indicatorFilter) &&
          (!item.archivedAt || preferences.includeArchived)
        );
      }),
    [simulations, templates, preferences],
  );
  const results = simulations
    .filter((s) => !s.archivedAt)
    .map((s) => calculatePricing(s.costComponents, s.commercialRules));
  const scenarioGroups = useMemo(() => {
    const groups = new Map<string, PricingSimulation[]>();
    for (const item of simulations) {
      if (!item.scenarioGroupId) continue;
      groups.set(item.scenarioGroupId, [
        ...(groups.get(item.scenarioGroupId) ?? []),
        item,
      ]);
    }
    return [...groups.values()].filter((group) => group.length > 1);
  }, [simulations]);
  async function run<T>(
    work: () => Promise<
      { ok: true; data: T } | { ok: false; error: { message: string } }
    >,
    message: string,
  ) {
    setBusy(true);
    setError(null);
    const result = await work();
    if (result.ok) {
      setSuccess(message);
      await load();
    } else setError(result.error.message);
    setBusy(false);
    return result.ok;
  }
  async function saveSimulation(input: PricingSimulationFormValues) {
    const ok = editingSimulation?.id
      ? await run(
          () => updatePricingSimulationAction(editingSimulation.id, input),
          "Simulação atualizada e nova revisão criada.",
        )
      : await run(() => createPricingSimulationAction(input), "Simulação criada.");
    if (ok) {
      setSimulationOpen(false);
      setEditingSimulation(null);
    }
  }
  async function saveTemplate(input: PricingTemplateFormValues) {
    const ok = editingTemplate
      ? await run(
          () => updatePricingTemplateAction(editingTemplate.id, input),
          "Template atualizado.",
        )
      : await run(() => createPricingTemplateAction(input), "Template criado.");
    if (ok) {
      setTemplateOpen(false);
      setEditingTemplate(null);
    }
  }
  return (
    <div className="space-y-3">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderIdentity>
            <PageHeaderIcon>
              <Calculator className="h-4 w-4" />
            </PageHeaderIcon>
            <PageHeaderHeading
              title="Precificação"
              description="Templates, simulações, cenários e fórmulas auditáveis em centavos."
            />
          </PageHeaderIdentity>
          <PageHeaderActions>
            <Button size="sm" variant="secondary" onClick={() => setLaborOpen(true)}>
              Perfis de mão de obra
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setEditingTemplate(null);
                setTemplateOpen(true);
              }}
            >
              Novo template
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingSimulation(null);
                setSimulationOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Nova simulação
            </Button>
          </PageHeaderActions>
        </PageHeaderContent>
        <PageHeaderToolbar>
          <div className="flex w-full flex-col gap-2 lg:flex-row">
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={preferences.view === "calculator" ? "default" : "ghost"}
                onClick={() => setPreferences((p) => ({ ...p, view: "calculator" }))}
              >
                Simulações
              </Button>
              <Button
                size="sm"
                variant={preferences.view === "services" ? "default" : "ghost"}
                onClick={() => setPreferences((p) => ({ ...p, view: "services" }))}
              >
                Biblioteca
              </Button>
              <Button
                size="sm"
                variant={preferences.view === "simulations" ? "default" : "ghost"}
                onClick={() => setPreferences((p) => ({ ...p, view: "simulations" }))}
              >
                Cenários
              </Button>
            </div>
            <Input
              aria-label="Buscar precificações"
              placeholder="Buscar título, código, template..."
              value={preferences.searchTerm}
              onChange={(e) =>
                setPreferences((p) => ({ ...p, searchTerm: e.target.value }))
              }
            />
            <Select
              aria-label="Status"
              value={preferences.statusFilter}
              onChange={(e) =>
                setPreferences((p) => ({ ...p, statusFilter: e.target.value }))
              }
            >
              <option value="ALL">Todos os status</option>
              {["DRAFT", "READY", "APPLIED", "OUTDATED", "ARCHIVED"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </Select>
            <Select
              aria-label="Indicador"
              value={preferences.indicatorFilter}
              onChange={(e) =>
                setPreferences((p) => ({ ...p, indicatorFilter: e.target.value }))
              }
            >
              <option value="ALL">Todas as margens</option>
              {["LOSS", "LOW_MARGIN", "HEALTHY", "PREMIUM"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </Select>
            <label className="flex items-center gap-2 whitespace-nowrap text-xs">
              <input
                type="checkbox"
                checked={preferences.includeArchived}
                onChange={(e) =>
                  setPreferences((p) => ({ ...p, includeArchived: e.target.checked }))
                }
              />
              Arquivados
            </label>
          </div>
        </PageHeaderToolbar>
      </PageHeader>
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-500/30 p-3 text-sm text-red-600"
        >
          {error}
        </p>
      ) : null}
      {success ? (
        <p
          role="status"
          className="rounded-lg border border-emerald-500/30 p-3 text-sm text-emerald-700"
        >
          {success}
        </p>
      ) : null}
      {loading ? (
        <div
          className="h-64 animate-pulse rounded-xl bg-muted"
          aria-label="Carregando precificação"
        />
      ) : (
        <>
          <MetricStrip className="sm:min-w-0 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-5">
            <MetricItem label="Simulações" value={simulations.length} />
            <MetricItem
              label="Templates ativos"
              value={templates.filter((t) => t.active && !t.archivedAt).length}
            />
            <MetricItem
              label="Ticket recomendado"
              value={money.format(
                results.reduce((s, r) => s + r.recommendedPriceCents, 0) /
                  (results.length || 1) /
                  100,
              )}
              tone="info"
            />
            <MetricItem
              label="Margem média"
              value={`${(results.reduce((s, r) => s + r.effectiveMarginBasisPoints, 0) / (results.length || 1) / 100).toLocaleString("pt-BR")}%`}
              tone="success"
            />
            <MetricItem
              label="Em alerta"
              value={
                results.filter((r) => ["LOSS", "LOW_MARGIN"].includes(r.indicator)).length
              }
              tone="warning"
            />
          </MetricStrip>
          {preferences.view === "calculator" ? (
            <PricingSimulationsList
              simulations={filtered}
              templates={templates}
              onEdit={(item) => {
                setEditingSimulation(item);
                setSimulationOpen(true);
              }}
              onDuplicate={(item) =>
                void run(
                  () => duplicatePricingSimulationAction(item.id),
                  "Simulação duplicada.",
                )
              }
              onScenario={(item) =>
                void run(
                  () => duplicatePricingSimulationAction(item.id, true),
                  "Novo cenário criado.",
                )
              }
              onArchive={(item) => setArchiving({ kind: "simulation", id: item.id })}
            />
          ) : preferences.view === "services" ? (
            <TemplateLibrary
              templates={templates.filter(
                (t) => preferences.includeArchived || !t.archivedAt,
              )}
              onEdit={(item) => {
                setEditingTemplate(item);
                setTemplateOpen(true);
              }}
              onDuplicate={(item) =>
                void run(
                  () => duplicatePricingTemplateAction(item.id),
                  "Template duplicado.",
                )
              }
              onArchive={(item) => setArchiving({ kind: "template", id: item.id })}
              onComposition={setCompositionTemplate}
              onApply={(item) => {
                setEditingSimulation({
                  ...({} as PricingSimulation),
                  id: "",
                  sequence: 0,
                  title: item.name,
                  templateId: item.id,
                  scenarioLabel: "Cenário A",
                  parameters: { description: item.description, category: item.category },
                  costComponents: item.costComponents,
                  commercialRules: item.commercialRules,
                  currentVersion: 0,
                  status: "DRAFT",
                  createdAt: "",
                  updatedAt: "",
                  revisions: [],
                  history: [],
                });
                setSimulationOpen(true);
              }}
            />
          ) : (
            <div className="space-y-3">
              {scenarioGroups.length ? (
                scenarioGroups.map((group, index) => (
                  <section
                    key={group[0].scenarioGroupId}
                    className="rounded-xl border bg-card p-4"
                  >
                    <h2 className="mb-3 text-sm font-semibold">
                      Grupo de cenários {index + 1}
                    </h2>
                    <PricingComparison simulations={group} />
                  </section>
                ))
              ) : (
                <EmptyState
                  title="Sem cenários comparáveis"
                  description="Use a ação Cenário para criar as opções A, B e C."
                />
              )}
            </div>
          )}
        </>
      )}
      <PricingSimulationDialog
        open={simulationOpen}
        simulation={editingSimulation}
        templates={templates}
        laborProfiles={laborProfiles}
        busy={busy}
        error={error}
        onClose={() => {
          setSimulationOpen(false);
          setEditingSimulation(null);
        }}
        onSave={saveSimulation}
      />
      <PricingTemplateDialog
        open={templateOpen}
        template={editingTemplate}
        busy={busy}
        error={error}
        onClose={() => setTemplateOpen(false)}
        onSave={saveTemplate}
      />
      <PricingLaborProfileDialog
        open={laborOpen}
        busy={busy}
        onClose={() => setLaborOpen(false)}
        onSave={async (input: LaborProfileFormValues) => {
          if (await run(() => saveLaborProfileAction(input), "Perfil salvo."))
            setLaborOpen(false);
        }}
      />
      <PricingCompositionDialog
        open={Boolean(compositionTemplate)}
        busy={busy}
        onClose={() => setCompositionTemplate(null)}
        onSave={async (name, description) => {
          if (
            compositionTemplate &&
            (await run(
              () =>
                createPricingCompositionAction(compositionTemplate.id, name, description),
              "Composição criada.",
            ))
          )
            setCompositionTemplate(null);
        }}
      />
      <PricingConfirmationDialog
        open={Boolean(archiving)}
        title="Arquivar registro?"
        description="O histórico e as revisões serão preservados."
        busy={busy}
        onClose={() => setArchiving(null)}
        onConfirm={async (reason) => {
          if (!archiving) return;
          const ok =
            archiving.kind === "simulation"
              ? await run(
                  () => archivePricingSimulationAction(archiving.id, reason),
                  "Simulação arquivada.",
                )
              : await run(
                  () => archivePricingTemplateAction(archiving.id, reason),
                  "Template arquivado.",
                );
          if (ok) setArchiving(null);
        }}
      />
    </div>
  );
}
function TemplateLibrary({
  templates,
  onEdit,
  onDuplicate,
  onArchive,
  onComposition,
  onApply,
}: {
  templates: PricingTemplate[];
  onEdit: (i: PricingTemplate) => void;
  onDuplicate: (i: PricingTemplate) => void;
  onArchive: (i: PricingTemplate) => void;
  onComposition: (i: PricingTemplate) => void;
  onApply: (i: PricingTemplate) => void;
}) {
  if (!templates.length)
    return (
      <EmptyState
        title="Biblioteca vazia"
        description="Crie o primeiro template reutilizável."
      />
    );
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {templates.map((item) => (
        <article key={item.id} className="rounded-xl border bg-card p-4">
          <p className="text-xs font-medium text-primary">
            {item.code} · v{item.currentVersion}
          </p>
          <h2 className="mt-1 font-semibold">{item.name}</h2>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {item.description}
          </p>
          <div className="mt-3 text-xs text-muted-foreground">
            {item.costComponents.length} componentes · {item.compositions.length}{" "}
            composições
          </div>
          <div className="mt-4 flex flex-wrap gap-1">
            <Button size="sm" onClick={() => onApply(item)}>
              Aplicar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onEdit(item)}>
              Editar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDuplicate(item)}>
              Duplicar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onComposition(item)}>
              Composição
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={Boolean(item.archivedAt)}
              onClick={() => onArchive(item)}
            >
              Arquivar
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
export default PrecificacaoPageContent;
