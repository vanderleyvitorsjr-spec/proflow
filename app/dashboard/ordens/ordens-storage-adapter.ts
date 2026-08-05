import { readRemoteModuleState, writeRemoteModuleState } from "@/lib/module-state/remote-module-state";
import { serviceOrders } from "./ordens-data";
import type { OrdemRecord } from "./ordens-types";
export interface OrdensStorageAdapter {
  list(): Promise<OrdemRecord[]>;
  replace(records: OrdemRecord[]): Promise<void>;
  nextNumber(): Promise<string>;
}
const initial: OrdemRecord[] = serviceOrders.map((order, index) => ({
  id: order.id,
  orderNumber: order.orderNumber,
  clientId: `client-${Math.min(index + 1, 6)}`,
  clientName: order.customer,
  title: order.title,
  description: order.description,
  category: order.category,
  priority: order.priority,
  status: order.status,
  technician: order.technician,
  address: order.address,
  city: order.city,
  state: order.state,
  scheduledDate: order.scheduledAt.slice(0, 10),
  scheduledTime: order.scheduledAt.slice(11, 16),
  estimatedDurationMinutes:
    Number.parseInt(order.estimatedDuration) * 60 +
    (order.estimatedDuration.includes("30") ? 30 : 0),
  estimatedValue: order.amount,
  notes: "",
  checklist: [
    {
      id: `${order.id}-check`,
      serviceOrderId: order.id,
      title: "Checklist operacional inicial",
      category: "PRE_SERVICE",
      status: order.checklistProgress === 100 ? "COMPLETED" : "PENDING",
      required: false,
      responsible: order.technician,
      completedAt: order.checklistProgress === 100 ? order.scheduledAt : undefined,
      order: 0,
      createdAt: "2026-07-01T12:00:00.000Z",
      updatedAt: "2026-07-15T12:00:00.000Z",
    },
  ],
  equipment: [],
  reservedMaterials: order.materialsPending
    ? [`${order.materialsPending} materiais pendentes`]
    : [],
  createdAt: "2026-07-01T12:00:00.000Z",
  updatedAt: "2026-07-15T12:00:00.000Z",
  history: [
    {
      id: `${order.id}-created`,
      type: "CREATED",
      description: "Ordem criada.",
      createdAt: "2026-07-01T12:00:00.000Z",
    },
  ],
}));
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
      records: initial,
      sequence: 106,
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
