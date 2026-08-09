import { copyLegacyBrowserDataToCompany, scopedBrowserStorageKey } from "@/lib/storage/company-storage-key";
import { mirroredRemoteWrite, remoteFirstRead } from "@/lib/storage/remote-module-state";
import type { ClientRecord } from "./clientes-data";

export interface ClientsStorageAdapter {
  list(): Promise<ClientRecord[]>;
  replace(records: ClientRecord[]): Promise<void>;
}
const STORAGE_KEY = () => scopedBrowserStorageKey("clientes");
function readLocal(): ClientRecord[] {
  if (typeof window === "undefined") return [];
  copyLegacyBrowserDataToCompany("clientes");
  const stored = window.localStorage.getItem(STORAGE_KEY());
  if (!stored) {
    window.localStorage.setItem(STORAGE_KEY(), JSON.stringify([]));
    return [];
  }
  try { return JSON.parse(stored) as ClientRecord[]; }
  catch { throw new Error("Não foi possível ler os clientes armazenados neste dispositivo."); }
}
function writeLocal(records: ClientRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY(), JSON.stringify(records));
}
export class SyncedClientsStorageAdapter implements ClientsStorageAdapter {
  async list() { return remoteFirstRead<ClientRecord[]>("clientes", readLocal, writeLocal); }
  async replace(records: ClientRecord[]) {
    try { await mirroredRemoteWrite("clientes", records, writeLocal); }
    catch { throw new Error("Não foi possível salvar e sincronizar os clientes."); }
  }
}
export const clientsStorageAdapter: ClientsStorageAdapter = new SyncedClientsStorageAdapter();
