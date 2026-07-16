import { z } from "zod";
import { calculatePricing } from "./precificacao-selectors";
import { PricingDomainError } from "./precificacao-errors";
import type {
  CommercialRules,
  PricingCostComponent,
  PricingPreferences,
  PricingSimulation,
  PricingStorageState,
  PricingTemplate,
} from "./precificacao-types";
const KEY = "proflow:precificacao:v1",
  BACKUP = `${KEY}:backup`;
const history = z.object({
  id: z.string(),
  type: z.string(),
  description: z.string(),
  createdAt: z.string().datetime(),
});
const component = z.object({
  id: z.string(),
  type: z.enum([
    "MATERIAL",
    "LABOR",
    "EQUIPMENT",
    "TRAVEL",
    "TAX",
    "COMMISSION",
    "OVERHEAD",
    "OTHER",
  ]),
  sourceId: z.string().optional(),
  stockItemId: z.string().optional(),
  equipmentId: z.string().optional(),
  sourceType: z.string(),
  description: z.string(),
  quantity: z.number().positive(),
  unit: z.string(),
  unitCostCents: z.number().int().nonnegative(),
  totalCostCents: z.number().int().nonnegative(),
  fixedAmountCents: z.number().int().nonnegative().optional(),
  percentageRateBasisPoints: z.number().int().min(0).max(10000).optional(),
  percentageBasis: z.enum(["NONE", "COST", "SALE_PRICE"]),
  wastePercentBasisPoints: z.number().int().min(0).max(10000).optional(),
  calculationMode: z.enum([
    "FIXED",
    "QUANTITY",
    "PERCENTAGE",
    "PER_HOUR",
    "PER_USE",
    "PERCENT_OF_DIRECT_COST",
    "ALLOCATION_RATE",
  ]),
  snapshot: z
    .object({
      sourceLabel: z.string(),
      unit: z.string().optional(),
      unitCostCents: z.number().int().optional(),
      capturedAt: z.string(),
    })
    .optional(),
  sourceSnapshot: z
    .object({
      kind: z.enum(["STOCK", "EQUIPMENT"]),
      id: z.string(),
      internalCode: z.string(),
      name: z.string(),
      unit: z.string().optional(),
      unitScale: z.number().int().positive().optional(),
      averageCostCents: z.number().int().nonnegative().optional(),
      availableQuantity: z.number().int().optional(),
      ownership: z.string().optional(),
      status: z.string().optional(),
      condition: z.string().optional(),
      currentValueCents: z.number().int().nonnegative().optional(),
      monthlyDepreciationCents: z.number().int().nonnegative().optional(),
      estimatedMaintenanceMonthlyCents: z.number().int().nonnegative().optional(),
      method: z.enum([
        "STOCK_AVERAGE",
        "DERIVED_PER_HOUR",
        "MANUAL_PER_HOUR",
        "MANUAL_PER_USE",
      ]),
      standardMonthlyHours: z.number().positive().optional(),
      sourceUpdatedAt: z.string(),
      capturedAt: z.string(),
    })
    .optional(),
  sourceUpdatedAt: z.string().optional(),
  sourceCostCents: z.number().int().nonnegative().optional(),
  divergenceReviewedAt: z.string().optional(),
  divergenceNotes: z.string().optional(),
  manualCostReason: z.string().optional(),
  insufficientStockConfirmed: z.boolean().optional(),
  equipmentDetails: z
    .object({
      method: z.enum(["PER_HOUR", "PER_USE"]),
      maintenanceCents: z.number().int().nonnegative(),
      energyCents: z.number().int().nonnegative(),
      wearCents: z.number().int().nonnegative(),
    })
    .optional(),
  travelDetails: z
    .object({
      origin: z.string(),
      destination: z.string(),
      distanceMilliKm: z.number().int().nonnegative(),
      estimatedTimeMinutes: z.number().int().nonnegative(),
      costPerKmCents: z.number().int().nonnegative(),
      tollCents: z.number().int().nonnegative(),
      parkingCents: z.number().int().nonnegative(),
      lodgingCents: z.number().int().nonnegative(),
      mealsCents: z.number().int().nonnegative(),
      otherCents: z.number().int().nonnegative(),
    })
    .optional(),
  overheadCategory: z
    .enum([
      "ENERGY",
      "RENT",
      "INTERNET",
      "PHONE",
      "ACCOUNTING",
      "SOFTWARE",
      "MARKETING",
      "ADMINISTRATIVE",
      "OTHER",
    ])
    .optional(),
  manuallyModified: z.boolean(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
const rules = z.object({
  taxRateBasisPoints: z.number().int(),
  taxBasis: z.enum(["COST", "SALE_PRICE", "FIXED"]),
  taxFixedCents: z.number().int(),
  commissionRateBasisPoints: z.number().int(),
  commissionFixedCents: z.number().int(),
  minimumMarginBasisPoints: z.number().int(),
  recommendedMarginBasisPoints: z.number().int(),
  premiumMarginBasisPoints: z.number().int(),
  discountRateBasisPoints: z.number().int(),
  discountFixedCents: z.number().int(),
  belowMinimumConfirmed: z.boolean(),
});
const travel = z.object({
  origin: z.string(),
  destination: z.string(),
  distanceMilliKm: z.number().int(),
  estimatedTimeMinutes: z.number().int(),
  costPerKmCents: z.number().int(),
  tollCents: z.number().int(),
  parkingCents: z.number().int(),
  lodgingCents: z.number().int(),
  mealsCents: z.number().int(),
  otherCents: z.number().int(),
});
const composition = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  componentIds: z.array(z.string()),
  enabled: z.boolean(),
  order: z.number().int(),
  notes: z.string().optional(),
});
const result = z.object({
  directCostCents: z.number().int(),
  overheadCents: z.number().int(),
  totalCostCents: z.number().int(),
  breakEvenCents: z.number().int(),
  minimumPriceCents: z.number().int(),
  recommendedPriceCents: z.number().int(),
  premiumPriceCents: z.number().int(),
  promotionalPriceCents: z.number().int(),
  discountCents: z.number().int(),
  taxCents: z.number().int(),
  commissionCents: z.number().int(),
  profitCents: z.number().int(),
  effectiveMarginBasisPoints: z.number().int(),
  markupBasisPoints: z.number().int(),
  discountImpactCents: z.number().int(),
  differenceToMinimumCents: z.number().int(),
  indicator: z.enum(["LOSS", "LOW_MARGIN", "HEALTHY", "PREMIUM"]),
});
const parameters = z.object({ description: z.string(), category: z.string() });
const revision = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  parameters,
  costComponents: z.array(component),
  commercialRules: rules,
  resultSnapshot: result,
  origin: z.string(),
  createdAt: z.string().datetime(),
  actorSnapshot: z.string().optional(),
  reason: z.string().optional(),
});
const simulation = z.object({
  id: z.string(),
  sequence: z.number().int().positive(),
  title: z.string(),
  templateId: z.string().optional(),
  scenarioGroupId: z.string().optional(),
  scenarioLabel: z.string(),
  clientId: z.string().optional(),
  clientSnapshot: z.object({ id: z.string(), name: z.string(), updatedAt: z.string() }).optional(),
  crmLeadId: z.string().optional(),
  crmSnapshot: z.object({ id: z.string(), title: z.string(), customerName: z.string(), stage: z.string(), converted: z.boolean(), clientId: z.string().optional(), updatedAt: z.string() }).optional(),
  serviceOrderId: z.string().optional(),
  serviceOrderSnapshot: z.object({ id: z.string(), number: z.string(), title: z.string(), clientId: z.string(), currentPriceCents: z.number().int(), status: z.string(), updatedAt: z.string() }).optional(),
  applications: z.array(z.object({ id: z.string(), serviceOrderId: z.string(), serviceOrderNumberSnapshot: z.string(), serviceOrderTitleSnapshot: z.string(), serviceOrderClientIdSnapshot: z.string(), serviceOrderUpdatedAtSnapshot: z.string(), simulationVersion: z.number().int().positive(), revisionId: z.string(), priceType: z.enum(["MINIMUM", "RECOMMENDED", "PREMIUM", "FINAL", "MANUAL"]), priceCents: z.number().int().positive(), calculatedPriceCents: z.number().int().positive(), costCents: z.number().int().nonnegative(), profitCents: z.number().int(), marginBasisPoints: z.number().int(), appliedAt: z.string(), supersededAt: z.string().optional(), reason: z.string().optional(), manuallyModified: z.boolean() })),
  appliedRevisionId: z.string().optional(),
  appliedVersion: z.number().int().positive().optional(),
  appliedPrice: z.number().int().positive().optional(),
  divergenceReviewedAt: z.string().optional(),
  divergenceNotes: z.string().optional(),
  parameters,
  costComponents: z.array(component),
  commercialRules: rules,
  reversePricingInput: z.object({ targetPriceCents: z.number().int() }).optional(),
  currentVersion: z.number().int().positive(),
  status: z.enum(["DRAFT", "READY", "APPLIED", "OUTDATED", "ARCHIVED"]),
  appliedSnapshot: z
    .object({
      serviceOrderId: z.string(),
      priceCents: z.number().int(),
      appliedAt: z.string(),
    })
    .optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  archivedAt: z.string().optional(),
  revisions: z.array(revision),
  history: z.array(history),
});
const template = z.object({
  id: z.string(),
  sequence: z.number().int().positive(),
  code: z.string(),
  name: z.string(),
  description: z.string(),
  serviceType: z.string(),
  category: z.string(),
  compositions: z.array(composition),
  costComponents: z.array(component),
  laborProfiles: z.array(z.string()),
  equipmentProfiles: z.array(z.string()),
  travelDefaults: travel,
  overheadDefaults: z.array(component),
  commercialRules: rules,
  currentVersion: z.number().int().positive(),
  active: z.boolean(),
  archivedAt: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  history: z.array(history),
});
const preferences = z.object({
  view: z.enum(["calculator", "services", "simulations"]),
  listView: z.enum(["list", "cards"]),
  searchTerm: z.string(),
  statusFilter: z.string(),
  categoryFilter: z.string(),
  indicatorFilter: z.string(),
  templateFilter: z.string(),
  scenarioFilter: z.string(),
  includeArchived: z.boolean(),
  standardMonthlyEquipmentHours: z.number().positive(),
});
const stateSchema = z.object({
  version: z.literal(3),
  revision: z.number().int().nonnegative(),
  nextTemplateSequence: z.number().int().positive(),
  nextSimulationSequence: z.number().int().positive(),
  templates: z.array(template),
  simulations: z.array(simulation),
  laborProfiles: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      hourlyCostCents: z.number().int(),
      burdenRateBasisPoints: z.number().int(),
      fixedAdditionalCents: z.number().int(),
      active: z.boolean(),
      notes: z.string().optional(),
    }),
  ),
  preferences,
});
export const defaultPricingPreferences: PricingPreferences = {
  view: "calculator",
  listView: "list",
  searchTerm: "",
  statusFilter: "ALL",
  categoryFilter: "ALL",
  indicatorFilter: "ALL",
  templateFilter: "ALL",
  scenarioFilter: "ALL",
  includeArchived: false,
  standardMonthlyEquipmentHours: 160,
};
const defaultRules: CommercialRules = {
  taxRateBasisPoints: 600,
  taxBasis: "SALE_PRICE",
  taxFixedCents: 0,
  commissionRateBasisPoints: 300,
  commissionFixedCents: 0,
  minimumMarginBasisPoints: 0,
  recommendedMarginBasisPoints: 3000,
  premiumMarginBasisPoints: 4000,
  discountRateBasisPoints: 0,
  discountFixedCents: 0,
  belowMinimumConfirmed: false,
};
const makeComponent = (
  type: PricingCostComponent["type"],
  description: string,
  total: number,
  now: string,
): PricingCostComponent => ({
  id: crypto.randomUUID(),
  type,
  sourceType: "MANUAL",
  description,
  quantity: 1,
  unit: "serviço",
  unitCostCents: total,
  totalCostCents: total,
  percentageBasis: "NONE",
  calculationMode: "FIXED",
  manuallyModified: true,
  createdAt: now,
  updatedAt: now,
});
function initialState(): PricingStorageState {
  const now = "2026-07-01T12:00:00.000Z",
    definitions: [string, string, string, number, number, number][] = [
      ["SRV-INS-001", "Instalação técnica padrão", "INSTALLATION", 68000, 52000, 12000],
      ["SRV-MAN-001", "Manutenção preventiva", "MAINTENANCE", 9500, 23000, 4000],
      ["SRV-ELT-001", "Inspeção elétrica", "INSPECTION", 4500, 31000, 8000],
    ];
  const templates: PricingTemplate[] = definitions.map(
    ([code, name, category, material, labor, equipment], index) => {
      const costs = [
        makeComponent("MATERIAL", "Materiais manuais", material, now),
        makeComponent("LABOR", "Mão de obra padrão", labor, now),
        makeComponent("EQUIPMENT", "Equipamentos manuais", equipment, now),
      ];
      return {
        id: crypto.randomUUID(),
        sequence: index + 1,
        code,
        name,
        description: "Modelo demonstrativo neutro migrado da biblioteca visual.",
        serviceType: name,
        category: category as PricingTemplate["category"],
        compositions: [
          {
            id: crypto.randomUUID(),
            name: "Composição principal",
            description: "Custos principais do serviço.",
            componentIds: costs.map((c) => c.id),
            enabled: true,
            order: 1,
          },
        ],
        costComponents: costs,
        laborProfiles: [],
        equipmentProfiles: [],
        travelDefaults: {
          origin: "",
          destination: "",
          distanceMilliKm: 0,
          estimatedTimeMinutes: 0,
          costPerKmCents: 0,
          tollCents: 0,
          parkingCents: 0,
          lodgingCents: 0,
          mealsCents: 0,
          otherCents: 0,
        },
        overheadDefaults: [],
        commercialRules: { ...defaultRules },
        currentVersion: 1,
        active: true,
        createdAt: now,
        updatedAt: now,
        history: [
          {
            id: crypto.randomUUID(),
            type: "CREATED",
            description: "Template criado pela carga inicial neutra.",
            createdAt: now,
          },
        ],
      };
    },
  );
  const simulations: PricingSimulation[] = templates.map((item, index) => {
    const result = calculatePricing(item.costComponents, item.commercialRules);
    return {
      id: crypto.randomUUID(),
      sequence: index + 1,
      title: item.name,
      templateId: item.id,
      scenarioLabel: "Cenário A",
      parameters: { description: item.description, category: item.category },
      costComponents: structuredClone(item.costComponents),
      commercialRules: { ...item.commercialRules },
      currentVersion: 1,
      status: "READY",
      createdAt: now,
      updatedAt: now,
      revisions: [
        {
          id: crypto.randomUUID(),
          version: 1,
          parameters: { description: item.description, category: item.category },
          costComponents: structuredClone(item.costComponents),
          commercialRules: { ...item.commercialRules },
          resultSnapshot: result,
          origin: "INITIAL_SEED",
          createdAt: now,
        },
      ],
      applications: [],
      history: [
        {
          id: crypto.randomUUID(),
          type: "CREATED",
          description: "Simulação criada pela carga inicial neutra.",
          createdAt: now,
        },
      ],
    };
  });
  return {
    version: 3,
    revision: 0,
    nextTemplateSequence: templates.length + 1,
    nextSimulationSequence: simulations.length + 1,
    templates,
    simulations,
    laborProfiles: [
      {
        id: crypto.randomUUID(),
        name: "Auxiliar",
        hourlyCostCents: 3500,
        burdenRateBasisPoints: 3000,
        fixedAdditionalCents: 0,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Técnico",
        hourlyCostCents: 6500,
        burdenRateBasisPoints: 3500,
        fixedAdditionalCents: 0,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Especialista",
        hourlyCostCents: 9500,
        burdenRateBasisPoints: 4000,
        fixedAdditionalCents: 0,
        active: true,
      },
    ],
    preferences: { ...defaultPricingPreferences },
  };
}
export interface PricingStorageAdapter {
  read(): Promise<PricingStorageState>;
  write(state: PricingStorageState): Promise<PricingStorageState>;
  recoverBackup(): Promise<PricingStorageState>;
}
export class LocalPricingStorageAdapter implements PricingStorageAdapter {
  async read() {
    if (typeof window === "undefined") return initialState();
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const state = initialState();
      localStorage.setItem(KEY, JSON.stringify(state));
      return structuredClone(state);
    }
    const parsed = this.parse(raw);
    if (parsed && this.isLegacy(raw)) {
      localStorage.setItem(BACKUP, raw);
      localStorage.setItem(KEY, JSON.stringify(parsed));
    }
    if (parsed) return parsed;
    const backup = localStorage.getItem(BACKUP),
      recovered = backup && this.parse(backup);
    if (recovered) {
      localStorage.setItem(KEY, JSON.stringify(recovered));
      return recovered;
    }
    throw new PricingDomainError(
      "STORAGE_CORRUPTED",
      "Os dados e o backup de Precificação estão corrompidos. Nada foi sobrescrito.",
    );
  }
  async write(state: PricingStorageState) {
    if (typeof window === "undefined") return state;
    const valid = stateSchema.safeParse(state);
    if (!valid.success)
      throw new PricingDomainError(
        "VALIDATION",
        "O estado da Precificação é inválido e não foi salvo.",
      );
    const raw = localStorage.getItem(KEY),
      current = raw && this.parse(raw);
    if (current && current.revision !== state.revision)
      throw new PricingDomainError(
        "CONFLICT",
        "A Precificação foi alterada em outra aba. Recarregue antes de salvar.",
      );
    if (raw && current) localStorage.setItem(BACKUP, raw);
    const next = { ...state, revision: state.revision + 1 };
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  }
  async recoverBackup() {
    if (typeof window === "undefined") return initialState();
    const raw = localStorage.getItem(BACKUP),
      parsed = raw && this.parse(raw);
    if (!parsed) throw new PricingDomainError("NOT_FOUND", "Não existe backup válido.");
    localStorage.setItem(KEY, JSON.stringify(parsed));
    return parsed;
  }
  private parse(raw: string) {
    try {
      const value = JSON.parse(raw) as Record<string, unknown>;
      const v2 = value.version === 1 ? { ...value, version: 2, preferences: { ...(value.preferences as Record<string, unknown>), standardMonthlyEquipmentHours: 160 } } : value;
      const migrated = v2.version === 2 ? { ...v2, version: 3, simulations: ((v2.simulations as Array<Record<string, unknown>>) ?? []).map((entry) => ({ ...entry, applications: entry.applications ?? [], revisions: ((entry.revisions as Array<Record<string, unknown>>) ?? []).map((revisionEntry) => ({ ...revisionEntry, id: revisionEntry.id ?? crypto.randomUUID() })) })) } : v2;
      const parsed = stateSchema.safeParse(migrated);
      return parsed.success ? (parsed.data as PricingStorageState) : null;
    } catch {
      return null;
    }
  }
  private isLegacy(raw: string) {
    try {
      return (JSON.parse(raw) as { version?: number }).version !== 3;
    } catch {
      return false;
    }
  }
}
export const pricingStorageAdapter = new LocalPricingStorageAdapter();
