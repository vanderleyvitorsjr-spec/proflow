export const GOAL_CATEGORIES = [
  "REVENUE",
  "COMPLETED_ORDERS",
  "NEW_CLIENTS",
  "CRM_CONVERSION",
  "AVERAGE_TICKET",
  "OVERDUE_REDUCTION",
  "RECEIPTS",
  "MARGIN",
  "TEAM_PRODUCTIVITY",
] as const;
export type GoalCategory = (typeof GOAL_CATEGORIES)[number];

export const GOAL_UNITS = ["CURRENCY", "QUANTITY", "PERCENTAGE", "DAYS", "HOURS"] as const;
export type GoalUnit = (typeof GOAL_UNITS)[number];
export type GoalPeriod = "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "ANNUAL" | "CUSTOM";
export type GoalStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "NEAR_TARGET"
  | "ACHIEVED"
  | "EXCEEDED"
  | "OVERDUE"
  | "CLOSED";

export type ExecutiveGoalHistory = {
  id: string;
  type: "CREATED" | "UPDATED" | "ACTIVATED" | "DEACTIVATED" | "DUPLICATED";
  description: string;
  createdAt: string;
};

export type ExecutiveGoal = {
  id: string;
  name: string;
  category: GoalCategory;
  targetValue: number;
  realizedValue?: number;
  unit: GoalUnit;
  period: GoalPeriod;
  startDate: string;
  endDate: string;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  history: ExecutiveGoalHistory[];
};

export type GoalProgress = {
  available: boolean;
  percentage?: number;
  remaining?: number;
  daysRemaining?: number;
  status: GoalStatus;
  message: string;
};

export function calculateGoalProgress(
  goal: Pick<
    ExecutiveGoal,
    "targetValue" | "realizedValue" | "startDate" | "endDate" | "active"
  >,
  now = new Date(),
): GoalProgress {
  const end = new Date(`${goal.endDate}T23:59:59`);
  const start = new Date(`${goal.startDate}T00:00:00`);
  const realized = goal.realizedValue;
  if (!goal.active)
    return { available: false, status: "CLOSED", message: "Meta Encerrada" };
  if (
    goal.targetValue <= 0 ||
    realized === undefined ||
    !Number.isFinite(realized)
  )
    return {
      available: false,
      status: now < start ? "NOT_STARTED" : "IN_PROGRESS",
      message: now < start ? "Meta Ainda Não Iniciada" : "Dados Insuficientes",
    };
  const percentage = Math.max(0, (realized / goal.targetValue) * 100);
  const daysRemaining = Math.max(
    0,
    Math.ceil((end.getTime() - now.getTime()) / 86_400_000),
  );
  const status: GoalStatus =
    percentage > 100
      ? "EXCEEDED"
      : percentage === 100
        ? "ACHIEVED"
        : now > end
          ? "OVERDUE"
          : percentage >= 85
            ? "NEAR_TARGET"
            : now < start
              ? "NOT_STARTED"
              : "IN_PROGRESS";
  return {
    available: true,
    percentage,
    remaining: Math.max(0, goal.targetValue - realized),
    daysRemaining,
    status,
    message: `${percentage.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}% da Meta`,
  };
}

export function createGoal(
  input: Omit<ExecutiveGoal, "status" | "createdAt" | "updatedAt" | "history">,
  now: string,
): ExecutiveGoal {
  if (input.name.trim().length < 3) throw new Error("Informe um nome para a meta.");
  if (!input.startDate || !input.endDate || input.endDate < input.startDate)
    throw new Error("Informe um período válido para a meta.");
  const goal = {
    ...input,
    name: input.name.trim(),
    createdAt: now,
    updatedAt: now,
    status: "NOT_STARTED" as GoalStatus,
    history: [{
      id: `${input.id}-created`,
      type: "CREATED" as const,
      description: "Meta criada.",
      createdAt: now,
    }],
  };
  return { ...goal, status: calculateGoalProgress(goal, new Date(now)).status };
}

export function updateGoal(
  current: ExecutiveGoal,
  changes: Partial<Pick<ExecutiveGoal, "name" | "targetValue" | "period" | "startDate" | "endDate" | "active">>,
  now: string,
) {
  const next = { ...current, ...changes, updatedAt: now };
  return {
    ...next,
    status: calculateGoalProgress(next, new Date(now)).status,
    history: [...current.history, {
      id: `${current.id}-updated-${now}`,
      type: changes.active === undefined ? "UPDATED" as const : changes.active ? "ACTIVATED" as const : "DEACTIVATED" as const,
      description: changes.active === undefined ? "Meta atualizada." : changes.active ? "Meta ativada." : "Meta desativada.",
      createdAt: now,
    }],
  };
}

export function duplicateGoal(current: ExecutiveGoal, id: string, now: string) {
  return {
    ...current,
    id,
    name: `${current.name} - Cópia`,
    active: false,
    status: "CLOSED" as GoalStatus,
    createdAt: now,
    updatedAt: now,
    history: [{
      id: `${id}-duplicated`,
      type: "DUPLICATED" as const,
      description: `Meta duplicada a partir de ${current.name}.`,
      createdAt: now,
    }],
  };
}

export type ExecutiveGoalsEnvelope = { version: 1; goals: ExecutiveGoal[] };
export const emptyExecutiveGoals = (): ExecutiveGoalsEnvelope => ({ version: 1, goals: [] });

export function deriveGoalRealizedValues(
  metrics: ReadonlyArray<{ id: string; title: string; value?: number; formattedValue: string }>,
) {
  const find = (pattern: RegExp) =>
    metrics.find((metric) => pattern.test(`${metric.id} ${metric.title}`));
  const numeric = (pattern: RegExp) => find(pattern)?.value;
  const currency = (pattern: RegExp) => {
    const metric = find(pattern);
    if (!metric || metric.value === undefined) return undefined;
    return /R\$/i.test(metric.formattedValue)
      ? Math.round(metric.value * 100)
      : metric.value;
  };
  return {
    REVENUE: currency(/faturamento|receita/i),
    COMPLETED_ORDERS: numeric(/ordens.*conclu|conclu.*ordens/i),
    NEW_CLIENTS: numeric(/novos.*clientes|clientes.*novos/i),
    CRM_CONVERSION: numeric(/convers[aã]o/i),
    AVERAGE_TICKET: currency(/ticket.*m[eé]dio/i),
    OVERDUE_REDUCTION: numeric(/ordens.*atras|atras.*ordens/i),
    RECEIPTS: currency(/recebimento|recebido/i),
    MARGIN: numeric(/margem/i),
    TEAM_PRODUCTIVITY: numeric(/produtividade/i),
  } satisfies Partial<Record<GoalCategory, number | undefined>>;
}
