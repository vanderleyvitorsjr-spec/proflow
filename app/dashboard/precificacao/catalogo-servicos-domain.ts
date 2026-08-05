import { normalizeProperName } from "../../../lib/br-formatters";

export const serviceCategories = [
  "INSTALLATION", "PREVENTIVE_MAINTENANCE", "CORRECTIVE_MAINTENANCE", "CLEANING",
  "DIAGNOSIS", "TECHNICAL_VISIT", "ELECTRICAL_PROJECT", "ELECTRICAL_INSTALLATION",
  "ELECTRICAL_MAINTENANCE", "ELECTRICAL_ADAPTATION", "INFRASTRUCTURE", "CONSULTING", "OTHER",
] as const;
export type ServiceCategory = (typeof serviceCategories)[number];
export type ServiceAttendanceType = "RESIDENTIAL" | "COMMERCIAL" | "INDUSTRIAL" | "CONDOMINIUM" | "PUBLIC" | "OTHER";

export interface CatalogService {
  id: string;
  code: string;
  name: string;
  category: ServiceCategory;
  description: string;
  attendanceType: ServiceAttendanceType;
  unit: string;
  basePriceCents: number;
  estimatedCostCents: number;
  desiredMarginBasisPoints: number;
  estimatedDurationMinutes: number;
  warrantyDays?: number;
  suggestedMaterials: string[];
  suggestedTeam: string[];
  suggestedChecklist: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServicePriceHistory {
  id: string;
  serviceId: string;
  previousPriceCents: number;
  newPriceCents: number;
  previousCostCents: number;
  newCostCents: number;
  previousMarginBasisPoints: number;
  newMarginBasisPoints: number;
  responsible?: string;
  reason: string;
  createdAt: string;
}

export interface ServiceCatalogEnvelope {
  version: 1;
  nextSequence: number;
  services: CatalogService[];
  priceHistory: ServicePriceHistory[];
}

export interface PriceSimulationInput {
  materialCostCents: number;
  hourlyCostCents: number;
  hours: number;
  technicians: number;
  travelFixedCents: number;
  distanceKm: number;
  costPerKmCents: number;
  indirectCostCents: number;
  marginBasisPoints: number;
  taxBasisPoints: number;
  riskReserveBasisPoints: number;
  discountBasisPoints: number;
  surchargeCents: number;
  practicedPriceCents?: number;
}

export function calculateTransparentPrice(input: PriceSimulationInput) {
  const laborCostCents = Math.round(input.hourlyCostCents * input.hours * input.technicians);
  const travelCostCents = input.travelFixedCents + Math.round(input.distanceKm * input.costPerKmCents);
  const directCostCents = input.materialCostCents + laborCostCents + travelCostCents + input.indirectCostCents;
  const riskCents = Math.round(directCostCents * input.riskReserveBasisPoints / 10_000);
  const totalCostCents = directCostCents + riskCents;
  const minimumPriceCents = Math.round(totalCostCents * (1 + input.taxBasisPoints / 10_000));
  const suggestedPriceCents = Math.round(minimumPriceCents / Math.max(0.01, 1 - input.marginBasisPoints / 10_000));
  const finalPriceCents = Math.max(0, Math.round(suggestedPriceCents * (1 - input.discountBasisPoints / 10_000)) + input.surchargeCents);
  const practicedPriceCents = input.practicedPriceCents ?? finalPriceCents;
  const estimatedProfitCents = practicedPriceCents - totalCostCents;
  const estimatedMarginBasisPoints = practicedPriceCents > 0 ? Math.round(estimatedProfitCents / practicedPriceCents * 10_000) : 0;
  const alerts: string[] = [];
  if (!input.hours && !input.materialCostCents) alerts.push("Dados Insuficientes");
  if (practicedPriceCents < totalCostCents) alerts.push("Preço Abaixo do Custo");
  if (estimatedMarginBasisPoints < 0) alerts.push("Margem Negativa");
  else if (estimatedMarginBasisPoints < input.marginBasisPoints) alerts.push("Margem Abaixo da Meta");
  if (input.discountBasisPoints > 1_500) alerts.push("Desconto Elevado");
  return { laborCostCents, travelCostCents, totalCostCents, minimumPriceCents, suggestedPriceCents, finalPriceCents, practicedPriceCents, estimatedProfitCents, estimatedMarginBasisPoints, alerts };
}

export function serviceSnapshot(service: CatalogService) {
  return {
    sourceId: service.id, code: service.code, description: service.name, unit: service.unit,
    unitPriceCents: service.basePriceCents, estimatedCostCents: service.estimatedCostCents,
    durationMinutes: service.estimatedDurationMinutes,
    suggestedMaterials: structuredClone(service.suggestedMaterials),
    capturedAt: new Date().toISOString(),
  };
}

export function normalizeCatalogService(service: CatalogService) {
  return { ...service, name: normalizeProperName(service.name), description: service.description.trim() };
}
