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

const orderSequence = (order: OrdemRecord) =>
  Number(String(order.orderNumber ?? "").split("-").at(-1)) || 0;

/** Aceita o formato atual ({ records, sequence }) e o antigo (lista de Ordens). */
function toRemoteState(value: unknown): OrdensRemoteState {
  if (Array.isArray(value)) {
    const records = value as OrdemRecord[];
    return { records, sequence: records.reduce((max, item) => Math.max(max, orderSequence(item)), 0) };
  }
  const candidate = (value ?? {}) as Partial<OrdensRemoteState>;
  return {
    records: Array.isArray(candidate.records) ? candidate.records : [],
    sequence: Number.isFinite(candidate.sequence) ? Number(candidate.sequence) : 0,
  };
}

export class RemoteOrdensStorageAdapter implements OrdensStorageAdapter {
  private async state(): Promise<OrdensRemoteState> {
    const value = await readRemoteModuleState<unknown>("ordens", {
      // Empresa nova começa sem Ordens fictícias e com numeração a partir de 0001.
      records: [],
      sequence: 0,
    });
    const state = toRemoteState(value);
    // Formato antigo (lista simples de Ordens, importada do navegador): regrava
    // já no formato atual, preservando todas as Ordens.
    // Se outra tela regravar ao mesmo tempo, a gravação desta é dispensável.
    if (Array.isArray(value)) await writeRemoteModuleState("ordens", state).catch(() => undefined);
    return state;
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
      (max, item) => Math.max(max, orderSequence(item)),
      state.sequence,
    );
    const next = highest + 1;
    await writeRemoteModuleState("ordens", { ...state, sequence: next });
    return `OS-${new Date().getFullYear()}-${String(next).padStart(4, "0")}`;
  }
}
export const ordensStorageAdapter: OrdensStorageAdapter = new RemoteOrdensStorageAdapter();
