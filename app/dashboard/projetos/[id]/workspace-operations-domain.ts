export type OrderTeamRole = "TECHNICAL_LEAD" | "TECHNICIAN" | "ASSISTANT" | "ELECTRICIAN" | "INSTALLER" | "SUPERVISOR" | "CUSTOMER_SERVICE" | "OTHER";
export type OrderTeamMember = {
  id: string; serviceOrderId: string; memberName: string; role: OrderTeamRole;
  entryDate: string; exitDate?: string; plannedHours: number; workedHours: number;
  note?: string; active: boolean;
};
export type OrderMaterialStatus = "PLANNED" | "RESERVED" | "USED" | "PARTIALLY_USED" | "RETURNED" | "CANCELED";
export type OrderMaterial = {
  id: string; serviceOrderId: string; stockItemId?: string; name: string; plannedQuantity: number;
  usedQuantity: number; returnedQuantity?: number;
  unit: "UNIT" | "METER" | "KILOGRAM" | "LITER" | "BOX" | "ROLL" | "PAIR" | "SET" | "OTHER";
  unitCostCents: number; origin: string; status: OrderMaterialStatus; stockMovementConfirmed: boolean;
  stockReservationId?: string; consumptionMovementId?: string;
};
export type OrderCostStatus = "PLANNED" | "CONFIRMED" | "CANCELED" | "REVERSED";
export type OrderCost = {
  id: string; serviceOrderId: string; description: string;
  category: "MATERIAL" | "LABOR" | "DISPLACEMENT" | "LODGING" | "FOOD" | "OUTSOURCING" | "MAINTENANCE" | "FEE" | "OTHER";
  valueCents: number; date: string; responsible: string; supplier?: string;
  receiptReference?: string; note?: string; status: OrderCostStatus;
};
export type WorkspaceOperationEvent = {
  id: string; serviceOrderId: string; type: "TEAM_UPDATED" | "MATERIAL_UPDATED" | "COST_UPDATED";
  title: string; description: string; occurredAt: string;
};
export type WorkspaceOperationsEnvelope = {
  version: 1; team: OrderTeamMember[]; materials: OrderMaterial[]; costs: OrderCost[]; events: WorkspaceOperationEvent[];
};
export const emptyWorkspaceOperations = (): WorkspaceOperationsEnvelope => ({ version: 1, team: [], materials: [], costs: [], events: [] });

const event = (serviceOrderId: string, type: WorkspaceOperationEvent["type"], title: string, description: string, now: string): WorkspaceOperationEvent => ({
  id: `${type}-${serviceOrderId}-${now}`, serviceOrderId, type, title, description, occurredAt: now,
});

export function addOrderTeamMember(envelope: WorkspaceOperationsEnvelope, member: OrderTeamMember, now: string) {
  if (envelope.team.some((item) => item.serviceOrderId === member.serviceOrderId && item.active && item.memberName.toLocaleLowerCase("pt-BR") === member.memberName.toLocaleLowerCase("pt-BR") && item.role === member.role))
    throw new Error("Este integrante já possui a mesma função ativa na Ordem.");
  return { ...envelope, team: [...envelope.team, member], events: [...envelope.events, event(member.serviceOrderId, "TEAM_UPDATED", "Equipe da Ordem Atualizada", `${member.memberName} foi adicionado à equipe.`, now)] };
}
export function updateTeamHours(envelope: WorkspaceOperationsEnvelope, id: string, workedHours: number, now: string) {
  if (workedHours < 0) throw new Error("As horas realizadas não podem ser negativas.");
  const member = envelope.team.find((item) => item.id === id);
  if (!member) throw new Error("Integrante não encontrado.");
  return { ...envelope, team: envelope.team.map((item) => item.id === id ? { ...item, workedHours } : item), events: [...envelope.events, event(member.serviceOrderId, "TEAM_UPDATED", "Horas da Equipe Registradas", `${workedHours.toLocaleString("pt-BR")} hora(s) registradas.`, now)] };
}
export function removeOrderTeamMember(envelope: WorkspaceOperationsEnvelope, id: string, now: string) {
  const member = envelope.team.find((item) => item.id === id);
  if (!member) return envelope;
  return { ...envelope, team: envelope.team.map((item) => item.id === id ? { ...item, active: false, exitDate: now.slice(0, 10) } : item), events: [...envelope.events, event(member.serviceOrderId, "TEAM_UPDATED", "Integrante Removido da Ordem", member.memberName, now)] };
}
export function addOrderMaterial(envelope: WorkspaceOperationsEnvelope, material: OrderMaterial, now: string) {
  if (!material.name.trim()) throw new Error("Informe o nome do material.");
  if (material.plannedQuantity <= 0) throw new Error("Informe uma quantidade prevista maior que zero.");
  return { ...envelope, materials: [...envelope.materials, material], events: [...envelope.events, event(material.serviceOrderId, "MATERIAL_UPDATED", "Material Adicionado", material.name, now)] };
}
export function updateOrderMaterialStatus(envelope: WorkspaceOperationsEnvelope, id: string, status: OrderMaterialStatus, confirmed: boolean, now: string) {
  const material = envelope.materials.find((item) => item.id === id);
  if (!material) throw new Error("Material não encontrado.");
  if (["RESERVED", "USED", "RETURNED"].includes(status) && !confirmed)
    throw new Error("Confirme explicitamente a movimentação antes de atualizar o material.");
  return { ...envelope, materials: envelope.materials.map((item) => item.id === id ? { ...item, status, stockMovementConfirmed: confirmed } : item), events: [...envelope.events, event(material.serviceOrderId, "MATERIAL_UPDATED", "Situação do Material Atualizada", `${material.name}: ${status}.`, now)] };
}

