import type { FinancialSuggestionStorageAdapter } from "./financial-suggestion-storage-adapter";
import type { FinancialSuggestion } from "./financial-suggestion-types";

export class FinancialSuggestionRepository {
  constructor(private readonly storage: FinancialSuggestionStorageAdapter) {}

  list(): Promise<FinancialSuggestion[]> {
    return this.storage.list();
  }

  async findBySource(sourceId: string): Promise<FinancialSuggestion | null> {
    return (await this.storage.list()).find(
      (item) => item.origin === "SERVICE_ORDER" && item.sourceId === sourceId,
    ) ?? null;
  }

  async save(record: FinancialSuggestion): Promise<FinancialSuggestion> {
    const records = await this.storage.list();
    await this.storage.replace(
      records.some((item) => item.id === record.id)
        ? records.map((item) => (item.id === record.id ? record : item))
        : [record, ...records],
    );
    return record;
  }
}
