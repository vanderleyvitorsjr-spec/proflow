"use client";
import { scopedBrowserStorageKey } from "@/lib/storage/company-storage-key";
import { emptyEquipmentTechnical, type EquipmentTechnicalEnvelope } from "./equipamento-tecnico-domain";
const key = () => scopedBrowserStorageKey("equipamentos-historico-tecnico", 1);
export const equipmentTechnicalStorageAdapter = {
  load(): EquipmentTechnicalEnvelope {
    const raw = localStorage.getItem(key()); if (!raw) return emptyEquipmentTechnical();
    try { const value = JSON.parse(raw) as EquipmentTechnicalEnvelope; return value.version === 1 ? value : emptyEquipmentTechnical(); } catch { return emptyEquipmentTechnical(); }
  },
  save(value: EquipmentTechnicalEnvelope) { localStorage.setItem(key(), JSON.stringify(value)); },
};
