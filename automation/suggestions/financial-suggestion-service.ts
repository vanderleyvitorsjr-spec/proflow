import type {
  AutomationClock,
  AutomationIdGenerator,
  AutomationTriggerEvent,
} from "../types/automation-types";
import { FinancialSuggestionRepository } from "./financial-suggestion-repository";
import {
  FINANCIAL_SUGGESTION_STATUS,
  type FinancialSuggestion,
  type FinancialSuggestionStatus,
} from "./financial-suggestion-types";

export class FinancialSuggestionService {
  constructor(
    private readonly repository: FinancialSuggestionRepository,
    private readonly clock: AutomationClock = { now: () => new Date() },
    private readonly idGenerator: AutomationIdGenerator = {
      next: () => crypto.randomUUID(),
    },
  ) {}

  list(): Promise<FinancialSuggestion[]> {
    return this.repository.list();
  }

  async createFromCompletedOrder(
    event: AutomationTriggerEvent<"SERVICE_ORDER_COMPLETED">,
  ): Promise<FinancialSuggestion> {
    const existing = await this.repository.findBySource(event.payload.serviceOrderId);
    if (existing) return existing;

    const now = this.clock.now().toISOString();
    return this.repository.save({
      id: this.idGenerator.next(),
      origin: "SERVICE_ORDER",
      sourceId: event.payload.serviceOrderId,
      orderNumber: event.payload.orderNumber,
      clientId: event.payload.clientId,
      clientName: event.payload.clientName,
      amountCents: event.payload.totalAmountCents,
      occurredAt: event.payload.completedAt,
      status: FINANCIAL_SUGGESTION_STATUS.PENDING,
      createdAt: now,
      updatedAt: now,
    });
  }

  async changeStatus(
    id: string,
    status: Extract<FinancialSuggestionStatus, "ACCEPTED" | "DISCARDED">,
  ): Promise<FinancialSuggestion> {
    const current = (await this.repository.list()).find((item) => item.id === id);
    if (!current) throw new Error("Sugestão financeira não encontrada.");
    if (
      current.status === FINANCIAL_SUGGESTION_STATUS.CONVERTED ||
      current.status === FINANCIAL_SUGGESTION_STATUS.DISCARDED
    )
      return current;
    const now = this.clock.now().toISOString();
    return this.repository.save({
      ...current,
      status,
      acceptedAt:
        status === FINANCIAL_SUGGESTION_STATUS.ACCEPTED
          ? current.acceptedAt ?? now
          : current.acceptedAt,
      discardedAt:
        status === FINANCIAL_SUGGESTION_STATUS.DISCARDED ? now : undefined,
      updatedAt: now,
    });
  }

  async markConverted(
    id: string,
    financialEntryId: string,
  ): Promise<FinancialSuggestion> {
    const current = (await this.repository.list()).find((item) => item.id === id);
    if (!current) throw new Error("Sugestão financeira não encontrada.");
    if (current.status === FINANCIAL_SUGGESTION_STATUS.CONVERTED) return current;
    if (current.status === FINANCIAL_SUGGESTION_STATUS.DISCARDED)
      throw new Error("Uma sugestão descartada não pode ser convertida.");
    if (!financialEntryId.trim())
      throw new Error("Informe o lançamento financeiro criado.");
    const now = this.clock.now().toISOString();
    return this.repository.save({
      ...current,
      status: FINANCIAL_SUGGESTION_STATUS.CONVERTED,
      acceptedAt: current.acceptedAt ?? now,
      convertedAt: now,
      financialEntryId,
      updatedAt: now,
    });
  }
}
