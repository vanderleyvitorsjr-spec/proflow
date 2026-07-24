import { createServiceOrderReceivableAction } from "../../app/dashboard/financeiro/financeiro-actions";
import type { FinancialObligationFormValues } from "../../app/dashboard/financeiro/financeiro-schema";
import { recordAutomationFinancialConversionAction } from "../admin/automation-admin-actions";
import {
  convertFinancialSuggestionAction,
  listFinancialSuggestionsAction,
} from "../suggestions/financial-suggestion-actions";
import {
  FinancialSuggestionConversionService,
  type FinancialDraftInput,
} from "../suggestions/financial-suggestion-conversion-service";

const service = new FinancialSuggestionConversionService({
  async getSuggestion(id) {
    return (await listFinancialSuggestionsAction()).find((item) => item.id === id) ?? null;
  },
  async createReceivable(serviceOrderId, input) {
    const result = await createServiceOrderReceivableAction(
      serviceOrderId,
      input as FinancialObligationFormValues,
    );
    if (!result.ok) throw new Error(result.error.message);
    return {
      id: result.data.transaction.id,
      existing: result.data.existing,
    };
  },
  markConverted: convertFinancialSuggestionAction,
  recordAudit: recordAutomationFinancialConversionAction,
});

export const confirmFinancialSuggestionDraftAction = (
  suggestionId: string,
  input: FinancialDraftInput,
) => service.confirm(suggestionId, input);
