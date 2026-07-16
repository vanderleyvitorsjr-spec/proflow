import { z } from "zod";
const category = z.enum([
  "INSTALLATION",
  "MAINTENANCE",
  "CLEANING",
  "COMPONENT_REPLACEMENT",
  "INFRASTRUCTURE",
  "RECURRING",
  "RESIDENTIAL_ELECTRICAL",
  "COMMERCIAL_ELECTRICAL",
  "INSPECTION",
  "OTHER",
]);
const rules = z
  .object({
    taxRateBasisPoints: z.coerce.number().int().min(0).max(10000),
    taxBasis: z.enum(["COST", "SALE_PRICE", "FIXED"]),
    taxFixedCents: z.coerce.number().int().min(0),
    commissionRateBasisPoints: z.coerce.number().int().min(0).max(10000),
    commissionFixedCents: z.coerce.number().int().min(0),
    minimumMarginBasisPoints: z.coerce.number().int().min(0).max(10000),
    recommendedMarginBasisPoints: z.coerce.number().int().min(0).max(10000),
    premiumMarginBasisPoints: z.coerce.number().int().min(0).max(10000),
    discountRateBasisPoints: z.coerce.number().int().min(0).max(10000),
    discountFixedCents: z.coerce.number().int().min(0),
    belowMinimumConfirmed: z.boolean().default(false),
  })
  .superRefine((v, c) => {
    if (v.premiumMarginBasisPoints < v.recommendedMarginBasisPoints)
      c.addIssue({
        code: "custom",
        path: ["premiumMarginBasisPoints"],
        message: "A margem premium deve ser maior ou igual à recomendada.",
      });
    if (v.minimumMarginBasisPoints > v.recommendedMarginBasisPoints)
      c.addIssue({
        code: "custom",
        path: ["minimumMarginBasisPoints"],
        message: "A margem mínima não pode superar a recomendada.",
      });
  });
const component = z.object({
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
  sourceType: z.string().default("MANUAL"),
  description: z.string().trim().min(2).max(160),
  quantity: z.coerce.number().positive(),
  unit: z.string().trim().min(1).max(20),
  unitCostCents: z.coerce.number().int().min(0),
  fixedAmountCents: z.coerce.number().int().min(0).optional(),
  percentageRateBasisPoints: z.coerce.number().int().min(0).max(10000).optional(),
  percentageBasis: z.enum(["NONE", "COST", "SALE_PRICE"]).default("NONE"),
  wastePercentBasisPoints: z.coerce.number().int().min(0).max(10000).optional(),
  calculationMode: z.enum([
    "FIXED",
    "QUANTITY",
    "PERCENTAGE",
    "PER_HOUR",
    "PER_USE",
    "PERCENT_OF_DIRECT_COST",
    "ALLOCATION_RATE",
  ]),
  manuallyModified: z.boolean().default(true),
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
  sourceCostCents: z.coerce.number().int().min(0).optional(),
  divergenceReviewedAt: z.string().optional(),
  divergenceNotes: z.string().optional(),
  manualCostReason: z.string().optional(),
  insufficientStockConfirmed: z.boolean().optional(),
  notes: z.string().trim().max(500).optional(),
  equipmentDetails: z
    .object({
      method: z.enum(["PER_HOUR", "PER_USE"]),
      maintenanceCents: z.coerce.number().int().min(0),
      energyCents: z.coerce.number().int().min(0),
      wearCents: z.coerce.number().int().min(0),
    })
    .optional(),
  travelDetails: z
    .object({
      origin: z.string(),
      destination: z.string(),
      distanceMilliKm: z.coerce.number().int().min(0),
      estimatedTimeMinutes: z.coerce.number().int().min(0),
      costPerKmCents: z.coerce.number().int().min(0),
      tollCents: z.coerce.number().int().min(0),
      parkingCents: z.coerce.number().int().min(0),
      lodgingCents: z.coerce.number().int().min(0),
      mealsCents: z.coerce.number().int().min(0),
      otherCents: z.coerce.number().int().min(0),
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
});
export const pricingSimulationFormSchema = z.object({
  title: z.string().trim().min(3).max(140),
  templateId: z.string().optional(),
  scenarioGroupId: z.string().optional(),
  scenarioLabel: z.string().trim().min(1).max(40),
  description: z.string().trim().max(500).default(""),
  category,
  components: z.array(component).min(1, "Adicione ao menos um componente."),
  commercialRules: rules,
  status: z.enum(["DRAFT", "READY"]).default("DRAFT"),
  reverseTargetCents: z.coerce.number().int().min(0).optional(),
});
export const pricingTemplateFormSchema = z.object({
  code: z.string().trim().min(2).max(40),
  name: z.string().trim().min(3).max(140),
  description: z.string().trim().max(500),
  serviceType: z.string().trim().min(2).max(80),
  category,
  components: z.array(component),
  commercialRules: rules,
  active: z.boolean().default(true),
});
export const laborProfileFormSchema = z.object({
  name: z.string().trim().min(2).max(80),
  hourlyCostCents: z.coerce.number().int().min(0),
  burdenRateBasisPoints: z.coerce.number().int().min(0).max(10000),
  fixedAdditionalCents: z.coerce.number().int().min(0),
  active: z.boolean().default(true),
  notes: z.string().trim().max(300).optional().default(""),
});
export type PricingSimulationFormValues = z.output<typeof pricingSimulationFormSchema>;
export type PricingTemplateFormValues = z.output<typeof pricingTemplateFormSchema>;
export type LaborProfileFormValues = z.output<typeof laborProfileFormSchema>;
export type PricingComponentFormValues = z.output<typeof component>;
