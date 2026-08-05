"use client";

import { scopedBrowserStorageKey } from "@/lib/storage/company-storage-key";
import {
  emptyOperationalState,
  type OperationalStateEnvelope,
} from "./central-operacional-state";

const key = () => scopedBrowserStorageKey("central-operacional", 1);

export const centralOperationalStateStorageAdapter = {
  load(): OperationalStateEnvelope {
    const raw = window.localStorage.getItem(key());
    if (!raw) return emptyOperationalState();
    try {
      const parsed = JSON.parse(raw) as Partial<OperationalStateEnvelope>;
      return (parsed.version === 1 || parsed.version === 2) && Array.isArray(parsed.items)
        ? {
            version: 2,
            items: parsed.items.map((item) => ({
              ...item,
              history: Array.isArray(item.history) ? item.history : [],
            })),
          }
        : emptyOperationalState();
    } catch {
      return emptyOperationalState();
    }
  },
  save(value: OperationalStateEnvelope) {
    window.localStorage.setItem(key(), JSON.stringify(value));
  },
};