export function updateOrderMaterialIntegration(
  envelope: WorkspaceOperationsEnvelope,
  id: string,
  patch: Partial<Pick<OrderMaterial,
    "status" | "usedQuantity" | "returnedQuantity" | "stockMovementConfirmed" |
    "stockReservationId" | "consumptionMovementId"
  >>,
  description: string,
  now: string,
) {
  const material = envelope.materials.find((item) => item.id === id);
  if (!material) throw new Error("Material não encontrado.");
  return {
    ...envelope,
    materials: envelope.materials.map((item) =>
      item.id === id ? { ...item, ...patch } : item,
    ),
    events: [
      ...envelope.events,
      event(material.serviceOrderId, "MATERIAL_UPDATED", "Movimentação de Estoque Confirmada", description, now),
    ],
  };
}
export function materialTotalCents(material: Pick<OrderMaterial, "plannedQuantity" | "unitCostCents">) {
  return Math.round(material.plannedQuantity * material.unitCostCents);
}
export function addOrderCost(envelope: WorkspaceOperationsEnvelope, cost: OrderCost, now: string) {
  if (!cost.description.trim()) throw new Error("Informe a descrição do custo.");
  if (cost.valueCents <= 0) throw new Error("Informe um valor maior que zero.");
  return { ...envelope, costs: [...envelope.costs, cost], events: [...envelope.events, event(cost.serviceOrderId, "COST_UPDATED", "Custo Registrado", cost.description, now)] };
}
export function updateOrderCostStatus(envelope: WorkspaceOperationsEnvelope, id: string, status: OrderCostStatus, now: string) {
  const cost = envelope.costs.find((item) => item.id === id);
  if (!cost) throw new Error("Custo não encontrado.");
  return { ...envelope, costs: envelope.costs.map((item) => item.id === id ? { ...item, status } : item), events: [...envelope.events, event(cost.serviceOrderId, "COST_UPDATED", "Situação do Custo Atualizada", `${cost.description}: ${status}.`, now)] };
}
export function orderCostSummary(costs: OrderCost[], expectedRevenueCents?: number, receivedRevenueCents?: number) {
  const plannedCostCents = costs.filter((item) => item.status === "PLANNED").reduce((sum, item) => sum + item.valueCents, 0);
  const confirmedCostCents = costs.filter((item) => item.status === "CONFIRMED").reduce((sum, item) => sum + item.valueCents, 0);
  const expectedMarginCents = expectedRevenueCents === undefined ? undefined : expectedRevenueCents - plannedCostCents;
  const realizedMarginCents = receivedRevenueCents === undefined ? undefined : receivedRevenueCents - confirmedCostCents;
  return {
    plannedCostCents, confirmedCostCents, totalCostCents: plannedCostCents + confirmedCostCents,
    expectedMarginCents, realizedMarginCents,
    expectedMarginBasisPoints: expectedRevenueCents && expectedMarginCents !== undefined ? Math.round(expectedMarginCents / expectedRevenueCents * 10_000) : undefined,
    realizedMarginBasisPoints: receivedRevenueCents && realizedMarginCents !== undefined ? Math.round(realizedMarginCents / receivedRevenueCents * 10_000) : undefined,
  };
}
