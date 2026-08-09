import { copyLegacyBrowserDataToCompany, scopedBrowserStorageKey } from "@/lib/storage/company-storage-key";
import { readRemoteModuleState, writeRemoteModuleState } from "@/lib/storage/remote-module-state";
import type { OrdemRecord } from "./ordens-types";
export interface OrdensStorageAdapter {
  list(): Promise<OrdemRecord[]>;
  replace(records: OrdemRecord[]): Promise<void>;
  nextNumber(): Promise<string>;
}
const DATA_KEY = () => scopedBrowserStorageKey("ordens");
const SEQUENCE_KEY = () => scopedBrowserStorageKey("ordens-sequence");
const normalizeOrder = (order: OrdemRecord): OrdemRecord => ({
  ...order,
  teamMembers: order.teamMembers?.length
    ? order.teamMembers
    : [order.technician].filter(Boolean),
  internalNotes: order.internalNotes ?? "",
  clientNotes: order.clientNotes ?? "",
  execution: order.execution ?? {
    status: order.status === "COMPLETED" ? "COMPLETED" : "NOT_STARTED",
    accumulatedMinutes: 0,
    sessions: [],
    workNotes: [],
  },
  checklist: order.checklist.map((item, index) => ({
    ...item,
    serviceOrderId: item.serviceOrderId ?? order.id,
    description: item.description ?? "",
    category: item.category ?? "PRE_SERVICE",
    status:
      item.status ?? (item.completedAt ? "COMPLETED" : "PENDING"),
    required: item.required ?? false,
    order: item.order ?? index,
    createdAt: item.createdAt ?? order.createdAt,
    updatedAt: item.updatedAt ?? order.updatedAt,
  })),
});
export class SyncedOrdensStorageAdapter implements OrdensStorageAdapter {
  private readLocal(): OrdemRecord[] {
    if (typeof window === "undefined") return [];
    copyLegacyBrowserDataToCompany("ordens");
    const raw = window.localStorage.getItem(DATA_KEY());
    if (!raw) {
      window.localStorage.setItem(DATA_KEY(), JSON.stringify([]));
      return [];
    }
    try { return (JSON.parse(raw) as OrdemRecord[]).map(normalizeOrder); }
    catch { throw new Error("Não foi possível ler as Ordens armazenadas."); }
  }
  private writeLocal(records: OrdemRecord[]) {
    if (typeof window !== "undefined") window.localStorage.setItem(DATA_KEY(), JSON.stringify(records));
  }
  async list() {
    try {
      const remote = await readRemoteModuleState<OrdemRecord[]>("ordens");
      if (remote.data) {
        const normalized = remote.data.map(normalizeOrder);
        this.writeLocal(normalized);
        return normalized;
      }
    } catch { /* usa espelho local */ }
    const local = this.readLocal();
    try { await writeRemoteModuleState("ordens", local); } catch { /* mantém espelho */ }
    return local;
  }
  async replace(records: OrdemRecord[]) {
    try {
      await writeRemoteModuleState("ordens", records);
      this.writeLocal(records);
    } catch { throw new Error("Não foi possível salvar e sincronizar as Ordens."); }
  }
  async nextNumber() {
    copyLegacyBrowserDataToCompany("ordens-sequence");
    const records = await this.list();
    const localFloor = typeof window === "undefined" ? 0 : Number(window.localStorage.getItem(SEQUENCE_KEY()) ?? "0");
    const highest = records.reduce((max, item) => Math.max(max, Number(item.orderNumber.split("-").at(-1)) || 0), localFloor);
    const next = highest + 1;
    if (typeof window !== "undefined") window.localStorage.setItem(SEQUENCE_KEY(), String(next));
    return `OS-${new Date().getFullYear()}-${String(next).padStart(4, "0")}`;
  }
}
export const ordensStorageAdapter: OrdensStorageAdapter = new SyncedOrdensStorageAdapter();
