import type { ServiceOrderFinancialSnapshot } from "@/lib/contracts/ordens.contract";
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
