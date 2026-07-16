import { ZodError } from "zod";
import { EquipmentDomainError } from "./equipamentos-errors";
import { EquipmentRepository } from "./equipamentos-repository";
import type { EquipmentActionResult } from "./equipamentos-result";
import type {
  EquipmentFormValues,
  MaintenanceFormValues,
  EquipmentFinancialFormValues,
  WarrantyFormValues,
} from "./equipamentos-schema";
import { equipmentRelationsGateway } from "./equipamentos-relations-gateway";
import type { AssetStatus } from "./equipamentos-types";
import { EquipmentService } from "./equipamentos-service";
import { equipmentStorageAdapter } from "./equipamentos-storage-adapter";
import { depreciation } from "./equipamentos-selectors";
import type { EquipmentPricingReference } from "@/lib/contracts/equipamentos.contract";
import type { ReportEquipmentSource } from "@/lib/contracts/relatorios-equipamentos.contract";
const service = new EquipmentService(new EquipmentRepository(equipmentStorageAdapter));
async function action<T>(fn: () => Promise<T>): Promise<EquipmentActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof ZodError)
      return {
        ok: false,
        error: {
          code: "VALIDATION",
          message: e.issues[0]?.message ?? "Revise os campos.",
          fieldErrors: e.flatten().fieldErrors,
        },
      };
    if (e instanceof EquipmentDomainError)
      return { ok: false, error: { code: e.code, message: e.message } };
    return {
      ok: false,
      error: {
        code: "UNKNOWN",
        message: e instanceof Error ? e.message : "Não foi possível concluir a operação.",
      },
    };
  }
}
export const listEquipmentStateAction = () => action(() => service.list());
export const getEquipmentAction = (id: string) => action(() => service.get(id));
export const createEquipmentAction = (v: EquipmentFormValues) =>
  action(() => service.create(v));
export const updateEquipmentAction = (id: string, v: EquipmentFormValues) =>
  action(() => service.update(id, v));
export const archiveEquipmentAction = (id: string, reason: string) =>
  action(() => service.archive(id, reason));
export const listEquipmentClientsAction = () =>
  action(() => equipmentRelationsGateway.listActiveClients());
export const listEquipmentServiceOrdersAction = () =>
  action(() => equipmentRelationsGateway.listEligibleServiceOrders());
export const linkEquipmentClientAction = (assetId: string, clientId: string) =>
  action(() => service.linkClient(assetId, clientId));
export const unlinkEquipmentClientAction = (assetId: string) =>
  action(() => service.unlinkClient(assetId));
export const linkEquipmentServiceOrderAction = (
  assetId: string,
  orderId: string,
  purpose?: string,
) => action(() => service.linkServiceOrder(assetId, orderId, purpose));
export const unlinkEquipmentServiceOrderAction = (assetId: string, linkId: string) =>
  action(() => service.unlinkServiceOrder(assetId, linkId));
export const createEquipmentMaintenanceAction = (
  assetId: string,
  input: MaintenanceFormValues,
) => action(() => service.createMaintenance(assetId, input));
export const updateEquipmentMaintenanceAction = (
  id: string,
  input: MaintenanceFormValues,
) => action(() => service.updateMaintenance(id, input));
export const startEquipmentMaintenanceAction = (id: string) =>
  action(() => service.startMaintenance(id));
export const completeEquipmentMaintenanceAction = (id: string, status: AssetStatus) =>
  action(() => service.completeMaintenance(id, status));
export const cancelEquipmentMaintenanceAction = (id: string) =>
  action(() => service.cancelMaintenance(id));
export const updateEquipmentWarrantyAction = (
  assetId: string,
  input: WarrantyFormValues,
) => action(() => service.updateWarranty(assetId, input));
export const removeEquipmentWarrantyAction = (assetId: string) =>
  action(() => service.removeWarranty(assetId));
export const createEquipmentAcquisitionFinancialAction = (
  assetId: string,
  input: EquipmentFinancialFormValues,
  additionalSequence?: number,
) => action(() => service.createAcquisitionFinancial(assetId, input, additionalSequence));
export const listEquipmentFinancialAccountsAction = () =>
  action(() => service.listFinancialAccounts());
