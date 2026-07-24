export const FINANCIAL_SUGGESTION_STATUS = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  DISCARDED: "DISCARDED",
  CONVERTED: "CONVERTED",
} as const;

export type FinancialSuggestionStatus =
  (typeof FINANCIAL_SUGGESTION_STATUS)[keyof typeof FINANCIAL_SUGGESTION_STATUS];

export type FinancialSuggestion = {
  id: string;
  origin: "SERVICE_ORDER";
  sourceId: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  amountCents: number;
  occurredAt: string;
  status: FinancialSuggestionStatus;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  discardedAt?: string;
  convertedAt?: string;
  financialEntryId?: string;
};
