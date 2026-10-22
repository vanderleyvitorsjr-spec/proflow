import { readRemoteModuleState, writeRemoteModuleState } from "@/lib/module-state/remote-module-state";
import type { OrdemRecord } from "./ordens-types";
export interface OrdensStorageAdapter {
  list(): Promise<OrdemRecord[]>;
  replace(records: OrdemRecord[]): Promise<void>;
  nextNumber(): Promise<string>;
}
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
export type OrdensRemoteState = { records: OrdemRecord[]; sequence: number };

export class RemoteOrdensStorageAdapter implements OrdensStorageAdapter {
  private async state(): Promise<OrdensRemoteState> {
    return readRemoteModuleState<OrdensRemoteState>("ordens", {
      // Empresa nova começa sem Ordens fictícias e com numeração a partir de 0001.
      records: [],
      sequence: 0,
    });
  }

  async list() {
    return (await this.state()).records.map(normalizeOrder);
  }

  async replace(records: OrdemRecord[]) {
    const state = await this.state();
    await writeRemoteModuleState("ordens", { ...state, records });
  }

  async nextNumber() {
    const state = await this.state();
    const highest = state.records.reduce(
      (max, item) => Math.max(max, Number(item.orderNumber.split("-").at(-1)) || 0),
      state.sequence,
    );
    const next = highest + 1;
    await writeRemoteModuleState("ordens", { ...state, sequence: next });
    return `OS-${new Date().getFullYear()}-${String(next).padStart(4, "0")}`;
  }
}
export const ordensStorageAdapter: OrdensStorageAdapter = new RemoteOrdensStorageAdapter();
