"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  CalendarDays,
  CheckCircle2,
  FileText,
  FolderKanban,
  LoaderCircle,
  PackageCheck,
  ReceiptText,
  Settings2,
  Users,
  Wrench,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { ActionCenter } from "@/components/ui/action-center";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  MetricItem,
  MetricStrip,
} from "@/components/ui/metric-strip";
import { OperationalInsights } from "@/components/ui/operational-insights";
import { OperationalTimeline } from "@/components/ui/operational-timeline";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderHeading,
  PageHeaderIdentity,
} from "@/components/ui/page-header";
import { QuickActions } from "@/components/ui/quick-actions";
import { SectionHeader } from "@/components/ui/section-header";
import { Table, TableBody, TableCell, TableFrame, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  formatCurrencyBRLFromReais,
  formatDateBR,
  formatDateTimeBR,
  formatNumberBR,
  formatPercentageFromBasisPoints,
} from "@/lib/br-formatters";
import { ptBrLabel } from "@/lib/pt-br-labels";
import { OrdemChecklist } from "@/app/dashboard/ordens/ordem-checklist";
import {
  loadProjetoWorkspace,
  saveProjetoChecklist,
  type ProjetoWorkspaceSnapshot,
} from "./projeto-workspace-gateway";

const tabs = [
  "Visão Geral",
  "Cronograma",
  "Ordens",
  "Financeiro",
  "Materiais",
  "Equipamentos",
  "Checklist",
  "Timeline",
  "Automações",
  "Arquivos",
  "Custos",
  "Rentabilidade",
] as const;
type WorkspaceTab = (typeof tabs)[number];

