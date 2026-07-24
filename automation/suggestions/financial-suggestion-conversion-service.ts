import type { FinancialSuggestion } from "./financial-suggestion-types";

export type FinancialDraftInput = {
  title: string;
  description: string;
  category: string;
  accountId: string;
  total: string;
  issueDate: string;
  competenceDate: string;
  firstDueDate: string;
  installmentCount: number;
  supplier: string;
  customerName: string;
  clientId: string;
  notes: string;
};

export interface FinancialSuggestionConversionPort {
  getSuggestion(id: string): Promise<FinancialSuggestion | null>;
  createReceivable(
    serviceOrderId: string,
    input: FinancialDraftInput,
  ): Promise<{ id: string; existing: boolean }>;
  markConverted(id: string, financialEntryId: string): Promise<FinancialSuggestion>;
  recordAudit(input: {
    suggestionId: string;
    serviceOrderId: string;
    financialEntryId: string;
  }): Promise<void>;
}

export class FinancialSuggestionConversionService {
  constructor(private readonly port: FinancialSuggestionConversionPort) {}

  async confirm(suggestionId: string, input: FinancialDraftInput) {
    const suggestion = await this.port.getSuggestion(suggestionId);
    if (!suggestion) throw new Error("Sugestão financeira não encontrada.");
    if (suggestion.status === "DISCARDED")
      throw new Error("Uma sugestão descartada não pode ser convertida.");
    if (suggestion.status === "CONVERTED" && suggestion.financialEntryId)
      return {
        suggestion,
        financialEntryId: suggestion.financialEntryId,
        existing: true,
      };
    const receivable = await this.port.createReceivable(suggestion.sourceId, input);
    const converted = await this.port.markConverted(suggestion.id, receivable.id);
    await this.port.recordAudit({
      suggestionId: suggestion.id,
      serviceOrderId: suggestion.sourceId,
      financialEntryId: receivable.id,
    });
    return {
      suggestion: converted,
      financialEntryId: receivable.id,
      existing: receivable.existing,
    };
  }
}
