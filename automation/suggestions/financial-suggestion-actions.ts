import { FinancialSuggestionRepository } from "./financial-suggestion-repository";
import { FinancialSuggestionService } from "./financial-suggestion-service";
import { financialSuggestionStorageAdapter } from "./financial-suggestion-storage-adapter";
import { FINANCIAL_SUGGESTION_STATUS } from "./financial-suggestion-types";

export const financialSuggestionService = new FinancialSuggestionService(
  new FinancialSuggestionRepository(financialSuggestionStorageAdapter),
);

export const listFinancialSuggestionsAction = () =>
  financialSuggestionService.list();

export const acceptFinancialSuggestionAction = (id: string) =>
  financialSuggestionService.changeStatus(
    id,
    FINANCIAL_SUGGESTION_STATUS.ACCEPTED,
  );

export const discardFinancialSuggestionAction = (id: string) =>
  financialSuggestionService.changeStatus(
    id,
    FINANCIAL_SUGGESTION_STATUS.DISCARDED,
  );

export const convertFinancialSuggestionAction = (
  id: string,
  financialEntryId: string,
) => financialSuggestionService.markConverted(id, financialEntryId);
