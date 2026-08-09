import type { EquipmentAsset, EquipmentFinancialReconciliationStatus, EquipmentFinancialSnapshot, MaintenanceRecord } from "./equipamentos-types";
export function depreciation(asset: EquipmentAsset, at = new Date()) {
  const value = asset.acquisition.acquisitionValueCents,
    residual = Math.min(value, asset.depreciation.residualValueCents);
  if (
    asset.depreciation.mode === "NONE" ||
    !asset.depreciation.startDate ||
    !asset.depreciation.usefulLifeMonths
  )
    return { currentValueCents: value, accumulatedCents: 0, fullyDepreciated: false };
  const start = new Date(`${asset.depreciation.startDate}T12:00:00`),
    months = Math.max(
      0,
      (at.getFullYear() - start.getFullYear()) * 12 +
        at.getMonth() -
        start.getMonth() -
        (at.getDate() < start.getDate() ? 1 : 0),
    ),
    life = asset.depreciation.usefulLifeMonths,
    elapsed = Math.min(months, life),
    base = value - residual,
    accumulated = Math.floor((base * elapsed) / life),
    current = Math.max(residual, value - accumulated);
  return {
    currentValueCents: current,
    accumulatedCents: value - current,
    fullyDepreciated: elapsed >= life,
  };
}
export function financialReconciliation(currentCents: number, financial: EquipmentFinancialSnapshot | null, maintenance = false): EquipmentFinancialReconciliationStatus {
  if (!financial) return "FINANCIAL_UNAVAILABLE";
  if (financial.canceled) return "FINANCIAL_CANCELED";
  if (financial.archived) return "FINANCIAL_ARCHIVED";
  if (financial.manuallyModified) return "MANUALLY_MODIFIED";
  if (currentCents > financial.totalCents) return maintenance ? "MAINTENANCE_VALUE_INCREASED" : "EQUIPMENT_VALUE_INCREASED";
  if (currentCents < financial.totalCents) return maintenance ? "MAINTENANCE_VALUE_DECREASED" : "EQUIPMENT_VALUE_DECREASED";
  return "MATCHED";
}
export const isCritical = (a: EquipmentAsset) =>
  a.condition === "DAMAGED" || a.condition === "UNUSABLE" || a.status === "LOST";

export type WarrantyStatus = "NOT_INFORMED" | "ACTIVE" | "EXPIRING_SOON" | "EXPIRED";
export function warrantyStatus(asset: EquipmentAsset, at = new Date()): WarrantyStatus {
  if (!asset.warranty?.endDate) return "NOT_INFORMED";
  const end = new Date(`${asset.warranty.endDate}T23:59:59`);
  if (end.getTime() < at.getTime()) return "EXPIRED";
  const days = Math.ceil((end.getTime() - at.getTime()) / 86_400_000);
  return days <= 30 ? "EXPIRING_SOON" : "ACTIVE";
}
export function equipmentIndicators(
  asset: EquipmentAsset,
  maintenance: MaintenanceRecord[],
  at = new Date(),
) {
  const active = maintenance.filter((item) => item.status !== "CANCELED");
  const scheduled = active.filter((item) => item.type === "PREVENTIVE" && item.status === "SCHEDULED");
  const overdue = scheduled.some((item) => new Date(item.scheduledAt).getTime() < at.getTime());
  const dueSoon = scheduled.some((item) => {
    const days = (new Date(item.scheduledAt).getTime() - at.getTime()) / 86_400_000;
    return days >= 0 && days <= 30;
  });
  const warranty = warrantyStatus(asset, at);
  return {
    critical: isCritical(asset) || overdue,
    warrantyExpired: warranty === "EXPIRED",
    warrantyExpiring: warranty === "EXPIRING_SOON",
    maintenanceOverdue: overdue,
    maintenanceDueSoon: dueSoon,
    underMaintenance:
      asset.status === "UNDER_MAINTENANCE" || active.some((item) => item.status === "IN_PROGRESS"),
    fullyDepreciated: depreciation(asset, at).fullyDepreciated,
  };
}
