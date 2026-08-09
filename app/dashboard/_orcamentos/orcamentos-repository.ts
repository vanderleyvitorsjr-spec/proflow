"use client";

import { quotesStorageAdapter } from "./orcamentos-storage-adapter";
import type { ProfessionalQuote, QuotesEnvelope } from "./orcamentos-domain";

export const quotesRepository = {
  read: (): QuotesEnvelope => quotesStorageAdapter.load(),
  save(envelope: QuotesEnvelope) {
    quotesStorageAdapter.save(envelope);
    return envelope;
  },
  find(id: string) {
    return this.read().quotes.find((quote) => quote.id === id);
  },
  upsert(quote: ProfessionalQuote, envelope: QuotesEnvelope = quotesStorageAdapter.load()) {
    const exists = envelope.quotes.some((item) => item.id === quote.id);
    quotesStorageAdapter.save({
      ...envelope,
      quotes: exists
        ? envelope.quotes.map((item) => item.id === quote.id ? quote : item)
        : [quote, ...envelope.quotes],
    });
    return quote;
  },
};
