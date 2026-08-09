export type OperationalItemStateStatus = "OPEN" | "SNOOZED" | "RESOLVED" | "REOPENED" | "HIDDEN";
export type OperationalStateHistory = {
  id: string;
  type: "SNOOZED" | "RESOLVED" | "REOPENED" | "HIDDEN";
  reason: string;
  note?: string;
  responsible?: string;
  result?: string;
  priority?: string;
  occurredAt: string;
};

export type OperationalItemState = {
  insightId: string;
  status: OperationalItemStateStatus;
  reason?: string;
  note?: string;
  responsible?: string;
  result?: string;
  priority?: string;
  snoozedUntil?: string;
  updatedAt: string;
  history?: OperationalStateHistory[];
};

export type OperationalStateEnvelope = {
  version: 1 | 2;
  items: OperationalItemState[];
};

export const emptyOperationalState = (): OperationalStateEnvelope => ({
  version: 2,
  items: [],
});

export function updateOperationalItemState(
  envelope: OperationalStateEnvelope,
  next: OperationalItemState,
): OperationalStateEnvelope {
  return {
    version: 2,
    items: [
      ...envelope.items.filter((item) => item.insightId !== next.insightId),
      next,
    ],
  };
}

export function tomorrow(now = new Date()) {
  const value = new Date(now);
  value.setDate(value.getDate() + 1);
  value.setHours(9, 0, 0, 0);
  return value;
}

export function nextBusinessDay(now = new Date()) {
  const value = tomorrow(now);
  while ([0, 6].includes(value.getDay())) value.setDate(value.getDate() + 1);
  return value;
}

export function snoozeOperationalItem(
  current: OperationalItemState | undefined,
  input: {
    insightId: string;
    until: string;
    reason: string;
    note?: string;
    responsible?: string;
    priority?: string;
  },
  now = new Date(),
): OperationalItemState {
  if (current?.status === "RESOLVED")
    throw new Error("Reabra o item antes de adiar.");
  const until = new Date(input.until);
  if (Number.isNaN(until.getTime()) || until.getTime() <= now.getTime())
    throw new Error("Escolha uma nova data e hora posterior ao momento atual.");
  if (!input.reason.trim()) throw new Error("Informe o motivo do adiamento.");
  if (input.reason === "Outro" && !input.note?.trim())
    throw new Error("Descreva o motivo do adiamento.");
  const occurredAt = now.toISOString();
  const history = current?.history ?? [];
  return {
    insightId: input.insightId,
    status: "SNOOZED",
    reason: input.reason.trim(),
    note: input.note?.trim() || undefined,
    responsible: input.responsible?.trim() || undefined,
    priority: input.priority,
    snoozedUntil: until.toISOString(),
    updatedAt: occurredAt,
    history: [...history, {
      id: `${input.insightId}-snoozed-${occurredAt}`,
      type: "SNOOZED",
      reason: input.reason.trim(),
      note: input.note?.trim() || undefined,
      responsible: input.responsible?.trim() || undefined,
      priority: input.priority,
      occurredAt,
    }],
  };
}

export function resolveOperationalItem(
  current: OperationalItemState | undefined,
  input: {
    insightId: string;
    resolution: string;
    note?: string;
    responsible?: string;
    result: string;
  },
  now = new Date(),
): OperationalItemState {
  if (!input.resolution.trim()) throw new Error("Informe como a pendência foi resolvida.");
  const occurredAt = now.toISOString();
  return {
    insightId: input.insightId,
    status: "RESOLVED",
    reason: input.resolution.trim(),
    note: input.note?.trim() || undefined,
    responsible: input.responsible?.trim() || undefined,
    result: input.result,
    updatedAt: occurredAt,
    history: [...(current?.history ?? []), {
      id: `${input.insightId}-resolved-${occurredAt}`,
      type: "RESOLVED",
      reason: input.resolution.trim(),
      note: input.note?.trim() || undefined,
      responsible: input.responsible?.trim() || undefined,
      result: input.result,
      occurredAt,
    }],
  };
}

export function reopenOperationalItem(
  current: OperationalItemState,
  reason: string,
  responsible: string | undefined,
  now = new Date(),
) {
  if (current.status !== "RESOLVED")
    throw new Error("Somente itens resolvidos podem ser reabertos.");
  if (!reason.trim()) throw new Error("Informe o motivo da reabertura.");
  const occurredAt = now.toISOString();
  return {
    ...current,
    status: "REOPENED" as const,
    reason: reason.trim(),
    responsible: responsible?.trim() || undefined,
    snoozedUntil: undefined,
    updatedAt: occurredAt,
    history: [...(current.history ?? []), {
      id: `${current.insightId}-reopened-${occurredAt}`,
      type: "REOPENED" as const,
      reason: reason.trim(),
      responsible: responsible?.trim() || undefined,
      occurredAt,
    }],
  };
}

export function visibleOperationalInsightIds(
  insightIds: string[],
  envelope: OperationalStateEnvelope,
  now = new Date(),
) {
  const stateById = new Map(envelope.items.map((item) => [item.insightId, item]));
  return insightIds.filter((id) => {
    const state = stateById.get(id);
    if (!state || state.status === "OPEN") return true;
    if (
      state.status === "SNOOZED" &&
      state.snoozedUntil &&
      new Date(state.snoozedUntil).getTime() <= now.getTime()
    )
      return true;
    return false;
  });
}

export function priorityExplanation(input: {
  priority: string;
  title: string;
  description: string;
}) {
  const label =
    input.priority === "CRITICAL"
      ? "Crítica"
      : input.priority === "WARNING"
        ? "Alta"
        : "Informativa";
  const reason = /atrasad|vencid/i.test(`${input.title} ${input.description}`)
    ? "existe um prazo vencido"
    : /sem |falta|abaixo/i.test(`${input.title} ${input.description}`)
      ? "há uma informação ou recurso necessário ausente"
      : "a situação pode afetar o fluxo operacional";
  return `Prioridade ${label} porque ${reason}.`;
}
