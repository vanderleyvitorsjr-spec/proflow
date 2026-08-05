"use client";
import { scopedBrowserStorageKey } from "@/lib/storage/company-storage-key";
import { emptyPurchases, type PurchasesEnvelope } from "./compras-domain";
const key = () => scopedBrowserStorageKey("compras", 1);
export const purchasesStorageAdapter = {
  load(): PurchasesEnvelope {
    const raw = localStorage.getItem(key());
    if (!raw) return emptyPurchases();
    try {
      const value = JSON.parse(raw) as PurchasesEnvelope;
      return value.version === 1 && Array.isArray(value.quotations) && Array.isArray(value.orders) ? value : emptyPurchases();
    } catch { return emptyPurchases(); }
  },
  save(value: PurchasesEnvelope) { localStorage.setItem(key(), JSON.stringify(value)); },
};
