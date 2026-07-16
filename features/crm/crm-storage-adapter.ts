import { initialCrmLeads } from "./crm-data";
import type { CrmLeadRecord } from "./crm-types";

export interface CrmStorageAdapter { list(): Promise<CrmLeadRecord[]>; replace(records: CrmLeadRecord[]): Promise<void> }
const STORAGE_KEY = "proflow:crm:v1";

export class LocalCrmStorageAdapter implements CrmStorageAdapter {
  async list() {
    if (typeof window === "undefined") return [];
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) { await this.replace(initialCrmLeads); return structuredClone(initialCrmLeads); }
    try { return JSON.parse(stored) as CrmLeadRecord[]; } catch { throw new Error("Não foi possível ler os leads armazenados neste dispositivo."); }
  }
  async replace(records: CrmLeadRecord[]) {
    if (typeof window === "undefined") return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); } catch { throw new Error("Não foi possível salvar os leads neste dispositivo."); }
  }
}
export const crmStorageAdapter: CrmStorageAdapter = new LocalCrmStorageAdapter();