export function ProjetoWorkspace({ id }: { id: string }) {
  const [snapshot, setSnapshot] = useState<ProjetoWorkspaceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [savingChecklist, setSavingChecklist] = useState(false);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("Visão Geral");

  useEffect(() => {
    let active = true;
    void loadProjetoWorkspace(id)
      .then((result) => {
        if (!active) return;
        setSnapshot(result);
        setNotFound(!result);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading)
    return (
      <div className="grid min-h-[28rem] place-items-center" aria-label="Carregando workspace operacional">
        <LoaderCircle className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  if (notFound || !snapshot)
    return (
      <EmptyState
        title="Ordem de Serviço não encontrada"
        description="O workspace solicitado não está disponível ou a Ordem foi removida."
        action={<Button asChild><Link href="/dashboard/ordens">Voltar para Ordens</Link></Button>}
      />
    );

  const { order } = snapshot;
  const progress = snapshot.progress.total;
  const expectedProfit =
    snapshot.pricing?.profitCents ??
    Math.round(order.estimatedValue * 100) - snapshot.financial.expenseCents;

  return (
    <div className="space-y-4">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderIdentity>
            <FolderKanban className="h-5 w-5" />
            <PageHeaderHeading
              title={`${order.orderNumber} · ${order.clientName}`}
              description={`${ptBrLabel(order.category)} · ${order.title}`}
            />
          </PageHeaderIdentity>
          <PageHeaderActions>
            <Badge variant="outline">{ptBrLabel(order.status)}</Badge>
            <Button asChild size="sm" variant="secondary">
              <Link href={`/dashboard/ordens/${order.id}`}>
                <ArrowLeft className="h-4 w-4" />
                Abrir Ordem
              </Link>
            </Button>
          </PageHeaderActions>
        </PageHeaderContent>
      </PageHeader>

      {snapshot.partial.length ? (
        <p role="status" className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Dados parciais em: {snapshot.partial.join(", ")}.
        </p>
      ) : null}

      <MetricStrip>
        <MetricItem label="Cliente" value={order.clientName} />
        <MetricItem label="Status" value={ptBrLabel(order.status)} />
        <MetricItem label="Progresso" value={formatPercentageFromBasisPoints(progress * 100)} />
        <MetricItem label="Valor" value={formatCurrencyBRLFromReais(order.estimatedValue)} />
        <MetricItem label="Lucro previsto" value={formatCurrencyBRLFromReais(expectedProfit / 100)} />
        <MetricItem label="Prazo" value={formatDateBR(order.scheduledDate)} />
      </MetricStrip>

      <nav aria-label="Áreas do workspace" className="overflow-x-auto rounded-xl border bg-card">
        <div className="flex min-w-max gap-1 p-1.5">
          {tabs.map((tab) => (
            <Button
              key={tab}
              type="button"
              size="sm"
              variant={activeTab === tab ? "default" : "ghost"}
              aria-current={activeTab === tab ? "page" : undefined}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </Button>
          ))}
        </div>
      </nav>

      <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <main className="min-w-0">
          <WorkspaceContent
            activeTab={activeTab}
            snapshot={snapshot}
            progress={progress}
            savingChecklist={savingChecklist}
            onChecklistSave={async (items) => {
              setSavingChecklist(true);
              try {
                await saveProjetoChecklist(id, items);
                setSnapshot(await loadProjetoWorkspace(id));
              } finally {
                setSavingChecklist(false);
              }
            }}
          />
        </main>
        <aside className="space-y-4">
          <QuickActions
            title="Ações rápidas"
            description="Continue o fluxo mantendo o contexto desta Ordem."
            actions={[
              { label: "Editar Ordem", href: `/dashboard/ordens/${id}` },
              { label: "Ver cliente", href: `/dashboard/clientes/${order.clientId}` },
              { label: "Abrir Agenda", href: "/dashboard/agenda" },
              { label: "Abrir Financeiro", href: "/dashboard/financeiro" },
            ]}
          />
          <OperationalInsights insights={snapshot.insights} />
          <ActionCenter insights={snapshot.insights} />
        </aside>
      </div>
    </div>
  );
}

function WorkspaceContent({
  activeTab,
  snapshot,
  progress,
  savingChecklist,
  onChecklistSave,
}: {
  activeTab: WorkspaceTab;
  snapshot: ProjetoWorkspaceSnapshot;
  progress: number;
  savingChecklist: boolean;
  onChecklistSave: (
    items: ProjetoWorkspaceSnapshot["order"]["checklist"],
  ) => Promise<void>;
}) {
  const { order } = snapshot;
  if (activeTab === "Timeline")
    return <OperationalTimeline serviceOrderId={order.id} sourceId={order.id} limit={30} />;
  if (activeTab === "Visão Geral")
    return (
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Resumo operacional" icon={<Wrench className="h-4 w-4" />}>
          <InfoGrid items={[
            ["Cliente", order.clientName],
            ["Tipo de serviço", ptBrLabel(order.category)],
            ["Status", ptBrLabel(order.status)],
            ["Progresso", formatPercentageFromBasisPoints(progress * 100)],
            ["Responsável", order.technician || "Não definido"],
            ["Equipe", order.teamMembers?.join(", ") || order.technician || "Não definida"],
            ["Início previsto", `${formatDateBR(order.scheduledDate)} às ${order.scheduledTime}`],
            ["Duração estimada", `${formatNumberBR(order.estimatedDurationMinutes / 60, 1)} h`],
            ["Duração realizada", `${formatNumberBR(order.execution?.accumulatedMinutes ? order.execution.accumulatedMinutes / 60 : 0, 1)} h`],
            ["Pendências", formatNumberBR(order.checklist.filter((item) => !["COMPLETED", "SKIPPED"].includes(item.status)).length + snapshot.insights.length, 0)],
          ]} />
        </Panel>
        <Panel title="Resumo financeiro" icon={<ReceiptText className="h-4 w-4" />}>
          <InfoGrid items={[
            ["Valor da Ordem", formatCurrencyBRLFromReais(order.estimatedValue)],
            ["Valor recebido", formatCurrencyBRLFromReais(snapshot.profitability.realizedRevenueCents / 100)],
            ["Valor a receber", formatCurrencyBRLFromReais(Math.max(0, snapshot.financial.revenueCents - snapshot.financial.receivedCents) / 100)],
            ["Custos previstos", snapshot.profitability.expectedCostCents === undefined ? "Dados insuficientes" : formatCurrencyBRLFromReais(snapshot.profitability.expectedCostCents / 100)],
            ["Custos realizados", formatCurrencyBRLFromReais(snapshot.profitability.realizedCostCents / 100)],
            ["Margem prevista", snapshot.profitability.expectedMarginCents === undefined ? "Dados insuficientes" : formatCurrencyBRLFromReais(snapshot.profitability.expectedMarginCents / 100)],
            ["Margem realizada", formatCurrencyBRLFromReais(snapshot.profitability.realizedMarginCents / 100)],
            ["Rentabilidade", snapshot.profitability.realizedProfitabilityBasisPoints === undefined ? "Dados insuficientes" : formatPercentageFromBasisPoints(snapshot.profitability.realizedProfitabilityBasisPoints)],
          ]} />
        </Panel>
        <Panel title="Composição do progresso" icon={<CheckCircle2 className="h-4 w-4" />}>
          <InfoGrid items={[
            ["Planejamento", formatPercentageFromBasisPoints(snapshot.progress.planning * 100)],
            ["Agendamento", formatPercentageFromBasisPoints(snapshot.progress.scheduling * 100)],
            ["Materiais", formatPercentageFromBasisPoints(snapshot.progress.materials * 100)],
            ["Execução", formatPercentageFromBasisPoints(snapshot.progress.execution * 100)],
            ["Financeiro e documentos", formatPercentageFromBasisPoints(snapshot.progress.closure * 100)],
            ["Progresso total", formatPercentageFromBasisPoints(snapshot.progress.total * 100)],
          ]} />
          {snapshot.progress.missing.length ? (
            <p className="text-xs text-muted-foreground">
              Para avançar: {snapshot.progress.missing.join(", ")}.
            </p>
          ) : null}
        </Panel>
        <Panel title="Próxima ação recomendada" icon={<AlertTriangle className="h-4 w-4" />}>
          <p className="text-sm font-semibold">
            {snapshot.insights[0]?.title ?? snapshot.progress.missing[0] ?? "Acompanhar execução"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {snapshot.insights[0]?.description ??
              (snapshot.progress.missing.length
                ? `Complete: ${snapshot.progress.missing[0]}.`
                : "Não há alerta crítico para esta Ordem.")}
          </p>
          {snapshot.insights[0] ? (
            <Button asChild size="sm" variant="secondary">
              <Link href={snapshot.insights[0].action.href}>
                {snapshot.insights[0].action.label}
              </Link>
            </Button>
          ) : null}
        </Panel>
        <Panel title="Equipe" icon={<Users className="h-4 w-4" />}>
          <p className="text-sm font-semibold">{order.technician || "Responsável não definido"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{order.teamMembers?.length ? order.teamMembers.join(" · ") : "Nenhum integrante adicional vinculado."}</p>
        </Panel>
        <Panel title="Descrição do serviço" icon={<FileText className="h-4 w-4" />}>
          <p className="text-sm leading-6">{order.description || "Sem descrição cadastrada."}</p>
        </Panel>
      </div>
    );
  if (activeTab === "Cronograma")
    return (
      <Panel title="Cronograma" icon={<CalendarDays className="h-4 w-4" />}>
        <InfoGrid items={[
          ["Data prevista", formatDateBR(order.scheduledDate)],
          ["Horário", order.scheduledTime],
          ["Duração estimada", `${formatNumberBR(order.estimatedDurationMinutes / 60, 1)} h`],
          ["Responsável", order.technician || "Não definido"],
        ]} />
        <RecordList
          empty="Nenhum compromisso adicional vinculado."
          items={snapshot.agenda.map((event) => ({
            id: event.id,
            title: event.title,
            description: `${formatDateTimeBR(event.startAt)} · ${ptBrLabel(event.status)}`,
          }))}
        />
      </Panel>
    );
  if (activeTab === "Ordens")
    return (
      <Panel title="Ordem principal" icon={<FolderKanban className="h-4 w-4" />}>
        <InfoGrid items={[
          ["Número", order.orderNumber],
          ["Serviço", order.title],
          ["Prioridade", ptBrLabel(order.priority)],
          ["Status", ptBrLabel(order.status)],
          ["Criada em", formatDateTimeBR(order.createdAt)],
          ["Atualizada em", formatDateTimeBR(order.updatedAt)],
        ]} />
        <Button asChild size="sm"><Link href={`/dashboard/ordens/${order.id}`}>Abrir detalhes e execução</Link></Button>
      </Panel>
    );
  if (activeTab === "Financeiro")
    return <FinancialTable snapshot={snapshot} />;
  if (activeTab === "Materiais")
    return <MaterialsPanel snapshot={snapshot} />;
  if (activeTab === "Equipamentos")
    return <EquipmentPanel snapshot={snapshot} />;
  if (activeTab === "Checklist")
    return (
      <Panel title="Checklist operacional" icon={<CheckCircle2 className="h-4 w-4" />}>
        <OrdemChecklist
          items={order.checklist}
          saving={savingChecklist}
          onSave={onChecklistSave}
        />
      </Panel>
    );
  if (activeTab === "Automações")
    return (
      <Panel title="Automações relacionadas" icon={<Settings2 className="h-4 w-4" />}>
        <RecordList
          empty="Nenhuma automação foi executada para esta Ordem."
          items={snapshot.automations.map((entry) => ({
            id: entry.id,
            title: entry.workflowName,
            description: `${ptBrLabel(entry.status)} · ${ptBrLabel(entry.mode)} · ${formatDateTimeBR(entry.finishedAt)} · ${entry.result}`,
            href: `/dashboard/automacoes/${entry.workflowId}`,
          }))}
        />
      </Panel>
    );
  if (activeTab === "Arquivos")
    return <FilesPanel snapshot={snapshot} />;
  if (activeTab === "Custos")
    return (
      <Panel title="Custos vinculados" icon={<ReceiptText className="h-4 w-4" />}>
        <InfoGrid items={[
        ["Despesas financeiras", formatCurrencyBRLFromReais(snapshot.financial.expenseCents / 100)],
          ["Custo da precificação", snapshot.pricing ? formatCurrencyBRLFromReais(snapshot.pricing.costCents / 100) : "Sem precificação aplicada"],
          ["Custos de manutenção", formatCurrencyBRLFromReais(snapshot.equipment.maintenance.reduce((sum, item) => sum + item.costCents, 0) / 100)],
        ]} />
        <RecordList
          empty="Nenhum custo realizado foi vinculado à Ordem."
          items={snapshot.costs.map((cost) => ({
            id: cost.id,
            title: cost.description,
            description: `${cost.category} · ${cost.status === "REALIZED" ? "Realizado" : "Previsto"} · ${formatCurrencyBRLFromReais(cost.valueCents / 100)}${cost.date ? ` · ${formatDateBR(cost.date)}` : ""}`,
          }))}
        />
      </Panel>
    );
  return (
    <Panel title="Rentabilidade prevista" icon={<ReceiptText className="h-4 w-4" />}>
      <InfoGrid items={[
        ["Receita prevista", formatCurrencyBRLFromReais(order.estimatedValue)],
        ["Receita realizada", formatCurrencyBRLFromReais(snapshot.profitability.realizedRevenueCents / 100)],
        ["Custo previsto", snapshot.profitability.expectedCostCents === undefined ? "Dados insuficientes" : formatCurrencyBRLFromReais(snapshot.profitability.expectedCostCents / 100)],
        ["Custo realizado", formatCurrencyBRLFromReais(snapshot.profitability.realizedCostCents / 100)],
        ["Margem prevista", snapshot.profitability.expectedMarginCents === undefined ? "Dados insuficientes" : formatCurrencyBRLFromReais(snapshot.profitability.expectedMarginCents / 100)],
        ["Margem realizada", formatCurrencyBRLFromReais(snapshot.profitability.realizedMarginCents / 100)],
        ["Rentabilidade prevista", snapshot.profitability.expectedProfitabilityBasisPoints === undefined ? "Dados insuficientes" : formatPercentageFromBasisPoints(snapshot.profitability.expectedProfitabilityBasisPoints)],
        ["Rentabilidade realizada", snapshot.profitability.realizedProfitabilityBasisPoints === undefined ? "Dados insuficientes" : formatPercentageFromBasisPoints(snapshot.profitability.realizedProfitabilityBasisPoints)],
      ]} />
      {!snapshot.pricing ? <p className="mt-3 text-xs text-muted-foreground">A margem completa será exibida quando uma precificação for aplicada à Ordem.</p> : null}
    </Panel>
  );
}

function FinancialTable({ snapshot }: { snapshot: ProjetoWorkspaceSnapshot }) {
  return (
    <Panel title="Financeiro da Ordem" icon={<ReceiptText className="h-4 w-4" />}>
      <InfoGrid items={[
        ["Receitas", formatCurrencyBRLFromReais(snapshot.financial.revenueCents / 100)],
        ["Despesas", formatCurrencyBRLFromReais(snapshot.financial.expenseCents / 100)],
        ["Saldo previsto", formatCurrencyBRLFromReais((snapshot.financial.revenueCents - snapshot.financial.expenseCents) / 100)],
        ["Saldo realizado", formatCurrencyBRLFromReais((snapshot.financial.receivedCents - snapshot.financial.paidCents) / 100)],
      ]} />
      {snapshot.financial.transactions.length ? (
        <TableFrame>
          <Table>
            <TableHeader><TableRow><TableHead>Lançamento</TableHead><TableHead>Tipo</TableHead><TableHead>Competência</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
            <TableBody>{snapshot.financial.transactions.map((item) => (
              <TableRow key={item.id}><TableCell><Link className="font-medium hover:underline" href={`/dashboard/financeiro/${item.id}`}>{item.title}</Link></TableCell><TableCell>{ptBrLabel(item.kind)}</TableCell><TableCell>{formatDateBR(item.competenceDate)}</TableCell><TableCell className="text-right tabular-nums">{formatCurrencyBRLFromReais(item.totalCents / 100)}</TableCell></TableRow>
            ))}</TableBody>
          </Table>
        </TableFrame>
      ) : <EmptyState size="compact" title="Sem lançamentos vinculados" description="Receitas e despesas vinculadas à Ordem aparecerão aqui." />}
    </Panel>
  );
}

function MaterialsPanel({ snapshot }: { snapshot: ProjetoWorkspaceSnapshot }) {
  const itemName = (id: string) => snapshot.stock.snapshots.find((entry) => entry.item.id === id)?.item.name ?? "Material";
  return (
    <Panel title="Materiais da Ordem" icon={<Boxes className="h-4 w-4" />}>
      <InfoGrid items={[
        ["Reservas", formatNumberBR(snapshot.stock.reservations.length, 0)],
        ["Movimentações", formatNumberBR(snapshot.stock.movements.length, 0)],
        ["Consumidos", formatNumberBR(snapshot.stock.movements.filter((item) => item.type === "CONSUMPTION").length, 0)],
        ["Pendentes", formatNumberBR(snapshot.stock.reservations.filter((item) => !["CONSUMED", "RELEASED"].includes(item.status)).length, 0)],
      ]} />
      <RecordList empty="Nenhum material reservado para esta Ordem." items={snapshot.stock.reservations.map((item) => ({
        id: item.id,
        title: itemName(item.itemId),
        description: `${formatNumberBR(item.quantity, 2)} reservado · ${formatNumberBR(item.consumedQuantity, 2)} consumido · ${ptBrLabel(item.status)}`,
      }))} />
    </Panel>
  );
}

function EquipmentPanel({ snapshot }: { snapshot: ProjetoWorkspaceSnapshot }) {
  return (
    <Panel title="Equipamentos vinculados" icon={<PackageCheck className="h-4 w-4" />}>
      <RecordList empty="Nenhum equipamento vinculado a esta Ordem." items={snapshot.equipment.assets.map((asset) => ({
        id: asset.id,
        title: asset.name,
        description: `${asset.manufacturer} ${asset.model} · ${ptBrLabel(asset.status)}`,
        href: `/dashboard/equipamentos/${asset.id}`,
      }))} />
      {snapshot.equipment.maintenance.length ? <RecordList empty="" items={snapshot.equipment.maintenance.map((item) => ({
        id: item.id,
        title: item.title,
        description: `${ptBrLabel(item.status)} · ${formatDateBR(item.scheduledAt)} · ${formatCurrencyBRLFromReais(item.costCents / 100)}`,
      }))} /> : null}
    </Panel>
  );
}

function FilesPanel({ snapshot }: { snapshot: ProjetoWorkspaceSnapshot }) {
  const { order } = snapshot;
  const reportAvailable = Boolean(order.technicalReport?.updatedAt);
  const files = order.media ?? [];
  return (
    <Panel title="Arquivos e documentos" icon={<FileText className="h-4 w-4" />}>
      <InfoGrid items={[
        ["Fotos e anexos", formatNumberBR(files.length, 0)],
        ["Relatório técnico", reportAvailable ? "Disponível" : "Pendente"],
        ["Contratos", "Nenhum vínculo disponível"],
        ["Garantias", formatNumberBR(snapshot.equipment.assets.filter((asset) => asset.warranty?.endDate).length, 0)],
      ]} />
      <RecordList empty="Nenhum arquivo anexado à Ordem." items={files.map((file) => ({
        id: file.id,
        title: file.fileName,
        description: `${ptBrLabel(file.kind)} · ${formatNumberBR(file.size / 1024, 1)} KB · ${formatDateTimeBR(file.createdAt)}`,
      }))} />
    </Panel>
  );
}

function Panel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return <Card><CardHeader className="border-b px-4 py-3"><div className="flex items-center gap-2"><span className="text-primary" aria-hidden="true">{icon}</span><SectionHeader compact title={title} /></div></CardHeader><CardContent className="space-y-4 p-4">{children}</CardContent></Card>;
}

function InfoGrid({ items }: { items: Array<[string, string]> }) {
  return <dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{items.map(([label, value]) => <div key={label} className="rounded-lg border bg-muted/20 px-3 py-2"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-0.5 text-sm font-semibold">{value}</dd></div>)}</dl>;
}

function RecordList({ items, empty }: { items: Array<{ id: string; title: string; description: string; href?: string }>; empty: string }) {
  if (!items.length) return empty ? <EmptyState size="compact" title={empty} /> : null;
  return <div className="divide-y rounded-xl border">{items.map((item) => <article key={item.id} className="flex items-center justify-between gap-3 p-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p></div>{item.href ? <Button asChild size="sm" variant="ghost"><Link href={item.href}>Abrir</Link></Button> : null}</article>)}</div>;
}
