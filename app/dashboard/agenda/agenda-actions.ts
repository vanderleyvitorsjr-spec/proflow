import {
  getOrdemAction,
  listOrdensAction,
  updateOrdemAction,
} from "@/app/dashboard/ordens/ordens-actions";
import type { OrdemFormValues } from "@/app/dashboard/ordens/ordens-schema";
import type { OrdemRecord } from "@/app/dashboard/ordens/ordens-types";
import { AgendaRepository } from "./agenda-repository";
import type { AgendaEventFormValues } from "./agenda-schema";
import { AgendaService } from "./agenda-service";
import { agendaStorageAdapter } from "./agenda-storage-adapter";
import type { AgendaDisplayEvent, AgendaIndependentEvent } from "./agenda-types";
import type { ReportAgendaEvent } from "@/lib/contracts/relatorios-agenda.contract";
const service = new AgendaService(new AgendaRepository(agendaStorageAdapter));
const statusMap = {
  OPEN: "PENDING",
  SCHEDULED: "CONFIRMED",
  IN_TRANSIT: "IN_TRANSIT",
  IN_PROGRESS: "IN_PROGRESS",
  WAITING_PART: "PENDING",
  COMPLETED: "COMPLETED",
  CANCELED: "CANCELED",
  OVERDUE: "PENDING",
} as const;
const typeMap = {
  CLIMATIZATION: "INSTALLATION",
  ELECTRICAL: "ELECTRICAL",
  PREVENTIVE: "PREVENTIVE",
  CORRECTIVE: "CORRECTIVE",
  INSTALLATION: "INSTALLATION",
} as const;
const independentDisplay = (event: AgendaIndependentEvent): AgendaDisplayEvent => ({
  id: event.id,
  origin: "INDEPENDENT",
  clientId: event.clientId,
  title: event.title,
  customer: event.clientName ?? "Evento interno",
  type: event.type,
  status: event.status,
  priority: event.priority,
  startAt: `${event.date}T${event.startTime}:00`,
  endAt: `${event.date}T${event.endTime}:00`,
  technician: event.responsible,
  address: event.address,
  city: event.city,
  state: event.state,
  description: event.description,
  notes: event.notes,
  createdAt: event.createdAt,
  updatedAt: event.updatedAt,
  history: event.history,
});
const orderDisplay = (order: OrdemRecord): AgendaDisplayEvent => {
  const start = new Date(`${order.scheduledDate}T${order.scheduledTime}:00`),
    end = new Date(start.getTime() + order.estimatedDurationMinutes * 60000),
    local = (value: Date) =>
      `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}T${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}:00`;
  return {
    id: `os-${order.id}`,
    origin: "SERVICE_ORDER",
    orderId: order.id,
    clientId: order.clientId,
    title: order.title,
    customer: order.clientName,
    serviceOrderNumber: order.orderNumber,
    type: typeMap[order.category],
    status: statusMap[order.status],
    priority: order.priority,
    startAt: local(start),
    endAt: local(end),
    technician: order.technician,
    address: order.address,
    city: order.city,
    state: order.state,
    description: order.description,
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    history: order.history.map((item) => ({
      ...item,
      type: item.type === "CREATED" ? "OS_SYNC" : "UPDATED",
    })),
  };
};
export async function listAgendaEventsAction() {
  const [independent, orders] = await Promise.all([
    service.listIndependent(),
    listOrdensAction(),
  ]);
  return [...independent.map(independentDisplay), ...orders.map(orderDisplay)];
}
export async function getAgendaEventAction(id: string) {
  if (id.startsWith("os-")) {
    const order = await getOrdemAction(id.slice(3));
    return order ? orderDisplay(order) : null;
  }
  const event = await service.getIndependent(id);
  return event ? independentDisplay(event) : null;
}
export async function createAgendaEventAction(input: AgendaEventFormValues) {
  const all = await listAgendaEventsAction();
  return independentDisplay(await service.create(input, all));
}
export async function updateAgendaEventAction(id: string, input: AgendaEventFormValues) {
  const all = await listAgendaEventsAction();
  if (!id.startsWith("os-"))
    return independentDisplay(await service.update(id, input, all));
  service.assertAvailability(input, all, id);
  const order = await getOrdemAction(id.slice(3));
  if (!order) throw new Error("Ordem vinculada não encontrada.");
  const value: OrdemFormValues = {
    clientId: order.clientId,
    crmLeadId: order.crmLeadId ?? "",
    title: input.title,
    description: input.description,
    category: order.category,
    priority: input.priority,
    status: order.status,
    technician: input.responsible,
    address: input.address,
    city: input.city,
    state: input.state,
    scheduledDate: input.date,
    scheduledTime: input.startTime,
    estimatedDurationMinutes: Math.round(
      (new Date(`${input.date}T${input.endTime}:00`).getTime() -
        new Date(`${input.date}T${input.startTime}:00`).getTime()) /
        60000,
    ),
    estimatedValue: order.estimatedValue,
    notes: input.notes,
    checklistText: order.checklist.map((item) => item.title).join("\n"),
    equipmentText: order.equipment.join("\n"),
    materialsText: order.reservedMaterials.join("\n"),
  };
  return orderDisplay(await updateOrdemAction(order.id, value));
}
export const cancelAgendaEventAction = (id: string) => {
  if (id.startsWith("os-")) throw new Error("Cancele a Ordem de Serviço vinculada.");
  return service.cancel(id);
};
export const archiveAgendaEventAction = (id: string) => {
  if (id.startsWith("os-"))
    throw new Error("Eventos de OS não podem ser arquivados pela Agenda.");
  return service.archive(id);
};
export const listAgendaReportAction = async (): Promise<ReportAgendaEvent[]> =>
  (await listAgendaEventsAction()).map((event) => ({
    id: event.id,
    origin: event.origin,
    orderId: event.orderId,
    createdAt: event.createdAt,
    startAt: event.startAt,
    endAt: event.endAt,
    status: event.status,
    type: event.type,
    technician: event.technician,
    city: event.city,
    state: event.state,
  }));

export async function rescheduleAgendaEventAction(
  id: string,
  date: string,
  startTime: string,
) {
  const event = await getAgendaEventAction(id);
  if (!event) throw new Error("Evento não encontrado.");
  const durationMinutes = Math.max(
    15,
    Math.round(
      (new Date(event.endAt).getTime() - new Date(event.startAt).getTime()) / 60000,
    ),
  );
  const start = new Date(`${date}T${startTime}:00`);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  const endTime = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
  const input: AgendaEventFormValues = {
    title: event.title,
    type: event.type,
    description: event.description ?? event.title,
    responsible: event.technician,
    clientId: event.clientId ?? "",
    date,
    startTime,
    endTime,
    address: event.address,
    city: event.city,
    state: event.state,
    priority: event.priority,
    status: event.status,
    notes: event.notes ?? "",
    recurrence: "NONE",
    occurrences: 1,
  };
  return updateAgendaEventAction(id, input);
}
