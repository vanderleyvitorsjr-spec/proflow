import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateGoalProgress, createGoal, deriveGoalRealizedValues, duplicateGoal, updateGoal,
} from "../../features/dashboard/goals/executive-goals-domain";
import {
  nextBusinessDay, reopenOperationalItem, resolveOperationalItem,
  snoozeOperationalItem, tomorrow, updateOperationalItemState, visibleOperationalInsightIds,
} from "../../app/dashboard/central-operacional/central-operacional-state";
import {
  activityDateGroup, filterGlobalActivities, uniqueGlobalActivities, type GlobalActivity,
} from "../../lib/contracts/global-activity.contract";
import {
  checklistSummary, checklistTemplateFor,
} from "../../app/dashboard/projetos/[id]/workspace-checklist-domain";
import {
  addOrderCost, addOrderMaterial, addOrderTeamMember, emptyWorkspaceOperations,
  materialTotalCents, orderCostSummary, removeOrderTeamMember, updateOrderCostStatus,
  updateOrderMaterialStatus, updateTeamHours,
  type OrderCost, type OrderMaterial, type OrderTeamMember,
} from "../../app/dashboard/projetos/[id]/workspace-operations-domain";

const now = "2026-07-30T12:00:00.000Z";
const baseGoal = createGoal({
  id: "goal-1", name: "Faturamento Mensal", category: "REVENUE", targetValue: 100_000,
  realizedValue: 50_000, unit: "CURRENCY", period: "MONTHLY",
  startDate: "2026-07-01", endDate: "2026-07-31", active: true,
}, now);

describe("Metas Executivas locais", () => {
  it("cria Meta com histórico", () => assert.equal(baseGoal.history[0]?.type, "CREATED"));
  it("edita Meta", () => assert.equal(updateGoal(baseGoal, { name: "Nova Meta" }, now).name, "Nova Meta"));
  it("desativa Meta", () => assert.equal(updateGoal(baseGoal, { active: false }, now).status, "CLOSED"));
  it("duplica Meta inativa", () => assert.equal(duplicateGoal(baseGoal, "goal-2", now).active, false));
  it("calcula progresso", () => assert.equal(calculateGoalProgress(baseGoal, new Date(now)).percentage, 50));
  it("não calcula Meta zero", () => assert.equal(calculateGoalProgress({ ...baseGoal, targetValue: 0 }, new Date(now)).available, false));
  it("identifica Meta alcançada", () => assert.equal(calculateGoalProgress({ ...baseGoal, realizedValue: 100_000 }, new Date(now)).status, "ACHIEVED"));
  it("identifica Meta superada", () => assert.equal(calculateGoalProgress({ ...baseGoal, realizedValue: 100_001 }, new Date(now)).status, "EXCEEDED"));
  it("aceita período personalizado", () => assert.equal(createGoal({ ...baseGoal, id: "custom", period: "CUSTOM" }, now).period, "CUSTOM"));
  it("rejeita período invertido", () => assert.throws(() => createGoal({ ...baseGoal, id: "bad", startDate: "2026-08-01", endDate: "2026-07-01" }, now)));
  it("deriva faturamento em centavos", () => assert.equal(deriveGoalRealizedValues([{ id: "revenue", title: "Receita", value: 100, formattedValue: "R$ 100,00" }]).REVENUE, 10_000));
  it("mantém dados insuficientes sem realizado", () => assert.equal(calculateGoalProgress({ ...baseGoal, realizedValue: undefined }, new Date(now)).message, "Dados Insuficientes"));
});

