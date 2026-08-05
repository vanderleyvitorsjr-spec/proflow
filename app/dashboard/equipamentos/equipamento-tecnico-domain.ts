export type TechnicalMeasurementType = "TEMPERATURE" | "PRESSURE" | "VOLTAGE" | "CURRENT" | "RESISTANCE" | "INSULATION" | "OTHER";
export type PreventiveFrequency = "WEEKLY" | "MONTHLY" | "BIMONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "ANNUAL" | "CUSTOM";
export interface TechnicalMeasurement {
  id: string; equipmentId: string; serviceOrderId?: string; type: TechnicalMeasurementType;
  value: number; unit: string; notes?: string; responsible?: string; measuredAt: string;
}
export interface EquipmentTechnicalEvent {
  id: string; equipmentId: string; serviceOrderId?: string; type: "INSTALLATION" | "MAINTENANCE" | "DIAGNOSIS" | "PART_REPLACEMENT" | "MEASUREMENT" | "WARRANTY";
  title: string; description?: string; responsible?: string; occurredAt: string;
}
export interface PreventivePlan {
  id: string; equipmentId: string; frequency: PreventiveFrequency; interval: number;
  lastMaintenanceAt?: string; nextMaintenanceAt: string; active: boolean; notes?: string;
}
export interface EquipmentTechnicalEnvelope {
  version: 1; measurements: TechnicalMeasurement[]; events: EquipmentTechnicalEvent[]; preventivePlans: PreventivePlan[];
}
export const emptyEquipmentTechnical = (): EquipmentTechnicalEnvelope => ({ version: 1, measurements: [], events: [], preventivePlans: [] });
export function calculateNextMaintenance(baseDate: string, frequency: PreventiveFrequency, interval = 1) {
  const date = new Date(`${baseDate.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) throw new Error("Informe uma data válida.");
  const days: Partial<Record<PreventiveFrequency, number>> = { WEEKLY: 7, BIMONTHLY: 60, QUARTERLY: 90, SEMIANNUAL: 182, ANNUAL: 365 };
  if (frequency === "MONTHLY") date.setMonth(date.getMonth() + interval);
  else date.setDate(date.getDate() + (days[frequency] ?? interval) * interval);
  return date.toISOString();
}
export function maintenanceSituation(nextMaintenanceAt: string, now = new Date()) {
  const target = new Date(nextMaintenanceAt);
  const days = Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
  return days < 0 ? "OVERDUE" : days <= 15 ? "DUE_SOON" : "CURRENT";
}
export function warrantySituation(endDate?: string, now = new Date()) {
  if (!endDate) return "NOT_INFORMED";
  const days = Math.ceil((new Date(endDate).getTime() - now.getTime()) / 86_400_000);
  return days < 0 ? "EXPIRED" : days <= 30 ? "EXPIRING_SOON" : "CURRENT";
}
