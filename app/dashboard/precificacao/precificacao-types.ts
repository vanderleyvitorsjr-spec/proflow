export type PricingCategory =
  | "INSTALLATION"
  | "MAINTENANCE"
  | "CLEANING"
  | "COMPONENT_REPLACEMENT"
  | "INFRASTRUCTURE"
  | "RECURRING"
  | "RESIDENTIAL_ELECTRICAL"
  | "COMMERCIAL_ELECTRICAL"
  | "INSPECTION"
  | "OTHER";
export type PricingComponentType =
  | "MATERIAL"
  | "LABOR"
  | "EQUIPMENT"
  | "TRAVEL"
  | "TAX"
  | "COMMISSION"
  | "OVERHEAD"
  | "OTHER";
export type PricingSimulationStatus =
  "DRAFT" | "READY" | "APPLIED" | "OUTDATED" | "ARCHIVED";
export type PricingIndicator = "LOSS" | "LOW_MARGIN" | "HEALTHY" | "PREMIUM";
export type CalculationMode =
  | "FIXED"
  | "QUANTITY"
  | "PERCENTAGE"
  | "PER_HOUR"
  | "PER_USE"
  | "PERCENT_OF_DIRECT_COST"
  | "ALLOCATION_RATE";
export type ExternalCostMethod =
  "STOCK_AVERAGE" | "DERIVED_PER_HOUR" | "MANUAL_PER_HOUR" | "MANUAL_PER_USE";
export type PricingDivergence =
  | "STOCK_ITEM_ARCHIVED"
  | "STOCK_ITEM_UNAVAILABLE"
  | "STOCK_COST_INCREASED"
  | "STOCK_COST_DECREASED"
  | "STOCK_AVAILABILITY_CHANGED"
  | "EQUIPMENT_ARCHIVED"
  | "EQUIPMENT_UNAVAILABLE"
  | "EQUIPMENT_STATUS_CHANGED"
  | "EQUIPMENT_CONDITION_CHANGED"
  | "EQUIPMENT_VALUE_CHANGED"
  | "EQUIPMENT_DEPRECIATION_CHANGED"
  | "EQUIPMENT_MAINTENANCE_COST_CHANGED"
  | "MANUALLY_MODIFIED";