describe("Adiamento e resolução avançados", () => {
  it("calcula amanhã", () => assert.equal(tomorrow(new Date("2026-07-30T12:00:00")).getDate(), 31));
  it("pula fim de semana", () => assert.equal(nextBusinessDay(new Date("2026-07-31T12:00:00")).getDay(), 1));
  it("adia para data escolhida", () => assert.equal(snoozeOperationalItem(undefined, { insightId: "i", until: "2026-08-01T12:00:00Z", reason: "Reagendamento" }, new Date(now)).status, "SNOOZED"));
  it("bloqueia data passada", () => assert.throws(() => snoozeOperationalItem(undefined, { insightId: "i", until: "2026-07-01", reason: "Reagendamento" }, new Date(now))));
  it("exige motivo", () => assert.throws(() => snoozeOperationalItem(undefined, { insightId: "i", until: "2026-08-01", reason: "" }, new Date(now))));
  it("exige descrição para Outro", () => assert.throws(() => snoozeOperationalItem(undefined, { insightId: "i", until: "2026-08-01", reason: "Outro" }, new Date(now))));
  it("resolve preservando histórico", () => assert.equal(resolveOperationalItem(undefined, { insightId: "i", resolution: "Cadastro corrigido", result: "Corrigido" }, new Date(now)).history?.length, 1));
  it("não adia resolvido", () => { const item = resolveOperationalItem(undefined, { insightId: "i", resolution: "Resolvido", result: "Resolvido" }, new Date(now)); assert.throws(() => snoozeOperationalItem(item, { insightId: "i", until: "2026-08-01", reason: "Reagendamento" }, new Date(now))); });
  it("reabre resolvido", () => { const item = resolveOperationalItem(undefined, { insightId: "i", resolution: "Resolvido", result: "Resolvido" }, new Date(now)); assert.equal(reopenOperationalItem(item, "Nova evidência", "Equipe", new Date(now)).status, "REOPENED"); });
  it("filtra item resolvido da lista ativa", () => { const item = resolveOperationalItem(undefined, { insightId: "i", resolution: "Resolvido", result: "Resolvido" }, new Date(now)); assert.deepEqual(visibleOperationalInsightIds(["i"], updateOperationalItemState({ version: 2, items: [] }, item), new Date(now)), []); });
});

const activities: GlobalActivity[] = [
  { id: "1", source: "GOALS", sourceId: "g", sourceLabel: "Metas", type: "GOAL_CREATED", title: "Meta Criada", occurredAt: "2026-07-30T10:00:00Z" },
  { id: "2", source: "COSTS", sourceId: "c", sourceLabel: "Custos", type: "COST_UPDATED", title: "Custo Registrado", occurredAt: "2026-07-29T10:00:00Z", responsibleName: "Equipe" },
];
describe("Linha do Tempo unificada", () => {
  it("remove eventos duplicados", () => assert.equal(uniqueGlobalActivities([...activities, activities[0]!]).length, 2));
  it("ordena eventos", () => assert.equal(uniqueGlobalActivities(activities)[0]?.id, "1"));
  it("agrupa por Hoje", () => assert.equal(activityDateGroup(activities[0]!.occurredAt, new Date("2026-07-30T12:00:00Z")), "Hoje"));
  it("agrupa por Ontem", () => assert.equal(activityDateGroup(activities[1]!.occurredAt, new Date("2026-07-30T12:00:00Z")), "Ontem"));
  it("filtra por módulo", () => assert.equal(filterGlobalActivities(activities, { source: "GOALS" }).length, 1));
  it("filtra por período", () => assert.equal(filterGlobalActivities(activities, { startDate: "2026-07-30" }).length, 1));
  it("pesquisa título", () => assert.equal(filterGlobalActivities(activities, { search: "custo" }).length, 1));
  it("filtra responsável", () => assert.equal(filterGlobalActivities(activities, { responsible: "Equipe" }).length, 1));
});

describe("Checklist Inteligente", () => {
  it("possui Modelo de Instalação", () => assert.equal(checklistTemplateFor("INSTALLATION").length, 7));
  it("possui Modelo de Manutenção", () => assert.equal(checklistTemplateFor("PREVENTIVE").length, 7));
  it("possui Modelo de Elétrica", () => assert.equal(checklistTemplateFor("ELECTRICAL").length, 6));
  it("calcula progresso", () => assert.equal(checklistSummary([{ title: "A", status: "COMPLETED", required: true }]).percentage, 100));
  it("identifica obrigatório pendente", () => assert.deepEqual(checklistSummary([{ title: "A", status: "PENDING", required: true }]).requiredPending, ["A"]));
  it("identifica bloqueado", () => assert.equal(checklistSummary([{ title: "A", status: "BLOCKED", required: true }]).blocked, 1));
  it("indica próxima tarefa", () => assert.equal(checklistSummary([{ title: "A", status: "PENDING", required: false }]).nextTask, "A"));
  it("indica responsável", () => assert.equal(checklistSummary([{ title: "A", status: "PENDING", required: false, responsible: "Técnico" }]).responsible, "Técnico"));
});

