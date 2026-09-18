import { readRemoteModuleState, writeRemoteModuleState } from "@/lib/module-state/remote-module-state";
import { calculateQuote, emptyQuotesEnvelope, type QuotesEnvelope } from "./orcamentos-domain";

export const quotesStorageAdapter = {
  async load(): Promise<QuotesEnvelope> {
    const state = await readRemoteModuleState("orcamentos", emptyQuotesEnvelope());
    return {
      ...state,
      quotes: state.quotes.map((quote) => ({
        ...quote,
        ...calculateQuote(quote.items, quote.discountCents, quote.surchargeCents, quote.taxCents),
      })),
    };
  },
  async save(value: QuotesEnvelope) {
    return writeRemoteModuleState("orcamentos", value);
  },
};
