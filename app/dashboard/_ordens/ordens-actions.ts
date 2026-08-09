import type {
  ServiceOrderFinancialSnapshot,
  ServiceOrderStockReference,
  ServiceOrderTechnicalReference,
  ServiceOrderPricingReference,
  ApplyServiceOrderPricingInput,
} from "@/lib/contracts/ordens.contract";
import type { ReportServiceOrder } from "@/lib/contracts/relatorios-ordens.contract";
import { PendingAgendaIntegration } from "./ordens-agenda-port";
import type { ServiceOrderStatus } from "./ordens-data";
import { OrdensRepository } from "./ordens-repository";
import type { OrdemFormValues } from "./ordens-schema";
import { OrdensService } from "./ordens-service";
import { ordensStorageAdapter } from "./ordens-storage-adapter";
import type { OrdemChecklistItem, OrdemMedia, OrdemRecord, OrdemTechnicalReport, OrdemWorkNote } from "./ordens-types";
import { publishServiceOrderCompleted } from "@/automation/integrations/service-order-completed";

const service = new OrdensService(
  new OrdensRepository(ordensStorageAdapter),
  new PendingAgendaIntegration(),
);
export const listOrdensAction = () => service.list();
export const getOrdemAction = (id: string) => service.get(id);
export const createOrdemAction = (input: OrdemFormValues) => service.create(input);
export const updateOrdemAction = async (id: string, input: OrdemFormValues) => {
  const previous = await service.get(id);
  const order = await service.update(id, input);
  if (previous?.status !== "COMPLETED" && order.status === "COMPLETED")
    await publishServiceOrderCompleted(order);
  return order;
};
export const changeOrdemStatusAction = async (
  id: string,
  status: ServiceOrderStatus,
) => {
  const previous = await service.get(id);
  const order = await service.changeStatus(id, status);
  if (previous?.status !== "COMPLETED" && order.status === "COMPLETED")
    await publishServiceOrderCompleted(order);
  return order;
};
export const updateOrdemChecklistAction = (id: string, items: OrdemChecklistItem[]) =>
  service.updateChecklist(id, items);
export const cancelOrdemAction = (id: string, reason: string) =>
  service.cancel(id, reason);
export const archiveOrdemAction = (id: string) => service.archive(id);
export const startOrdemExecutionAction = (id: string) => service.startExecution(id);
export const pauseOrdemExecutionAction = (id: string) => service.pauseExecution(id);
export const resumeOrdemExecutionAction = (id: string) => service.resumeExecution(id);
export const completeOrdemExecutionAction = async (id: string) => {
  const previous = await service.get(id);
  const order = await service.completeExecution(id);
  if (previous?.status !== "COMPLETED") await publishServiceOrderCompleted(order);
  return order;
};
export const addOrdemWorkNoteAction = (
  id: string,
  visibility: OrdemWorkNote["visibility"],
  text: string,
) => service.addWorkNote(id, visibility, text);
export const updateOrdemTeamAction = (id: string, members: string[]) =>
  service.updateTeam(id, members);
export const addOrdemMediaAction = (id: string, media: OrdemMedia) => service.addMedia(id, media);
export const removeOrdemMediaAction = (id: string, mediaId: string) => service.removeMedia(id, mediaId);
export const updateOrdemTechnicalReportAction = (id: string, report: OrdemTechnicalReport) => service.updateTechnicalReport(id, report);

const snapshot = (order: OrdemRecord | null): ServiceOrderFinancialSnapshot | null =>
  order
    ? {
        id: order.id,
        number: order.orderNumber,
        clientId: order.clientId,
        title: order.title,
        estimatedValueCents: Math.round(order.estimatedValue * 100),
        status: order.status,
        canceled: Boolean(order.canceledAt) || order.status === "CANCELED",
        archived: Boolean(order.archivedAt),
        updatedAt: order.updatedAt,
      }
    : null;
export const getServiceOrderFinancialSnapshotAction = async (id: string) =>
  snapshot((await ordensStorageAdapter.list()).find((order) => order.id === id) ?? null);
export const listServiceOrderFinancialSnapshotsAction = async () =>
  (await ordensStorageAdapter.list()).map(
    (order) => snapshot(order) as ServiceOrderFinancialSnapshot,
  );
export const serviceOrderExistsPublicAction = async (id: string) =>
  (await ordensStorageAdapter.list()).some((order) => order.id === id);
const technicalReference = (order: OrdemRecord): ServiceOrderTechnicalReference => ({
  id: order.id,
  number: order.orderNumber,
  title: order.title,
  clientId: order.clientId || undefined,
  canceled: Boolean(order.canceledAt) || order.status === "CANCELED",
  archived: Boolean(order.archivedAt),
});
export const getServiceOrderTechnicalReferenceAction = async (id: string) => {
  const order = (await ordensStorageAdapter.list()).find((item) => item.id === id);
  return order ? technicalReference(order) : null;
};
export const listServiceOrderTechnicalReferencesAction = async () =>
  (await ordensStorageAdapter.list()).map(technicalReference);

const stockReference = (order: OrdemRecord): ServiceOrderStockReference => ({
  id: order.id,
  number: order.orderNumber,
  title: order.title,
  clientId: order.clientId,
  status: order.status,
  canceled: Boolean(order.canceledAt) || order.status === "CANCELED",
  archived: Boolean(order.archivedAt),
  updatedAt: order.updatedAt,
  stockReservationAllowed:
    !order.archivedAt && !order.canceledAt && order.status !== "CANCELED",
});
export const getServiceOrderStockReferenceAction = async (id: string) => {
  const order = (await ordensStorageAdapter.list()).find((item) => item.id === id);
  return order ? stockReference(order) : null;
};
export const listServiceOrderStockReferencesAction = async () =>
  (await ordensStorageAdapter.list()).map(stockReference);
const pricingReference = (order: OrdemRecord): ServiceOrderPricingReference => ({
  id: order.id,
  number: order.orderNumber,
  title: order.title,
  clientId: order.clientId,
  currentPriceCents: Math.round(order.estimatedValue * 100),
  status: order.status,
  canceled: Boolean(order.canceledAt) || order.status === "CANCELED",
  archived: Boolean(order.archivedAt),
  updatedAt: order.updatedAt,
  appliedPricing: order.appliedPricing,
});
export const listEligibleServiceOrderPricingReferencesAction = async () =>
  (await service.list())
    .filter(
      (order) => !order.archivedAt && !order.canceledAt && order.status !== "CANCELED",
    )
    .map(pricingReference);
export const getServiceOrderPricingReferenceAction = async (id: string) => {
  const order = await service.get(id);
  return order ? pricingReference(order) : null;
};
export const applyServiceOrderPricingAction = (input: ApplyServiceOrderPricingInput) =>
  service.applyPricing(input);
export const listServiceOrdersReportAction = async (): Promise<ReportServiceOrder[]> =>
  (await service.list()).map((order) => ({
    id: order.id,
    clientId: order.clientId,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    canceledAt: order.canceledAt,
    archivedAt: order.archivedAt,
    completedAt: order.status === "COMPLETED" ? order.updatedAt : undefined,
    scheduledAt: `${order.scheduledDate}T${order.scheduledTime}:00`,
    category: order.category,
    status: order.status,
    technician: order.technician,
    city: order.city,
    state: order.state,
    estimatedDurationMinutes: order.estimatedDurationMinutes,
    estimatedValue: order.estimatedValue,
    appliedPriceCents: order.appliedPricing?.priceCents,
    equipmentCount: order.equipment.length,
    materialCount: order.reservedMaterials.length,
  }));