const member: OrderTeamMember = { id: "t", serviceOrderId: "os", memberName: "João da Silva", role: "TECHNICIAN", entryDate: "2026-07-30", plannedHours: 8, workedHours: 0, active: true };
const material: OrderMaterial = { id: "m", serviceOrderId: "os", name: "Cabo", plannedQuantity: 2, usedQuantity: 0, unit: "METER", unitCostCents: 500, origin: "Local", status: "PLANNED", stockMovementConfirmed: false };
const cost: OrderCost = { id: "c", serviceOrderId: "os", description: "Material", category: "MATERIAL", valueCents: 1000, date: "2026-07-30", responsible: "Equipe", status: "PLANNED" };
describe("Equipe, materiais, custos e rentabilidade", () => {
  it("adiciona integrante", () => assert.equal(addOrderTeamMember(emptyWorkspaceOperations(), member, now).team.length, 1));
  it("impede integrante duplicado", () => { const state = addOrderTeamMember(emptyWorkspaceOperations(), member, now); assert.throws(() => addOrderTeamMember(state, member, now)); });
  it("remove integrante logicamente", () => { const state = addOrderTeamMember(emptyWorkspaceOperations(), member, now); assert.equal(removeOrderTeamMember(state, "t", now).team[0]?.active, false); });
  it("registra horas", () => { const state = addOrderTeamMember(emptyWorkspaceOperations(), member, now); assert.equal(updateTeamHours(state, "t", 4, now).team[0]?.workedHours, 4); });
  it("adiciona material", () => assert.equal(addOrderMaterial(emptyWorkspaceOperations(), material, now).materials.length, 1));
  it("calcula custo total do material", () => assert.equal(materialTotalCents(material), 1000));
  it("exige confirmação para reservar", () => { const state = addOrderMaterial(emptyWorkspaceOperations(), material, now); assert.throws(() => updateOrderMaterialStatus(state, "m", "RESERVED", false, now)); });
  it("reserva com confirmação", () => { const state = addOrderMaterial(emptyWorkspaceOperations(), material, now); assert.equal(updateOrderMaterialStatus(state, "m", "RESERVED", true, now).materials[0]?.status, "RESERVED"); });
  it("consome com confirmação", () => { const state = addOrderMaterial(emptyWorkspaceOperations(), material, now); assert.equal(updateOrderMaterialStatus(state, "m", "USED", true, now).materials[0]?.status, "USED"); });
  it("devolve com confirmação", () => { const state = addOrderMaterial(emptyWorkspaceOperations(), material, now); assert.equal(updateOrderMaterialStatus(state, "m", "RETURNED", true, now).materials[0]?.status, "RETURNED"); });
  it("adiciona custo", () => assert.equal(addOrderCost(emptyWorkspaceOperations(), cost, now).costs.length, 1));
  it("cancela custo", () => { const state = addOrderCost(emptyWorkspaceOperations(), cost, now); assert.equal(updateOrderCostStatus(state, "c", "CANCELED", now).costs[0]?.status, "CANCELED"); });
  it("estorna custo", () => { const state = addOrderCost(emptyWorkspaceOperations(), cost, now); assert.equal(updateOrderCostStatus(state, "c", "REVERSED", now).costs[0]?.status, "REVERSED"); });
  it("soma custos previstos", () => assert.equal(orderCostSummary([cost]).plannedCostCents, 1000));
  it("soma custos confirmados", () => assert.equal(orderCostSummary([{ ...cost, status: "CONFIRMED" }]).confirmedCostCents, 1000));
  it("calcula margem estimada", () => assert.equal(orderCostSummary([cost], 5000).expectedMarginCents, 4000));
  it("calcula margem realizada", () => assert.equal(orderCostSummary([{ ...cost, status: "CONFIRMED" }], undefined, 5000).realizedMarginCents, 4000));
  it("não divide receita zero", () => assert.equal(orderCostSummary([cost], 0).expectedMarginBasisPoints, undefined));
});
