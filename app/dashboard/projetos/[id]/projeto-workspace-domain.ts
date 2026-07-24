export type ProgressInput = {
  orderStatus: string;
  checklist: { status: string; required: boolean }[];
  agenda: { status: string }[];
  hasMaterialPlan: boolean;
  hasConfirmedMaterials: boolean;
  hasEquipmentDefinition: boolean;
  executionStatus?: string;
  hasTechnicalReport: boolean;
  hasFinancialRecord: boolean;
};

export type ProgressBreakdown = {
  planning: number;
  scheduling: number;
  materials: number;
  execution: number;
  closure: number;
  total: number;
  missing: string[];
};

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function calculateOperationalProgress(input: ProgressInput): ProgressBreakdown {
  const missing: string[] = [];
  const planning = input.orderStatus ? 15 : 0;
  const scheduling = input.agenda.length
    ? input.agenda.some((event) => event.status === "COMPLETED")
      ? 15
      : 8
    : 0;
  if (!input.agenda.length) missing.push("Agendamento");

  const materials = input.hasConfirmedMaterials
    ? 15
    : input.hasMaterialPlan
      ? 7
      : 0;
  if (!input.hasMaterialPlan) missing.push("Planejamento de materiais");

  const required = input.checklist.filter((item) => item.required);
  const eligible = input.checklist.filter(
    (item) => !(item.required && item.status === "BLOCKED"),
  );
  const completed = eligible.filter(
    (item) => item.status === "COMPLETED" || item.status === "SKIPPED",
  ).length;
  const checklistRatio = eligible.length ? completed / eligible.length : 0;
  const executionBase =
    input.executionStatus === "COMPLETED"
      ? 35
      : input.executionStatus === "IN_PROGRESS"
        ? 18
        : Math.round(checklistRatio * 25);
  const execution = Math.min(35, executionBase);
  if (!input.checklist.length) missing.push("Checklist operacional");
  if (required.some((item) => item.status === "BLOCKED"))
    missing.push("Item obrigatório bloqueado");

  const closure =
    (input.hasTechnicalReport ? 10 : 0) + (input.hasFinancialRecord ? 10 : 0);
  if (!input.hasTechnicalReport) missing.push("Relatório técnico");
  if (!input.hasFinancialRecord) missing.push("Registro financeiro");

  return {
    planning,
    scheduling,
    materials,
    execution,
    closure,
    total: clamp(planning + scheduling + materials + execution + closure),
    missing,
  };
}

export type ConsolidatedCost = {
  id: string;
  source: "PRICING" | "STOCK" | "FINANCE" | "EQUIPMENT";
  category: string;
  description: string;
  valueCents: number;
  date?: string;
  status: "ESTIMATED" | "REALIZED";
  reference: string;
};

export function consolidateCosts(costs: ConsolidatedCost[]): ConsolidatedCost[] {
  const unique = new Map<string, ConsolidatedCost>();
  for (const cost of costs) {
    if (!Number.isFinite(cost.valueCents) || cost.valueCents < 0) continue;
    const key = `${cost.source}:${cost.reference}:${cost.status}`;
    if (!unique.has(key)) unique.set(key, cost);
  }
  return [...unique.values()];
}

export type Profitability = {
  expectedRevenueCents?: number;
  realizedRevenueCents: number;
  expectedCostCents?: number;
  realizedCostCents: number;
  expectedMarginCents?: number;
  realizedMarginCents: number;
  expectedProfitabilityBasisPoints?: number;
  realizedProfitabilityBasisPoints?: number;
};

const safeProfitability = (margin: number, revenue: number) =>
  revenue > 0 ? Math.round((margin / revenue) * 10_000) : undefined;

export function calculateProfitability(input: {
  expectedRevenueCents?: number;
  realizedRevenueCents: number;
  expectedCostCents?: number;
  realizedCostCents: number;
}): Profitability {
  const expectedMarginCents =
    input.expectedRevenueCents === undefined || input.expectedCostCents === undefined
      ? undefined
      : input.expectedRevenueCents - input.expectedCostCents;
  const realizedMarginCents =
    input.realizedRevenueCents - input.realizedCostCents;
  return {
    ...input,
    expectedMarginCents,
    realizedMarginCents,
    expectedProfitabilityBasisPoints:
      expectedMarginCents === undefined || input.expectedRevenueCents === undefined
        ? undefined
        : safeProfitability(expectedMarginCents, input.expectedRevenueCents),
    realizedProfitabilityBasisPoints: safeProfitability(
      realizedMarginCents,
      input.realizedRevenueCents,
    ),
  };
}
