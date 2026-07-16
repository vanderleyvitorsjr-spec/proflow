import type { EquipmentAsset } from "./equipamentos-types";
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
export const isCritical = (a: EquipmentAsset) =>
  a.condition === "DAMAGED" || a.condition === "UNUSABLE" || a.status === "LOST";
