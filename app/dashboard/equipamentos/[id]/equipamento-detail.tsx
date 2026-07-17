"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Package, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderHeading,
  PageHeaderIcon,
  PageHeaderIdentity,
} from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import {
  cancelEquipmentMaintenanceAction,
  completeEquipmentMaintenanceAction,
  createEquipmentMaintenanceAction,
  createEquipmentAcquisitionFinancialAction,
  createEquipmentMaintenanceFinancialAction,
  getEquipmentFinancialSummaryAction,
  listEquipmentFinancialAccountsAction,
  reviewEquipmentFinancialAction,
  cancelEquipmentFinancialBalanceAction,
  linkEquipmentClientAction,
  linkEquipmentServiceOrderAction,
  listEquipmentClientsAction,
  listEquipmentServiceOrdersAction,
  listEquipmentStateAction,
  removeEquipmentWarrantyAction,
  startEquipmentMaintenanceAction,
  unlinkEquipmentClientAction,
  unlinkEquipmentServiceOrderAction,
  updateEquipmentAction,
  updateEquipmentMaintenanceAction,
  updateEquipmentWarrantyAction,
} from "../equipamentos-actions";
import { EquipmentClientDialog } from "../equipamento-client-dialog";
import { EquipmentFormDrawer } from "../equipamento-form-drawer";
import { EquipmentMaintenanceDrawer } from "../equipamento-maintenance-drawer";
import { EquipmentMaintenanceList } from "../equipamento-maintenance-list";
import { EquipmentServiceOrderDialog } from "../equipamento-service-order-dialog";
import { EquipmentWarrantyDrawer } from "../equipamento-warranty-drawer";
import { EquipmentFinancialDialog } from "../equipamento-financial-dialog";
import { EquipmentFinancialComplementDialog } from "../equipamento-financial-complement-dialog";
import { EquipmentFinancialSummary } from "../equipamento-financial-summary";
import { EquipmentFinancialDivergences } from "../equipamento-financial-divergences";
import {
  assetTypeLabels,
  conditionLabels,
  ownershipLabels,
  statusLabels,
} from "../equipamentos-data";
import type {
  EquipmentClientReference,
  EquipmentServiceOrderReference,
} from "../equipamentos-relations-gateway";
import type {
  EquipmentFormValues,
  MaintenanceFormValues,
  WarrantyFormValues,
  EquipmentFinancialFormValues,
} from "../equipamentos-schema";
import type { EquipmentFinancialAccountReference } from "@/lib/contracts/financeiro.contract";
import type { EquipmentFinanceiroTransaction } from "../equipamentos-financeiro-gateway";
import {
  depreciation,
  equipmentIndicators,
  warrantyStatus,
} from "../equipamentos-selectors";
import { ptBrLabel } from "@/lib/pt-br-labels";
import type {
  AssetStatus,
  EquipmentStorageState,
  MaintenanceRecord,
  EquipmentFinancialReconciliationStatus,
} from "../equipamentos-types";

type FinancialSummaryState = {
  acquisition: EquipmentFinanceiroTransaction | null;
  acquisitionReconciliation: EquipmentFinancialReconciliationStatus | null;
  maintenances: { maintenanceId: string; transaction: EquipmentFinanceiroTransaction | null; reconciliation: EquipmentFinancialReconciliationStatus }[];
};

