"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricItem, MetricStrip } from "@/components/ui/metric-strip";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderHeading,
  PageHeaderIcon,
  PageHeaderIdentity,
} from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableFrame,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  addRealPricingEquipmentAction,
  addStockPricingMaterialAction,
  getPricingDivergencesAction,
  getPricingSimulationAction,
  listPricingSourcesAction,
  reviewPricingSourceAction,
  updatePricingSimulationAction,
  listPricingCommercialReferencesAction,
  linkPricingCommercialAction,
  applyPricingToOrderAction,
} from "../precificacao-actions";
import { PricingRelationsDialog } from "../precificacao-relations-dialog";
import { PricingApplicationDialog } from "../precificacao-application-dialog";
import { PricingVersionComparison } from "../precificacao-version-comparison";
import { PricingCommercialDivergences } from "../precificacao-commercial-divergences";
import { PricingMaterialDialog } from "../precificacao-material-dialog";
import { PricingEquipmentDialog } from "../precificacao-equipment-dialog";
import { PricingCostDivergences } from "../precificacao-cost-divergences";
import { PricingReversePricing } from "../precificacao-reverse-pricing";
import type { PricingSimulationFormValues } from "../precificacao-schema";
import { calculatePricing } from "../precificacao-selectors";
import { PricingSimulationDialog } from "../precificacao-simulation-dialog";
import type { PricingCostDivergence, PricingSimulation } from "../precificacao-types";
import type { StockPricingReference } from "@/lib/contracts/estoque.contract";
import type { EquipmentPricingReference } from "@/lib/contracts/equipamentos.contract";
import type { ClientPublicReference } from "@/lib/contracts/clientes.contract";
import type { CrmPricingReference } from "@/lib/contracts/crm.contract";
import type { ServiceOrderPricingReference } from "@/lib/contracts/ordens.contract";
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export function PricingDetail({ simulationId }: { simulationId: string }) {
  const [simulation, setSimulation] = useState<PricingSimulation | null>(null),
    [loading, setLoading] = useState(true),
    [editing, setEditing] = useState(false),
    [busy, setBusy] = useState(false),
    [materialOpen, setMaterialOpen] = useState(false),
    [equipmentOpen, setEquipmentOpen] = useState(false),
    [replaceComponentId, setReplaceComponentId] = useState<string | undefined>(),
    [stock, setStock] = useState<StockPricingReference[]>([]),
    [equipment, setEquipment] = useState<EquipmentPricingReference[]>([]),
    [divergences, setDivergences] = useState<PricingCostDivergence[]>([]),
    [error, setError] = useState<string | null>(null),
    [success, setSuccess] = useState<string | null>(null);
  const [relationsOpen, setRelationsOpen] = useState(false), [applicationOpen, setApplicationOpen] = useState(false), [clients, setClients] = useState<ClientPublicReference[]>([]), [leads, setLeads] = useState<CrmPricingReference[]>([]), [orders, setOrders] = useState<ServiceOrderPricingReference[]>([]);
  const load = useCallback(async () => {
    setLoading(true);
    const [result, sources, divergenceResult, commercial] = await Promise.all([
      getPricingSimulationAction(simulationId),
      listPricingSourcesAction(),
      getPricingDivergencesAction(simulationId),
      listPricingCommercialReferencesAction(),
    ]);
    if (result.ok) setSimulation(result.data);
    else setError(result.error.message);
    if (sources.ok) {
      setStock(sources.data.stock);
      setEquipment(sources.data.equipment);
    }
    if (divergenceResult.ok) setDivergences(divergenceResult.data);
    if (commercial.ok) { setClients(commercial.data.clients); setLeads(commercial.data.leads); setOrders(commercial.data.orders); }
    setLoading(false);
  }, [simulationId]);
  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);
  if (loading) return <div className="h-72 animate-pulse rounded-xl bg-muted" />;
  if (!simulation)
    return (
      <EmptyState
        title="Simulação não encontrada"
        description={error ?? "O registro não está disponível."}
        action={
          <Button asChild>
            <Link href="/dashboard/precificacao">Voltar</Link>
          </Button>
        }
      />
    );
  const result = calculatePricing(simulation.costComponents, simulation.commercialRules);
  async function save(input: PricingSimulationFormValues) {
    setBusy(true);
    const response = await updatePricingSimulationAction(simulation!.id, input);
    if (response.ok) {
      setSimulation(response.data);
      setSuccess("Simulação atualizada e revisão criada.");
      setEditing(false);
    } else setError(response.error.message);
    setBusy(false);
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
              title={`Precificação #${String(simulation.sequence).padStart(4, "0")}`}
              description={`${simulation.title} · versão ${simulation.currentVersion}`}
            />
          </PageHeaderIdentity>
          <PageHeaderActions>
            <Button asChild size="sm" variant="ghost">
              <Link href="/dashboard/precificacao">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Precificação
              </Link>
            </Button>
            <Button
              size="sm"
              onClick={() => setEditing(true)}
              disabled={Boolean(simulation.archivedAt)}
            >
              Editar
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setRelationsOpen(true)}>Vínculos</Button>
            <Button size="sm" onClick={() => setApplicationOpen(true)} disabled={!simulation.serviceOrderId}>{simulation.appliedVersion ? "Atualizar preço da OS" : "Aplicar à OS"}</Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setReplaceComponentId(undefined);
                setMaterialOpen(true);
              }}
            >
              Material do Estoque
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setReplaceComponentId(undefined);
                setEquipmentOpen(true);
              }}
            >
              Equipamento real
            </Button>
          </PageHeaderActions>
        </PageHeaderContent>
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
      <MetricStrip className="sm:min-w-0 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-5">
        <MetricItem
          label="Custo total"
          value={money.format(result.totalCostCents / 100)}
        />
        <MetricItem
          label="Preço mínimo"
          value={money.format(result.minimumPriceCents / 100)}
          tone="warning"
        />
        <MetricItem
          label="Recomendado"
          value={money.format(result.recommendedPriceCents / 100)}
          tone="info"
        />
        <MetricItem
          label="Premium"
          value={money.format(result.premiumPriceCents / 100)}
          tone="violet"
        />
        <MetricItem
          label="Promocional"
          value={money.format(result.promotionalPriceCents / 100)}
          tone={result.differenceToMinimumCents < 0 ? "danger" : "success"}
        />
      </MetricStrip>
      <section className="grid gap-3 rounded-xl border bg-card p-4 text-sm md:grid-cols-3">
        <div><p className="text-xs text-muted-foreground">Cliente</p>{simulation.clientSnapshot ? <Link className="font-medium text-primary hover:underline" href={`/dashboard/clientes/${simulation.clientSnapshot.id}`}>{simulation.clientSnapshot.name}</Link> : <p>Não vinculado</p>}</div>
        <div><p className="text-xs text-muted-foreground">Lead</p>{simulation.crmSnapshot ? <Link className="font-medium text-primary hover:underline" href={`/dashboard/crm/${simulation.crmSnapshot.id}`}>{simulation.crmSnapshot.title}</Link> : <p>Não vinculado</p>}</div>
        <div><p className="text-xs text-muted-foreground">Ordem de Serviço</p>{simulation.serviceOrderSnapshot ? <Link className="font-medium text-primary hover:underline" href={`/dashboard/ordens/${simulation.serviceOrderSnapshot.id}`}>{simulation.serviceOrderSnapshot.number} · {simulation.serviceOrderSnapshot.title}</Link> : <p>Não vinculada</p>}</div>
      </section>
      <PricingCommercialDivergences simulation={simulation} />
      <PricingVersionComparison simulation={simulation} />
      <div className="grid gap-3 xl:grid-cols-[1.4fr_0.6fr]">
        <section className="rounded-xl border bg-card">
          <div className="border-b p-4">
            <h2 className="text-sm font-semibold">Composição de custos</h2>
          </div>
          <TableFrame className="rounded-none border-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Unitário</TableHead>
                  <TableHead className="text-right">Perda</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {simulation.costComponents.map((component) => (
                  <TableRow key={component.id}>
                    <TableCell>{component.type}</TableCell>
                    <TableCell>
                      {component.description}
                      <p className="text-[11px] text-muted-foreground">
                        {component.calculationMode} · {component.sourceType.toLowerCase()}
                      </p>
                      {component.stockItemId ? (
                        <span className="flex gap-2">
                          <Link
                            className="text-xs text-primary hover:underline"
                            href={`/dashboard/estoque/${component.stockItemId}`}
                          >
                            Abrir item do Estoque
                          </Link>
                          <button
                            type="button"
                            className="text-xs text-primary hover:underline"
                            onClick={() => {
                              setReplaceComponentId(component.id);
                              setMaterialOpen(true);
                            }}
                          >
                            Substituir material
                          </button>
                        </span>
                      ) : null}
                      {component.equipmentId ? (
                        <span className="flex gap-2">
                          <Link
                            className="text-xs text-primary hover:underline"
                            href={`/dashboard/equipamentos/${component.equipmentId}`}
                          >
                            Abrir equipamento
                          </Link>
                          <button
                            type="button"
                            className="text-xs text-primary hover:underline"
                            onClick={() => {
                              setReplaceComponentId(component.id);
                              setEquipmentOpen(true);
                            }}
                          >
                            Substituir equipamento
                          </button>
                        </span>
                      ) : null}
                      {component.sourceSnapshot ? (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Snapshot em{" "}
                          {new Date(component.sourceSnapshot.capturedAt).toLocaleString(
                            "pt-BR",
                          )}
                          {component.sourceSnapshot.availableQuantity !== undefined
                            ? ` · disponível: ${(component.sourceSnapshot.availableQuantity / (component.sourceSnapshot.unitScale ?? 1)).toLocaleString("pt-BR")} ${component.sourceSnapshot.unit ?? ""}`
                            : ""}
                          {component.sourceCostCents !== undefined
                            ? ` · origem: ${money.format(component.sourceCostCents / 100)}`
                            : ""}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      {(
                        component.quantity /
                        (component.sourceSnapshot?.kind === "STOCK"
                          ? (component.sourceSnapshot.unitScale ?? 1)
                          : 1)
                      ).toLocaleString("pt-BR")}{" "}
                      {component.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      {money.format(component.unitCostCents / 100)}
                    </TableCell>
                    <TableCell className="text-right">
                      {((component.wastePercentBasisPoints ?? 0) / 100).toLocaleString(
                        "pt-BR",
                      )}
                      %
                    </TableCell>
                    <TableCell className="text-right">
                      {money.format(component.totalCostCents / 100)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableFrame>
        </section>
        <section className="rounded-xl border bg-card p-4">
          <h2 className="text-sm font-semibold">Resultado</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row
              label="Custo direto"
              value={money.format(result.directCostCents / 100)}
            />
            <Row label="Overhead" value={money.format(result.overheadCents / 100)} />
            <Row label="Impostos" value={money.format(result.taxCents / 100)} />
            <Row label="Comissão" value={money.format(result.commissionCents / 100)} />
            <Row label="Lucro" value={money.format(result.profitCents / 100)} />
            <Row
              label="Margem efetiva"
              value={`${(result.effectiveMarginBasisPoints / 100).toLocaleString("pt-BR")}%`}
            />
            <Row
              label="Markup equivalente"
              value={`${(result.markupBasisPoints / 100).toLocaleString("pt-BR")}%`}
            />
            <Row label="Indicador" value={result.indicator} />
          </dl>
        </section>
      </div>
      <PricingCostDivergences
        simulation={simulation}
        divergences={divergences}
        busy={busy}
        onReview={async (componentId, update) => {
          setBusy(true);
          const response = await reviewPricingSourceAction(
            simulation.id,
            componentId,
            update,
            update ? "Atualização confirmada no detalhe." : "Valor mantido pelo usuário.",
          );
          if (response.ok) {
            setSimulation(response.data);
            setSuccess(
              update
                ? "Snapshot atualizado e revisão criada."
                : "Decisão registrada sem alterar o custo.",
            );
            await load();
          } else setError(response.error.message);
          setBusy(false);
        }}
      />
      <PricingReversePricing simulation={simulation} />
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-4">
          <h2 className="text-sm font-semibold">Revisões imutáveis</h2>
          <ol className="mt-3 space-y-2">
            {[...simulation.revisions].reverse().map((revision) => (
              <li key={revision.version} className="rounded-lg border p-3 text-sm">
                <div className="flex justify-between">
                  <strong>Versão {revision.version}</strong>
                  <time className="text-xs text-muted-foreground">
                    {new Date(revision.createdAt).toLocaleString("pt-BR")}
                  </time>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {revision.origin} ·{" "}
                  {money.format(revision.resultSnapshot.promotionalPriceCents / 100)}
                </p>
              </li>
            ))}
          </ol>
        </section>
        <section className="rounded-xl border bg-card p-4">
          <h2 className="text-sm font-semibold">Histórico</h2>
          <ol className="mt-3 space-y-2">
            {[...simulation.history].reverse().map((event) => (
              <li
                key={event.id}
                className="flex justify-between gap-3 border-b pb-2 text-sm"
              >
                <span>{event.description}</span>
                <time className="text-xs text-muted-foreground">
                  {new Date(event.createdAt).toLocaleString("pt-BR")}
                </time>
              </li>
            ))}
          </ol>
        </section>
      </div>
      {simulation.applications.length ? <section className="rounded-xl border bg-card p-4"><h2 className="text-sm font-semibold">Histórico comercial</h2><ol className="mt-3 space-y-2">{[...simulation.applications].reverse().map((item) => <li key={item.id} className="flex flex-wrap justify-between gap-2 border-b pb-2 text-sm"><span>v{item.simulationVersion} · {item.priceType} · {money.format(item.priceCents / 100)}{item.supersededAt ? " · substituída" : " · vigente"}</span><time className="text-xs text-muted-foreground">{new Date(item.appliedAt).toLocaleString("pt-BR")}</time></li>)}</ol></section> : null}
      <PricingSimulationDialog
        open={editing}
        simulation={simulation}
        templates={[]}
        laborProfiles={[]}
        busy={busy}
        error={error}
        onClose={() => setEditing(false)}
        onSave={save}
      />
      <PricingMaterialDialog
        open={materialOpen}
        items={stock}
        busy={busy}
        onClose={() => {
          setMaterialOpen(false);
          setReplaceComponentId(undefined);
        }}
        onSave={async (input) => {
          setBusy(true);
          const response = await addStockPricingMaterialAction({
            simulationId: simulation.id,
            ...input,
            replaceComponentId,
          });
          if (response.ok) {
            setSimulation(response.data);
            setMaterialOpen(false);
            setSuccess("Material do Estoque adicionado com snapshot técnico.");
            await load();
          } else setError(response.error.message);
          setBusy(false);
        }}
      />
      <PricingEquipmentDialog
        open={equipmentOpen}
        items={equipment}
        busy={busy}
        onClose={() => {
          setEquipmentOpen(false);
          setReplaceComponentId(undefined);
        }}
        onSave={async (input) => {
          setBusy(true);
          const response = await addRealPricingEquipmentAction({
            simulationId: simulation.id,
            ...input,
            replaceComponentId,
          });
          if (response.ok) {
            setSimulation(response.data);
            setEquipmentOpen(false);
            setSuccess("Equipamento real adicionado com snapshot técnico.");
            await load();
          } else setError(response.error.message);
          setBusy(false);
        }}
      />
      <PricingRelationsDialog open={relationsOpen} clients={clients} leads={leads} orders={orders} initial={{ clientId: simulation.clientId, crmLeadId: simulation.crmLeadId, serviceOrderId: simulation.serviceOrderId }} busy={busy} onClose={() => setRelationsOpen(false)} onSave={async (value) => { setBusy(true); const response = await linkPricingCommercialAction(simulation.id, value); if (response.ok) { setSimulation(response.data); setRelationsOpen(false); setSuccess("Vínculos comerciais atualizados."); await load(); } else setError(response.error.message); setBusy(false); }} />
      <PricingApplicationDialog open={applicationOpen} updating={Boolean(simulation.appliedVersion)} result={result} orderPriceCents={simulation.serviceOrderSnapshot?.currentPriceCents ?? 0} busy={busy} onClose={() => setApplicationOpen(false)} onApply={async (input) => { setBusy(true); const response = await applyPricingToOrderAction(simulation.id, input); if (response.ok) { setSimulation(response.data); setApplicationOpen(false); setSuccess("Preço aplicado à Ordem com snapshot imutável."); await load(); } else setError(response.error.message); setBusy(false); }} />
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b pb-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
