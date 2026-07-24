import type { FinancialSuggestion } from "./financial-suggestion-types";

export interface FinancialSuggestionStorageAdapter {
  list(): Promise<FinancialSuggestion[]>;
  replace(records: FinancialSuggestion[]): Promise<void>;
}

const STORAGE_KEY = "proflow:automation:financial-suggestions:v1";

export class LocalFinancialSuggestionStorageAdapter
  implements FinancialSuggestionStorageAdapter
{
  async list(): Promise<FinancialSuggestion[]> {
    if (typeof window === "undefined") return [];
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored) as FinancialSuggestion[];
      return parsed.map((item) => ({
        ...item,
        status:
          item.status === "PENDING" ||
          item.status === "ACCEPTED" ||
          item.status === "DISCARDED" ||
          item.status === "CONVERTED"
            ? item.status
            : "PENDING",
      }));
    } catch {
      throw new Error("Não foi possível ler as sugestões financeiras armazenadas.");
    }
  }

  async replace(records: FinancialSuggestion[]): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
      throw new Error("Não foi possível salvar as sugestões financeiras.");
    }
  }
}

export const financialSuggestionStorageAdapter =
  new LocalFinancialSuggestionStorageAdapter();
