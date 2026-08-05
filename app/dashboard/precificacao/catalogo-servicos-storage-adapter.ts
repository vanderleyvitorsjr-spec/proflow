"use client";
import { scopedBrowserStorageKey } from "@/lib/storage/company-storage-key";
import type { ServiceCatalogEnvelope } from "./catalogo-servicos-domain";
const key = () => scopedBrowserStorageKey("catalogo-servicos", 1);
const empty = (): ServiceCatalogEnvelope => ({ version: 1, nextSequence: 1, services: [], priceHistory: [] });
export const serviceCatalogStorageAdapter = {
  load(): ServiceCatalogEnvelope {
    const raw = localStorage.getItem(key());
    if (!raw) return empty();
    try {
      const value = JSON.parse(raw) as ServiceCatalogEnvelope;
      return value.version === 1 && Array.isArray(value.services) && Array.isArray(value.priceHistory) ? value : empty();
    } catch { return empty(); }
  },
  save(value: ServiceCatalogEnvelope) { localStorage.setItem(key(), JSON.stringify(value)); },
};
