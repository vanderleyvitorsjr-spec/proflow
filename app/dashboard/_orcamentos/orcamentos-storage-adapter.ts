"use client";

import { scopedBrowserStorageKey } from "@/lib/storage/company-storage-key";
import { emptyQuotesEnvelope, type QuotesEnvelope } from "./orcamentos-domain";

const key = () => scopedBrowserStorageKey("orcamentos", 1);

export const quotesStorageAdapter = {
  load(): QuotesEnvelope {
    const raw = localStorage.getItem(key());
    if (!raw) return emptyQuotesEnvelope();
    try {
      const parsed = JSON.parse(raw) as Partial<QuotesEnvelope>;
      return parsed.version === 1 && Array.isArray(parsed.quotes) && Number.isInteger(parsed.nextSequence)
        ? parsed as QuotesEnvelope
        : emptyQuotesEnvelope();
    } catch {
      return emptyQuotesEnvelope();
    }
  },
  save(value: QuotesEnvelope) {
    localStorage.setItem(key(), JSON.stringify(value));
  },
};