export const createEquipmentMaintenanceFinancialAction = (
  maintenanceId: string,
  input: EquipmentFinancialFormValues,
  additionalSequence?: number,
) =>
  action(() =>
    service.createMaintenanceFinancial(maintenanceId, input, additionalSequence),
  );
export const getEquipmentFinancialSummaryAction = (assetId: string) =>
  action(() => service.getEquipmentFinancialSummary(assetId));
export const reviewEquipmentFinancialAction = (
  assetId: string,
  maintenanceId: string | undefined,
  notes: string,
  updateSnapshot: boolean,
) =>
  action(() =>
    service.reviewEquipmentFinancial(assetId, maintenanceId, notes, updateSnapshot),
  );
export const cancelEquipmentFinancialBalanceAction = (
  assetId: string,
  transactionId: string,
  maintenanceId?: string,
) =>
  action(() =>
    service.cancelEquipmentFinancialBalance(assetId, transactionId, maintenanceId),
  );

const pricingReference = (
  asset: Awaited<ReturnType<EquipmentService["get"]>>,
  maintenance: Awaited<ReturnType<EquipmentService["list"]>>["maintenanceRecords"],
): EquipmentPricingReference | null => {
  if (!asset) return null;
  const monthlyDepreciationCents =
    asset.depreciation.mode === "LINEAR" && asset.depreciation.usefulLifeMonths
      ? Math.round(
          (asset.acquisition.acquisitionValueCents -
            asset.depreciation.residualValueCents) /
            asset.depreciation.usefulLifeMonths,
        )
      : 0;
  const completed = maintenance.filter(
    (item) => item.assetId === asset.id && item.status === "COMPLETED",
  );
  return {
    id: asset.id,
    internalCode: asset.internalCode,
    name: asset.name,
    ownership: asset.ownership,
    status: asset.status,
    condition: asset.condition,
    currentValueCents: depreciation(asset).currentValueCents,
    monthlyDepreciationCents,
    estimatedMaintenanceMonthlyCents: completed.length
      ? Math.round(completed.reduce((sum, item) => sum + item.costCents, 0) / 12)
      : 0,
    archived: Boolean(asset.archivedAt),
    updatedAt: asset.updatedAt,
  };
};

export const listEquipmentPricingReferencesAction = () =>
  action(async () => {
    const state = await service.list();
    return state.assets.map((asset) =>
      pricingReference(asset, state.maintenanceRecords)!,
    );
  });
export const getEquipmentPricingReferenceAction = (id: string) =>
  action(async () => {
    const state = await service.list();
    return pricingReference(
      state.assets.find((asset) => asset.id === id) ?? null,
      state.maintenanceRecords,
    );
  });
export const listEquipmentReportAction = () =>
  action(async (): Promise<ReportEquipmentSource> => {
    const state = await service.list();
    return {
      assets: state.assets.map((asset) => {
        const values = depreciation(asset);
        return {
          id: asset.id, createdAt: asset.createdAt, updatedAt: asset.updatedAt,
          archivedAt: asset.archivedAt, category: asset.category, ownership: asset.ownership,
          status: asset.status, condition: asset.condition,
          acquisitionDate: asset.acquisition.acquisitionDate,
          acquisitionValueCents: asset.acquisition.acquisitionValueCents,
          currentValueCents: values.currentValueCents,
          accumulatedDepreciationCents: values.accumulatedCents,
          warrantyEndDate: asset.warranty?.endDate,
        };
      }),
      maintenance: state.maintenanceRecords.map((item) => ({
        id: item.id, assetId: item.assetId, status: item.status, type: item.type,
        costCents: item.costCents, scheduledAt: item.scheduledAt, completedAt: item.completedAt,
        canceledAt: item.canceledAt, serviceOrderId: item.serviceOrderId,
        hasFinancialLink: Boolean(item.financialTransactionId),
      })),
      links: state.serviceOrderLinks.map((item) => ({ assetId: item.assetId,
        serviceOrderId: item.serviceOrderId, linkedAt: item.linkedAt, unlinkedAt: item.unlinkedAt })),
    };
  });
