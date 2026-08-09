import { copyLegacyBrowserDataToCompany, scopedBrowserStorageKey } from "@/lib/storage/company-storage-key";
import { mirroredRemoteWrite, remoteFirstRead } from "@/lib/storage/remote-module-state";
import type { CrmLeadRecord } from "./crm-types";

export interface CrmStorageAdapter {
  list(): Promise<CrmLeadRecord[]>;
  replace(records: CrmLeadRecord[]): Promise<void>;
}
const STORAGE_KEY = () => scopedBrowserStorageKey("crm");

function readLocal(): CrmLeadRecord[] {
  if (typeof window === "undefined") return [];
  copyLegacyBrowserDataToCompany("crm");
  const stored = window.localStorage.getItem(STORAGE_KEY());
  if (!stored) {
    window.localStorage.setItem(STORAGE_KEY(), JSON.stringify([]));
    return [];
  }
  try { return JSON.parse(stored) as CrmLeadRecord[]; }
  catch { throw new Error("Não foi possível ler os leads armazenados neste dispositivo."); }
}
function writeLocal(records: CrmLeadRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY(), JSON.stringify(records));
}

export class SyncedCrmStorageAdapter implements CrmStorageAdapter {
  async list() {
    return remoteFirstRead<CrmLeadRecord[]>("crm", readLocal, writeLocal);
  }
  async replace(records: CrmLeadRecord[]) {
    try { await mirroredRemoteWrite("crm", records, writeLocal); }
    catch { throw new Error("Não foi possível salvar e sincronizar os leads."); }
  }
}
export const crmStorageAdapter: CrmStorageAdapter = new SyncedCrmStorageAdapter();
