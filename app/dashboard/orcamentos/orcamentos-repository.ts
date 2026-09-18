import { quotesStorageAdapter } from "./orcamentos-storage-adapter";
import type { ProfessionalQuote, QuotesEnvelope } from "./orcamentos-domain";

export const quotesRepository = {
  read: (): Promise<QuotesEnvelope> => quotesStorageAdapter.load(),
  async save(envelope: QuotesEnvelope) {
    return quotesStorageAdapter.save(envelope);
  },
  async find(id: string) {
    return (await this.read()).quotes.find((quote) => quote.id === id);
  },
  async upsert(quote: ProfessionalQuote, envelope?: QuotesEnvelope) {
    const current = envelope ?? await quotesStorageAdapter.load();
    const exists = current.quotes.some((item) => item.id === quote.id);
    await quotesStorageAdapter.save({
      ...current,
      quotes: exists
        ? current.quotes.map((item) => item.id === quote.id ? quote : item)
        : [quote, ...current.quotes],
    });
    return quote;
  },
};