export type PricingCommercialDivergence = "PRICING_VERSION_NEWER" | "SERVICE_ORDER_PRICE_CHANGED" | "SERVICE_ORDER_CLIENT_CHANGED" | "SERVICE_ORDER_CANCELED" | "SERVICE_ORDER_ARCHIVED" | "SERVICE_ORDER_UNAVAILABLE" | "CRM_LEAD_UPDATED" | "CRM_CLIENT_MISMATCH" | "CLIENT_ARCHIVED" | "SIMULATION_MANUALLY_MODIFIED";
export type PricingPriceType = "MINIMUM" | "RECOMMENDED" | "PREMIUM" | "FINAL" | "MANUAL";
export type PricingApplication = { id: string; serviceOrderId: string; serviceOrderNumberSnapshot: string; serviceOrderTitleSnapshot: string; serviceOrderClientIdSnapshot: string; serviceOrderUpdatedAtSnapshot: string; simulationVersion: number; revisionId: string; priceType: PricingPriceType; priceCents: number; calculatedPriceCents: number; costCents: number; profitCents: number; marginBasisPoints: number; appliedAt: string; supersededAt?: string; reason?: string; manuallyModified: boolean };
export type PricingClientSnapshot = { id: string; name: string; updatedAt: string };
export type PricingCrmSnapshot = { id: string; title: string; customerName: string; stage: string; converted: boolean; clientId?: string; updatedAt: string };
export type PricingServiceOrderSnapshot = { id: string; number: string; title: string; clientId: string; currentPriceCents: number; status: string; updatedAt: string };
export type PricingCostDivergence = {
  componentId: string;
  sourceType: "STOCK" | "EQUIPMENT";
  codes: PricingDivergence[];
  currentCostCents?: number;
  usedCostCents: number;
  currentAvailableQuantity?: number;
};
export type PricingSourceSnapshot = {
  kind: "STOCK" | "EQUIPMENT";
  id: string;
  internalCode: string;
  name: string;
  unit?: string;
  unitScale?: number;
  averageCostCents?: number;
  availableQuantity?: number;
  ownership?: string;
  status?: string;
  condition?: string;
  currentValueCents?: number;
  monthlyDepreciationCents?: number;
  estimatedMaintenanceMonthlyCents?: number;
  method: ExternalCostMethod;
  standardMonthlyHours?: number;
  sourceUpdatedAt: string;
  capturedAt: string;
};
export type PercentageBasis = "NONE" | "COST" | "SALE_PRICE";
export type PricingHistory = {
  id: string;
  type: string;
  description: string;
  createdAt: string;
};
export type PricingSnapshot = {
  sourceLabel: string;
  unit?: string;
  unitCostCents?: number;
  capturedAt: string;
};
export type PricingEquipmentDetails = {
  method: "PER_HOUR" | "PER_USE";
  maintenanceCents: number;
  energyCents: number;
  wearCents: number;
};
export type PricingTravelDetails = {
  origin: string;
  destination: string;
  distanceMilliKm: number;
  estimatedTimeMinutes: number;
  costPerKmCents: number;
  tollCents: number;
  parkingCents: number;
  lodgingCents: number;
  mealsCents: number;
  otherCents: number;
};
export type PricingCostComponent = {
  id: string;
  type: PricingComponentType;
  sourceId?: string;
  stockItemId?: string;
  equipmentId?: string;
  sourceType: string;
  description: string;
  quantity: number;
  unit: string;
  unitCostCents: number;
  totalCostCents: number;
  fixedAmountCents?: number;
  percentageRateBasisPoints?: number;
  percentageBasis: PercentageBasis;
  wastePercentBasisPoints?: number;
  calculationMode: CalculationMode;
  snapshot?: PricingSnapshot;
  sourceSnapshot?: PricingSourceSnapshot;
  sourceUpdatedAt?: string;
  sourceCostCents?: number;
  divergenceReviewedAt?: string;
  divergenceNotes?: string;
  manualCostReason?: string;
  insufficientStockConfirmed?: boolean;
  equipmentDetails?: PricingEquipmentDetails;
  travelDetails?: PricingTravelDetails;
  overheadCategory?:
    | "ENERGY"
    | "RENT"
    | "INTERNET"
    | "PHONE"
    | "ACCOUNTING"
    | "SOFTWARE"
    | "MARKETING"
    | "ADMINISTRATIVE"
    | "OTHER";
  manuallyModified: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
export type PricingComposition = {
  id: string;
  name: string;
  description: string;
  componentIds: string[];
  enabled: boolean;
  order: number;
  notes?: string;
};
export type LaborProfile = {
  id: string;
  name: string;
  hourlyCostCents: number;
  burdenRateBasisPoints: number;
  fixedAdditionalCents: number;
  active: boolean;
  notes?: string;
};
export type TravelDefaults = {
  origin: string;
  destination: string;
  distanceMilliKm: number;
  estimatedTimeMinutes: number;
  costPerKmCents: number;
  tollCents: number;
  parkingCents: number;
  lodgingCents: number;
  mealsCents: number;
  otherCents: number;
};
export type CommercialRules = {
  taxRateBasisPoints: number;
  taxBasis: "COST" | "SALE_PRICE" | "FIXED";
  taxFixedCents: number;
  commissionRateBasisPoints: number;
  commissionFixedCents: number;
  minimumMarginBasisPoints: number;
  recommendedMarginBasisPoints: number;
  premiumMarginBasisPoints: number;
  discountRateBasisPoints: number;
  discountFixedCents: number;
  belowMinimumConfirmed: boolean;
};
export type PricingTemplate = {
  id: string;
  sequence: number;
  code: string;
  name: string;
  description: string;
  serviceType: string;
  category: PricingCategory;
  compositions: PricingComposition[];
  costComponents: PricingCostComponent[];
  laborProfiles: string[];
  equipmentProfiles: string[];
  travelDefaults: TravelDefaults;
  overheadDefaults: PricingCostComponent[];
  commercialRules: CommercialRules;
  currentVersion: number;
  active: boolean;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
  history: PricingHistory[];
};
export type PricingParameters = { description: string; category: PricingCategory };
export type PricingResult = {
  directCostCents: number;
  overheadCents: number;
  totalCostCents: number;
  breakEvenCents: number;
  minimumPriceCents: number;
  recommendedPriceCents: number;
  premiumPriceCents: number;
  promotionalPriceCents: number;
  discountCents: number;
  taxCents: number;
  commissionCents: number;
  profitCents: number;
  effectiveMarginBasisPoints: number;
  markupBasisPoints: number;
  discountImpactCents: number;
  differenceToMinimumCents: number;
  indicator: PricingIndicator;
};
export type ReversePricingInput = { targetPriceCents: number };
export type ReversePricingResult = {
  targetPriceCents: number;
  maximumCostCents: number;
  resultingMarginBasisPoints: number;
  resultingProfitCents: number;
  differenceToRecommendedCents: number;
  differenceToMinimumCents: number;
  loss: boolean;
  requiredReductionCents: number;
  impactComponents: string[];
};
export type PricingSimulationRevision = {
  id: string;
  version: number;
  parameters: PricingParameters;
  costComponents: PricingCostComponent[];
  commercialRules: CommercialRules;
  resultSnapshot: PricingResult;
  origin: string;
  createdAt: string;
  actorSnapshot?: string;
  reason?: string;
};
export type PricingSimulation = {
  id: string;
  sequence: number;
  title: string;
  templateId?: string;
  scenarioGroupId?: string;
  scenarioLabel: string;
  clientId?: string;
  clientSnapshot?: PricingClientSnapshot;
  crmLeadId?: string;
  crmSnapshot?: PricingCrmSnapshot;
  serviceOrderId?: string;
  serviceOrderSnapshot?: PricingServiceOrderSnapshot;
  applications: PricingApplication[];
  appliedRevisionId?: string;
  appliedVersion?: number;
  appliedPrice?: number;
  divergenceReviewedAt?: string;
  divergenceNotes?: string;
  parameters: PricingParameters;
  costComponents: PricingCostComponent[];
  commercialRules: CommercialRules;
  reversePricingInput?: ReversePricingInput;
  currentVersion: number;
  status: PricingSimulationStatus;
  appliedSnapshot?: { serviceOrderId: string; priceCents: number; appliedAt: string };
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  revisions: PricingSimulationRevision[];
  history: PricingHistory[];
};
export type PricingPreferences = {
  view: "calculator" | "services" | "simulations";
  listView: "list" | "cards";
  searchTerm: string;
  statusFilter: string;
  categoryFilter: string;
  indicatorFilter: string;
  templateFilter: string;
  scenarioFilter: string;
  includeArchived: boolean;
  standardMonthlyEquipmentHours: number;
};
export type PricingStorageState = {
  version: 3;
  revision: number;
  nextTemplateSequence: number;
  nextSimulationSequence: number;
  templates: PricingTemplate[];
  simulations: PricingSimulation[];
  laborProfiles: LaborProfile[];
  preferences: PricingPreferences;
};