const money = (c: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(c / 100);
const date = (v?: string) =>
  v
    ? new Intl.DateTimeFormat("pt-BR").format(
        new Date(v.length === 10 ? `${v}T12:00:00` : v),
      )
    : "Não informado";
const warrantyLabels = {
  NOT_INFORMED: "Não informada",
  ACTIVE: "Ativa",
  EXPIRING_SOON: "Próxima do vencimento",
  EXPIRED: "Expirada",
} as const;

export function EquipmentDetail({ id }: { id: string }) {
  const [state, setState] = useState<EquipmentStorageState | null>(null),
    [clients, setClients] = useState<EquipmentClientReference[]>([]),
    [orders, setOrders] = useState<EquipmentServiceOrderReference[]>([]),
    [financialAccounts, setFinancialAccounts] = useState<EquipmentFinancialAccountReference[]>([]),
    [financialSummary, setFinancialSummary] = useState<FinancialSummaryState | null>(null);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [busyId, setBusyId] = useState<string>(),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(false),
    [clientDialog, setClientDialog] = useState(false),
    [orderDialog, setOrderDialog] = useState(false),
    [maintenanceDrawer, setMaintenanceDrawer] = useState(false),
    [warrantyDrawer, setWarrantyDrawer] = useState(false),
    [maintenance, setMaintenance] = useState<MaintenanceRecord | null>(null),
    [financialTarget, setFinancialTarget] = useState<{ kind: "acquisition" | "maintenance"; maintenance?: MaintenanceRecord; complement?: boolean } | null>(null);
  const load = useCallback(async () => {
    const result = await listEquipmentStateAction();
    if (result.ok) {
      setState(result.data);
      setError("");
      const summary = await getEquipmentFinancialSummaryAction(id);
      if (summary.ok) setFinancialSummary(summary.data);
    } else setError(result.error.message);
    setLoading(false);
  }, [id]);
  useEffect(() => {
    queueMicrotask(() => void load());
    void listEquipmentClientsAction().then((result) => {
      if (result.ok) setClients(result.data);
    });
    void listEquipmentServiceOrdersAction().then((result) => {
      if (result.ok) setOrders(result.data);
    });
    void listEquipmentFinancialAccountsAction().then((result) => { if (result.ok) setFinancialAccounts(result.data); });
  }, [load]);
  const asset = state?.assets.find((item) => item.id === id) ?? null;
  if (loading) return <div className="h-80 animate-pulse rounded-xl bg-muted" />;
  if (!asset)
    return (
      <EmptyState
        title="Equipamento não encontrado"
        description={error}
        action={
          <Button asChild>
            <Link href="/dashboard/equipamentos">Voltar</Link>
          </Button>
        }
      />
    );
  const records = state?.maintenanceRecords.filter((item) => item.assetId === id) ?? [];
  const links = state?.serviceOrderLinks.filter((item) => item.assetId === id) ?? [];
  const activeLinks = links.filter((item) => !item.unlinkedAt);
  const indicators = equipmentIndicators(asset, records),
    depreciationInfo = depreciation(asset),
    guarantee = warrantyStatus(asset);
  async function run(
    operation: () => Promise<{ ok: boolean; error?: { message: string } }>,
    success: string,
    close?: () => void,
  ) {
    setBusy(true);
    setError("");
    const result = await operation();
    if (result.ok) {
      await load();
      setNotice(success);
      close?.();
    } else setError(result.error?.message ?? "Não foi possível concluir a operação.");
    setBusy(false);
  }
  async function runRecord(
    record: MaintenanceRecord,
    operation: () => Promise<{ ok: boolean; error?: { message: string } }>,
    success: string,
  ) {
    setBusyId(record.id);
    await run(operation, success);
    setBusyId(undefined);
  }
  const saveAsset = (value: EquipmentFormValues) =>
    run(
      () => updateEquipmentAction(id, value),
      "Equipamento atualizado.",
      () => setEditing(false),
    );
  const saveMaintenance = (value: MaintenanceFormValues) =>
    run(
      () =>
        maintenance
          ? updateEquipmentMaintenanceAction(maintenance.id, value)
          : createEquipmentMaintenanceAction(id, value),
      maintenance ? "Manutenção atualizada." : "Manutenção registrada.",
      () => {
        setMaintenanceDrawer(false);
        setMaintenance(null);
      },
    );
  const saveWarranty = (value: WarrantyFormValues) =>
    run(
      () => updateEquipmentWarrantyAction(id, value),
      "Garantia atualizada.",
      () => setWarrantyDrawer(false),
    );
  const saveFinancial = async (value: EquipmentFinancialFormValues) => {
    if (!financialTarget) return;
    setBusy(true); setError("");
    const sequence = financialTarget.complement
      ? asset.history.filter((item) => item.type === "FINANCIAL_COMPLEMENT").length + 1
      : undefined;
    const result = financialTarget.kind === "acquisition"
      ? await createEquipmentAcquisitionFinancialAction(id, value, sequence)
      : await createEquipmentMaintenanceFinancialAction(financialTarget.maintenance!.id, value, sequence);
    if (result.ok) {
      setNotice(result.data.existing ? "Lançamento existente localizado." : financialTarget.complement ? "Complemento financeiro criado." : "Lançamento financeiro criado.");
      setFinancialTarget(null);
      await load();
      if (result.data.existing) window.location.assign(`/dashboard/financeiro/${result.data.transaction.id}`);
    } else setError(result.error.message);
    setBusy(false);
  };
  const reviewFinancial = (maintenanceId: string | undefined, snapshot: boolean) => {
    const notes = window.prompt("Observação da reconciliação:", snapshot ? "Snapshot conferido e atualizado." : "Divergência revisada.");
    if (notes === null) return;
    void run(() => reviewEquipmentFinancialAction(id, maintenanceId, notes, snapshot), snapshot ? "Snapshot atualizado." : "Reconciliação revisada.");
  };
  const cancelFinancialBalance = (transactionId: string, maintenanceId?: string) => {
    if (window.confirm("Cancelar somente o saldo aberto? Pagamentos existentes serão preservados."))
      void run(() => cancelEquipmentFinancialBalanceAction(id, transactionId, maintenanceId), "Saldo aberto cancelado.");
  };
  return (
    <div className="space-y-3">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderIdentity>
            <PageHeaderIcon>
              <Package className="h-5 w-5" />
            </PageHeaderIcon>
            <PageHeaderHeading
              title={`${asset.internalCode} · ${asset.name}`}
              description={asset.description || "Ficha patrimonial e técnica do ativo."}
            />
          </PageHeaderIdentity>
          <PageHeaderActions>
            <Button asChild variant="secondary">
              <Link href="/dashboard/equipamentos">
                <ArrowLeft className="h-4 w-4" />
                Equipamentos
              </Link>
            </Button>
            {!asset.archivedAt ? (
              <Button onClick={() => setEditing(true)}>Editar</Button>
            ) : null}
          </PageHeaderActions>
        </PageHeaderContent>
      </PageHeader>
      {notice ? (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
        >
          {notice}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
        >
          {error}
        </p>
      ) : null}
      {asset.archivedAt ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          Arquivado em {date(asset.archivedAt)}. {asset.archiveReason}
        </p>
      ) : null}
      <Card>
        <CardHeader>
          <SectionHeader compact title="Alertas derivados" />
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Flag active={indicators.critical} label="Crítico" />
          <Flag active={indicators.maintenanceOverdue} label="Manutenção vencida" />
          <Flag active={indicators.maintenanceDueSoon} label="Manutenção próxima" />
          <Flag active={indicators.underMaintenance} label="Em manutenção" />
          <Flag active={indicators.warrantyExpired} label="Garantia expirada" />
          <Flag active={indicators.warrantyExpiring} label="Garantia a vencer" />
          <Flag active={indicators.fullyDepreciated} label="Totalmente depreciado" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <SectionHeader compact title="Identificação e operação" />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Info l="Tipo" v={assetTypeLabels[asset.assetType]} />
          <Info l="Categoria" v={asset.category} />
          <Info
            l="Fabricante/modelo"
            v={`${asset.manufacturer || "Não informado"} · ${asset.model || "Não informado"}`}
          />
          <Info
            l="Série/patrimônio"
            v={`${asset.serialNumber || "Não informado"} · ${asset.patrimonyNumber || "Não aplicável"}`}
          />
          <Info l="Propriedade" v={ownershipLabels[asset.ownership]} />
          <Info l="Responsável" v={asset.responsible || "Não informado"} />
          <Info
            l="Localização"
            v={[asset.location.name, asset.location.room, asset.location.container]
              .filter(Boolean)
              .join(" · ")}
          />
          <div>
            <p className="text-xs text-muted-foreground">Estado</p>
            <div className="flex gap-2">
              <Badge variant={indicators.critical ? "destructive" : "neutral"}>
                {statusLabels[asset.status]}
              </Badge>
              <Badge variant="outline">{conditionLabels[asset.condition]}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-3 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <SectionHeader
              compact
              title="Proprietário ou cliente"
              actions={
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={Boolean(asset.archivedAt)}
                  onClick={() => setClientDialog(true)}
                >
                  {asset.clientId ? "Alterar vínculo" : "Vincular cliente"}
                </Button>
              }
            />
          </CardHeader>
          <CardContent>
            {asset.clientId ? (
              <div>
                <p className="font-semibold">{asset.clientNameSnapshot}</p>
                <Link
                  className="text-sm text-primary hover:underline"
                  href={`/dashboard/clientes/${asset.clientId}`}
                >
                  Abrir ficha do cliente
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sem cliente vinculado. Propriedade atual:{" "}
                {ownershipLabels[asset.ownership]}.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <SectionHeader
              compact
              title="Garantia"
              actions={
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={Boolean(asset.archivedAt)}
                  onClick={() => setWarrantyDrawer(true)}
                >
                  Editar garantia
                </Button>
              }
            />
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Info l="Situação" v={warrantyLabels[guarantee]} />
            <Info
              l="Período"
              v={`${date(asset.warranty?.startDate)} · ${date(asset.warranty?.endDate)}`}
            />
            <Info l="Fornecedor" v={asset.warranty?.supplier || "Não informado"} />
            <Info
              l="Documento"
              v={asset.warranty?.documentReference || "Não informado"}
            />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <SectionHeader
            compact
            title="Ordens de Serviço vinculadas"
            actions={
              <Button
                size="sm"
                disabled={Boolean(asset.archivedAt)}
                onClick={() => setOrderDialog(true)}
              >
                <Plus className="h-4 w-4" />
                Vincular OS
              </Button>
            }
          />
        </CardHeader>
        <CardContent>
          {activeLinks.length ? (
            <div className="divide-y">
              {activeLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <Link
                      className="font-semibold text-primary hover:underline"
                      href={`/dashboard/ordens/${link.serviceOrderId}`}
                    >
                      {link.serviceOrderNumberSnapshot} · {link.serviceOrderTitleSnapshot}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {link.purpose || "Vínculo técnico"} · vinculado em{" "}
                      {date(link.linkedAt)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm("Desvincular esta Ordem preservando o histórico?")
                      )
                        void run(
                          () => unlinkEquipmentServiceOrderAction(id, link.id),
                          "Ordem desvinculada.",
                        );
                    }}
                  >
                    Desvincular
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nenhuma OS vinculada"
              description="Vínculos técnicos serão preservados mesmo após a desvinculação."
            />
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <SectionHeader
            compact
            title="Manutenções"
            actions={
              <Button
                size="sm"
                disabled={Boolean(asset.archivedAt)}
                onClick={() => {
                  setMaintenance(null);
                  setMaintenanceDrawer(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Registrar manutenção
              </Button>
            }
          />
        </CardHeader>
        <CardContent>
          <EquipmentMaintenanceList
            records={records}
            busyId={busyId}
            onEdit={(record) => {
              setMaintenance(record);
              setMaintenanceDrawer(true);
            }}
            onStart={(record) =>
              void runRecord(
                record,
                () => startEquipmentMaintenanceAction(record.id),
                "Manutenção iniciada e ativo atualizado.",
              )
            }
            onComplete={(record) => {
              const status = (window.prompt(
                "Novo status do ativo: AVAILABLE, IN_USE, INACTIVE ou RETIRED",
                "AVAILABLE",
              ) ?? "") as AssetStatus;
              if (["AVAILABLE", "IN_USE", "INACTIVE", "RETIRED"].includes(status))
                void runRecord(
                  record,
                  () => completeEquipmentMaintenanceAction(record.id, status),
                  "Manutenção concluída.",
                );
            }}
            onCancel={(record) => {
              if (window.confirm("Cancelar esta manutenção preservando o registro?"))
                void runRecord(
                  record,
                  () => cancelEquipmentMaintenanceAction(record.id),
                  "Manutenção cancelada.",
                );
            }}
            onFinancial={(record) => record.financialTransactionId ? window.location.assign(`/dashboard/financeiro/${record.financialTransactionId}`) : setFinancialTarget({ kind: "maintenance", maintenance: record })}
          />
        </CardContent>
      </Card>
      {financialSummary?.maintenances.length ? <Card><CardHeader><SectionHeader compact title="Financeiro das manutenções" /></CardHeader><CardContent className="space-y-5">{financialSummary.maintenances.map((item) => { const record = records.find((entry) => entry.id === item.maintenanceId); if (!record || !item.transaction) return <EquipmentFinancialDivergences key={item.maintenanceId} status="FINANCIAL_UNAVAILABLE" />; return <div key={item.maintenanceId} className="space-y-2 border-b pb-4 last:border-0"><p className="font-semibold">{record.title}</p><EquipmentFinancialDivergences status={item.reconciliation} /><EquipmentFinancialSummary transaction={item.transaction} technicalCents={record.costCents} reconciliation={item.reconciliation} onComplement={() => setFinancialTarget({ kind: "maintenance", maintenance: record, complement: true })} onCancelBalance={() => cancelFinancialBalance(item.transaction!.id, record.id)} onReview={(snapshot) => reviewFinancial(record.id, snapshot)} /></div>; })}</CardContent></Card> : null}
      <Card>
        <CardHeader>
          <SectionHeader compact title="Aquisição e depreciação" actions={<Button size="sm" disabled={Boolean(asset.archivedAt) || asset.acquisition.acquisitionValueCents <= 0} onClick={() => asset.acquisitionFinancial ? window.location.assign(`/dashboard/financeiro/${asset.acquisitionFinancial.financialTransactionId}`) : setFinancialTarget({ kind: "acquisition" })}>{asset.acquisitionFinancial ? "Abrir lançamento" : "Gerar investimento ou despesa"}</Button>} />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Info l="Aquisição" v={date(asset.acquisition.acquisitionDate)} />
          <Info
            l="Valor de aquisição"
            v={money(asset.acquisition.acquisitionValueCents)}
          />
          <Info
            l="Modo"
            v={asset.depreciation.mode === "LINEAR" ? "Linear" : "Não depreciável"}
          />
          <Info
            l="Valor atual derivado"
            v={
              asset.ownership === "COMPANY"
                ? money(depreciationInfo.currentValueCents)
                : "Não compõe patrimônio próprio"
            }
          />
          <Info l="Depreciação acumulada" v={money(depreciationInfo.accumulatedCents)} />
          <Info l="Valor residual" v={money(asset.depreciation.residualValueCents)} />
          <Info
            l="Vida útil"
            v={
              asset.depreciation.usefulLifeMonths
                ? `${asset.depreciation.usefulLifeMonths} meses`
                : "Não aplicável"
            }
          />
          <Info l="Fornecedor" v={asset.acquisition.supplier || "Não informado"} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><SectionHeader compact title="Resumo financeiro da aquisição" /></CardHeader>
        <CardContent>
          {financialSummary?.acquisition && financialSummary.acquisitionReconciliation ? <div className="space-y-3"><EquipmentFinancialDivergences status={financialSummary.acquisitionReconciliation} /><EquipmentFinancialSummary transaction={financialSummary.acquisition} technicalCents={asset.acquisition.acquisitionValueCents} reconciliation={financialSummary.acquisitionReconciliation} onComplement={() => setFinancialTarget({ kind: "acquisition", complement: true })} onCancelBalance={() => cancelFinancialBalance(financialSummary.acquisition!.id)} onReview={(snapshot) => reviewFinancial(undefined, snapshot)} /></div> : <EmptyState title="Aquisição sem lançamento financeiro" description="A geração é sempre explícita e não ocorre no cadastro do equipamento." />}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <SectionHeader compact title="Fotos e documentos (metadados)" />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Media title="Fotos" items={asset.photos.map((item) => item.name)} />
          <Media title="Documentos" items={asset.documents.map((item) => item.name)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <SectionHeader compact title="Histórico técnico" />
        </CardHeader>
        <CardContent className="divide-y">
          {[...asset.history].reverse().map((event) => (
            <div key={event.id} className="flex justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium">{event.message}</p>
                <p className="text-xs text-muted-foreground">
                  {ptBrLabel(event.type)} · {ptBrLabel(event.origin)}
                </p>
              </div>
              <time className="text-xs text-muted-foreground">
                {new Intl.DateTimeFormat("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(new Date(event.createdAt))}
              </time>
            </div>
          ))}
        </CardContent>
      </Card>
      <EquipmentFormDrawer
        open={editing}
        asset={asset}
        busy={busy}
        error={error}
        onClose={() => setEditing(false)}
        onSubmit={saveAsset}
      />
      <EquipmentClientDialog
        open={clientDialog}
        clients={clients}
        currentId={asset.clientId}
        busy={busy}
        onClose={() => setClientDialog(false)}
        onLink={(clientId) =>
          run(
            () => linkEquipmentClientAction(id, clientId),
            "Cliente vinculado.",
            () => setClientDialog(false),
          )
        }
        onUnlink={() =>
          run(
            () => unlinkEquipmentClientAction(id),
            "Cliente desvinculado.",
            () => setClientDialog(false),
          )
        }
      />
      <EquipmentServiceOrderDialog
        open={orderDialog}
        orders={orders}
        busy={busy}
        onClose={() => setOrderDialog(false)}
        onLink={(orderId, purpose) =>
          run(
            () => linkEquipmentServiceOrderAction(id, orderId, purpose),
            "Ordem vinculada.",
            () => setOrderDialog(false),
          )
        }
      />
      <EquipmentMaintenanceDrawer
        open={maintenanceDrawer}
        record={maintenance}
        orders={orders}
        busy={busy}
        error={error}
        onClose={() => {
          setMaintenanceDrawer(false);
          setMaintenance(null);
        }}
        onSubmit={saveMaintenance}
      />
      <EquipmentWarrantyDrawer
        open={warrantyDrawer}
        warranty={asset.warranty}
        busy={busy}
        error={error}
        onClose={() => setWarrantyDrawer(false)}
        onSubmit={saveWarranty}
        onRemove={() =>
          run(
            () => removeEquipmentWarrantyAction(id),
            "Garantia removida.",
            () => setWarrantyDrawer(false),
          )
        }
      />
      <EquipmentFinancialDialog open={Boolean(financialTarget && !financialTarget.complement)} title={financialTarget?.kind === "maintenance" ? "Gerar despesa da manutenção" : "Gerar lançamento da aquisição"} maintenance={financialTarget?.kind === "maintenance"} accounts={financialAccounts} busy={busy} error={error} onClose={() => setFinancialTarget(null)} onSubmit={saveFinancial} />
      <EquipmentFinancialComplementDialog open={Boolean(financialTarget?.complement)} title="Criar complemento financeiro" maintenance={financialTarget?.kind === "maintenance"} accounts={financialAccounts} busy={busy} error={error} onClose={() => setFinancialTarget(null)} onSubmit={saveFinancial} />
    </div>
  );
}
function Info({ l, v }: { l: string; v: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{l}</p>
      <p className="font-medium">{v}</p>
    </div>
  );
}
function Flag({ active, label }: { active: boolean; label: string }) {
  return (
    <Badge variant={active ? "warning" : "neutral"}>
      {label}: {active ? "sim" : "não"}
    </Badge>
  );
}
function Media({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      {items.length ? (
        <ul className="mt-2 space-y-1 text-sm">
          {items.map((item) => (
            <li key={item} className="rounded border p-2">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Nenhum metadado cadastrado.</p>
      )}
    </div>
  );
}
