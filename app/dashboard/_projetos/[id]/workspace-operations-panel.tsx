"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrencyBRLFromCents, formatDateBR, formatNumberBR, parseCurrencyBRToCents } from "@/lib/br-formatters";
import { ptBrLabel } from "@/lib/pt-br-labels";
import {
  addOrderCostAction,
  addOrderMaterialAction,
  addOrderTeamMemberAction,
  getWorkspaceOperationsAction,
  removeOrderTeamMemberAction,
  updateOrderCostStatusAction,
  updateOrderMaterialStatusAction,
  updateOrderTeamHoursAction,
} from "./workspace-operations-actions";
import { materialTotalCents, orderCostSummary, type WorkspaceOperationsEnvelope } from "./workspace-operations-domain";

export function WorkspaceOperationsPanel({
  serviceOrderId,
  section,
  expectedRevenueCents,
  receivedRevenueCents,
}: {
  serviceOrderId: string;
  section: "TEAM" | "MATERIALS" | "COSTS" | "PROFITABILITY";
  expectedRevenueCents?: number;
  receivedRevenueCents?: number;
}) {
  const [state, setState] = useState<WorkspaceOperationsEnvelope>({ version: 1, team: [], materials: [], costs: [], events: [] });
  const [error, setError] = useState("");
  useEffect(() => { void getWorkspaceOperationsAction().then(setState); }, []);
  const team = state.team.filter((item) => item.serviceOrderId === serviceOrderId);
  const materials = state.materials.filter((item) => item.serviceOrderId === serviceOrderId);
  const costs = state.costs.filter((item) => item.serviceOrderId === serviceOrderId);
  const summary = useMemo(() => orderCostSummary(costs, expectedRevenueCents, receivedRevenueCents), [costs, expectedRevenueCents, receivedRevenueCents]);
  const safe = async (operation: () => Promise<WorkspaceOperationsEnvelope>) => {
    try { setState(await operation()); setError(""); } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível concluir a ação."); }
  };
  return (
    <div className="space-y-4">
      {error ? <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">{error}</p> : null}
      {section === "TEAM" ? <TeamSection serviceOrderId={serviceOrderId} items={team} run={safe} /> : null}
      {section === "MATERIALS" ? <MaterialSection serviceOrderId={serviceOrderId} items={materials} run={safe} /> : null}
      {section === "COSTS" ? <CostSection serviceOrderId={serviceOrderId} items={costs} summary={summary} run={safe} /> : null}
      {section === "PROFITABILITY" ? <ProfitabilitySection summary={summary} expectedRevenueCents={expectedRevenueCents} receivedRevenueCents={receivedRevenueCents} costs={costs} /> : null}
    </div>
  );
}

function TeamSection({ serviceOrderId, items, run }: { serviceOrderId: string; items: WorkspaceOperationsEnvelope["team"]; run: (fn: () => Promise<WorkspaceOperationsEnvelope>) => Promise<void> }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("TECHNICIAN");
  const [planned, setPlanned] = useState("0");
  return <section className="space-y-3"><FormGrid>
    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do Integrante" aria-label="Nome do Integrante" />
    <Select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Função na Ordem"><option value="TECHNICAL_LEAD">Responsável Técnico</option><option value="TECHNICIAN">Técnico</option><option value="ASSISTANT">Auxiliar</option><option value="ELECTRICIAN">Eletricista</option><option value="INSTALLER">Instalador</option><option value="SUPERVISOR">Supervisor</option><option value="CUSTOMER_SERVICE">Atendimento</option><option value="OTHER">Outro</option></Select>
    <Input inputMode="decimal" value={planned} onChange={(e) => setPlanned(e.target.value)} placeholder="Horas Previstas" aria-label="Horas Previstas" />
    <Button onClick={() => void run(() => addOrderTeamMemberAction({ id: `team-${crypto.randomUUID()}`, serviceOrderId, memberName: name, role: role as WorkspaceOperationsEnvelope["team"][number]["role"], entryDate: new Date().toISOString().slice(0, 10), plannedHours: Number(planned.replace(",", ".")), workedHours: 0, active: true }))}><Plus className="h-4 w-4" />Adicionar Integrante</Button>
  </FormGrid>{items.length ? <div className="divide-y rounded-xl border">{items.map((item) => <div key={item.id} className="grid gap-2 p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="text-sm font-semibold">{item.memberName}</p><p className="text-xs text-muted-foreground">{ptBrLabel(item.role)} · Entrada em {formatDateBR(item.entryDate)}</p></div><Input className="w-28" inputMode="decimal" defaultValue={String(item.workedHours).replace(".", ",")} aria-label={`Horas realizadas por ${item.memberName}`} onBlur={(e) => void run(() => updateOrderTeamHoursAction(item.id, Number(e.target.value.replace(",", "."))))} /><Button size="icon" variant="ghost" aria-label={`Remover ${item.memberName}`} onClick={() => void run(() => removeOrderTeamMemberAction(item.id))}><Trash2 className="h-4 w-4" /></Button></div>)}</div> : <EmptyState size="compact" title="Nenhum Integrante Vinculado" />}</section>;
}

function MaterialSection({ serviceOrderId, items, run }: { serviceOrderId: string; items: WorkspaceOperationsEnvelope["materials"]; run: (fn: () => Promise<WorkspaceOperationsEnvelope>) => Promise<void> }) {
  const [name, setName] = useState(""), [quantity, setQuantity] = useState("1"), [cost, setCost] = useState("0,00");
  return <section className="space-y-3"><FormGrid><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do Material" /><Input value={quantity} onChange={(e) => setQuantity(e.target.value)} inputMode="decimal" placeholder="Quantidade Prevista" /><Input value={cost} onChange={(e) => setCost(e.target.value)} inputMode="decimal" placeholder="Custo Unitário em Reais" /><Button onClick={() => void run(() => addOrderMaterialAction({ id: `material-${crypto.randomUUID()}`, serviceOrderId, name, plannedQuantity: Number(quantity.replace(",", ".")), usedQuantity: 0, unit: "UNIT", unitCostCents: parseCurrencyBRToCents(cost), origin: "Cadastro Local", status: "PLANNED", stockMovementConfirmed: false }))}><Plus className="h-4 w-4" />Adicionar Material</Button></FormGrid>{items.length ? <div className="divide-y rounded-xl border">{items.map((item) => <div key={item.id} className="grid gap-2 p-3 lg:grid-cols-[1fr_auto_auto] lg:items-center"><div><p className="text-sm font-semibold">{item.name}</p><p className="text-xs text-muted-foreground">{formatNumberBR(item.plannedQuantity, 2)} previsto(s) · {formatNumberBR(item.usedQuantity, 2)} utilizado(s) · {formatCurrencyBRLFromCents(materialTotalCents(item))}</p></div><Badge variant="outline">{ptBrLabel(item.status)}</Badge><Select value={item.status} aria-label={`Situação de ${item.name}`} onChange={(e) => { const status = e.target.value as typeof item.status; const confirmed = !["RESERVED", "USED", "RETURNED"].includes(status) || window.confirm("Confirmar esta movimentação local? O Estoque real não será alterado automaticamente."); void run(() => updateOrderMaterialStatusAction(item.id, status, confirmed)); }}><option value="PLANNED">Planejado</option><option value="RESERVED">Reservado</option><option value="USED">Utilizado</option><option value="PARTIALLY_USED">Parcialmente Utilizado</option><option value="RETURNED">Devolvido</option><option value="CANCELED">Cancelado</option></Select></div>)}</div> : <EmptyState size="compact" title="Nenhum Material Planejado" />}</section>;
}

function CostSection({ serviceOrderId, items, summary, run }: { serviceOrderId: string; items: WorkspaceOperationsEnvelope["costs"]; summary: ReturnType<typeof orderCostSummary>; run: (fn: () => Promise<WorkspaceOperationsEnvelope>) => Promise<void> }) {
  const [description, setDescription] = useState(""), [value, setValue] = useState("0,00"), [category, setCategory] = useState("MATERIAL");
  return <section className="space-y-3"><div className="grid gap-2 sm:grid-cols-3"><Metric label="Custos Previstos" value={formatCurrencyBRLFromCents(summary.plannedCostCents)} /><Metric label="Custos Confirmados" value={formatCurrencyBRLFromCents(summary.confirmedCostCents)} /><Metric label="Custo Total" value={formatCurrencyBRLFromCents(summary.totalCostCents)} /></div><FormGrid><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição do Custo" /><Select value={category} onChange={(e) => setCategory(e.target.value)}><option value="MATERIAL">Material</option><option value="LABOR">Mão de Obra</option><option value="DISPLACEMENT">Deslocamento</option><option value="LODGING">Hospedagem</option><option value="FOOD">Alimentação</option><option value="OUTSOURCING">Terceirização</option><option value="MAINTENANCE">Manutenção</option><option value="FEE">Taxa</option><option value="OTHER">Outro</option></Select><Input value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" placeholder="Valor em Reais" /><Button onClick={() => void run(() => addOrderCostAction({ id: `cost-${crypto.randomUUID()}`, serviceOrderId, description, category: category as WorkspaceOperationsEnvelope["costs"][number]["category"], valueCents: parseCurrencyBRToCents(value), date: new Date().toISOString().slice(0, 10), responsible: "Equipe Operacional", status: "PLANNED" }))}><Plus className="h-4 w-4" />Registrar Custo</Button></FormGrid>{items.length ? <div className="divide-y rounded-xl border">{items.map((item) => <div key={item.id} className="grid gap-2 p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="text-sm font-semibold">{item.description}</p><p className="text-xs text-muted-foreground">{ptBrLabel(item.category)} · {formatDateBR(item.date)}</p></div><strong>{formatCurrencyBRLFromCents(item.valueCents)}</strong><Select value={item.status} onChange={(e) => void run(() => updateOrderCostStatusAction(item.id, e.target.value as typeof item.status))}><option value="PLANNED">Previsto</option><option value="CONFIRMED">Confirmado</option><option value="CANCELED">Cancelado</option><option value="REVERSED">Estornado</option></Select></div>)}</div> : <EmptyState size="compact" title="Nenhum Custo Local Registrado" />}</section>;
}

function ProfitabilitySection({ summary, expectedRevenueCents, receivedRevenueCents, costs }: { summary: ReturnType<typeof orderCostSummary>; expectedRevenueCents?: number; receivedRevenueCents?: number; costs: WorkspaceOperationsEnvelope["costs"] }) {
  const byCategory = [...new Map(costs.map((item) => [item.category, costs.filter((cost) => cost.category === item.category).reduce((sum, cost) => sum + cost.valueCents, 0)])).entries()].sort((a, b) => b[1] - a[1]);
  return <div className="space-y-4"><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Receita Prevista" value={expectedRevenueCents === undefined ? "Dados Insuficientes" : formatCurrencyBRLFromCents(expectedRevenueCents)} /><Metric label="Receita Recebida" value={receivedRevenueCents === undefined ? "Dados Insuficientes" : formatCurrencyBRLFromCents(receivedRevenueCents)} /><Metric label="Margem Estimada" value={summary.expectedMarginCents === undefined ? "Dados Insuficientes para Calcular a Margem" : formatCurrencyBRLFromCents(summary.expectedMarginCents)} /><Metric label="Margem Realizada" value={summary.realizedMarginCents === undefined ? "Dados Insuficientes para Calcular a Margem" : formatCurrencyBRLFromCents(summary.realizedMarginCents)} /></div>{byCategory.length ? <div className="divide-y rounded-xl border">{byCategory.map(([category, value]) => <div key={category} className="flex justify-between p-3 text-sm"><span>{ptBrLabel(category)}</span><strong>{formatCurrencyBRLFromCents(value)}</strong></div>)}</div> : <EmptyState size="compact" title="Dados Insuficientes" description="Registre custos para visualizar a composição da rentabilidade." />}</div>;
}

function FormGrid({ children }: { children: React.ReactNode }) { return <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">{children}</div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>; }
