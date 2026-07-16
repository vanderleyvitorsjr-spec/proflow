import type {
  ServiceOrderFinancialSnapshot,
  ServiceOrderStockReference,
  ServiceOrderTechnicalReference,
} from "@/lib/contracts/ordens.contract";
import { PendingAgendaIntegration } from "./ordens-agenda-port";
import type { ServiceOrderStatus } from "./ordens-data";
import { OrdensRepository } from "./ordens-repository";
import type { OrdemFormValues } from "./ordens-schema";
import { OrdensService } from "./ordens-service";
import { ordensStorageAdapter } from "./ordens-storage-adapter";
import type { OrdemChecklistItem, OrdemRecord } from "./ordens-types";

const service = new OrdensService(
  new OrdensRepository(ordensStorageAdapter),
  new PendingAgendaIntegration(),
);
export const listOrdensAction = () => service.list();
export const getOrdemAction = (id: string) => service.get(id);
export const createOrdemAction = (input: OrdemFormValues) => service.create(input);
export const updateOrdemAction = (id: string, input: OrdemFormValues) =>
  service.update(id, input);
export const changeOrdemStatusAction = (id: string, status: ServiceOrderStatus) =>
  service.changeStatus(id, status);
export const updateOrdemChecklistAction = (id: string, items: OrdemChecklistItem[]) =>
  service.updateChecklist(id, items);
export const cancelOrdemAction = (id: string, reason: string) =>
  service.cancel(id, reason);
export const archiveOrdemAction = (id: string) => service.archive(id);
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
