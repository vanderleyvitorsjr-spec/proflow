import type {
  CommercialRules,
  PricingCostComponent,
  PricingIndicator,
  PricingResult,
  ReversePricingResult,
  PricingCostDivergence,
} from "./precificacao-types";
import type { StockPricingReference } from "@/lib/contracts/estoque.contract";
import type { EquipmentPricingReference } from "@/lib/contracts/equipamentos.contract";
const round = (value: number) => Math.max(0, Math.round(value));
const amount = (component: PricingCostComponent) => component.totalCostCents;
export function calculatePricing(
  components: PricingCostComponent[],
  rules: CommercialRules,
): PricingResult {
  const direct = components
    .filter((c) => !["OVERHEAD", "TAX", "COMMISSION"].includes(c.type))
    .reduce((s, c) => s + amount(c), 0);
  const overhead = components
    .filter((c) => c.type === "OVERHEAD")
    .reduce(
      (s, c) =>
        s +
        (c.calculationMode === "PERCENT_OF_DIRECT_COST" ||
        c.calculationMode === "ALLOCATION_RATE"
          ? round((direct * (c.percentageRateBasisPoints ?? 0)) / 10000)
          : amount(c)),
      0,
    );
  const base = direct + overhead;
  const costTax =
    rules.taxBasis === "COST"
      ? round((base * rules.taxRateBasisPoints) / 10000)
      : rules.taxBasis === "FIXED"
        ? rules.taxFixedCents
        : 0;
  const costWithTax = base + costTax;
  const saleTax = rules.taxBasis === "SALE_PRICE" ? rules.taxRateBasisPoints : 0,
    commission = rules.commissionRateBasisPoints;
  const priceFor = (margin: number) => {
    const denominator = 10000 - saleTax - commission - margin;
    if (denominator <= 0)
      throw new Error("A soma de impostos, comissão e margem deve ser menor que 100%.");
    return round(((costWithTax + rules.commissionFixedCents) * 10000) / denominator);
  };
  const minimum = priceFor(rules.minimumMarginBasisPoints),
    recommended = priceFor(rules.recommendedMarginBasisPoints),
    premium = priceFor(rules.premiumMarginBasisPoints);
  const percentDiscount = round((recommended * rules.discountRateBasisPoints) / 10000),
    discount = Math.min(recommended, percentDiscount + rules.discountFixedCents),
    promotional = recommended - discount;
  const tax =
    rules.taxBasis === "SALE_PRICE"
      ? round((promotional * rules.taxRateBasisPoints) / 10000)
      : costTax;
  const commissionAmount =
      round((promotional * commission) / 10000) + rules.commissionFixedCents,
    profit = promotional - base - tax - commissionAmount;
  const effective = promotional ? Math.round((profit * 10000) / promotional) : 0,
    markup = base ? Math.round(((promotional - base) * 10000) / base) : 0,
    difference = promotional - minimum;
  const indicator: PricingIndicator =
    profit < 0
      ? "LOSS"
      : effective < rules.recommendedMarginBasisPoints
        ? "LOW_MARGIN"
        : effective >= rules.premiumMarginBasisPoints
          ? "PREMIUM"
          : "HEALTHY";
  return {
    directCostCents: direct,
    overheadCents: overhead,
    totalCostCents: base,
    breakEvenCents: priceFor(0),
    minimumPriceCents: minimum,
    recommendedPriceCents: recommended,
    premiumPriceCents: premium,
    promotionalPriceCents: promotional,
    discountCents: discount,
    taxCents: tax,
    commissionCents: commissionAmount,
    profitCents: profit,
    effectiveMarginBasisPoints: effective,
    markupBasisPoints: markup,
    discountImpactCents: discount,
    differenceToMinimumCents: difference,
    indicator,
  };
}
export function reversePricing(
  components: PricingCostComponent[],
  rules: CommercialRules,
  targetPriceCents: number,
): ReversePricingResult {
  const result = calculatePricing(components, rules),
    variable =
      rules.commissionRateBasisPoints +
      (rules.taxBasis === "SALE_PRICE" ? rules.taxRateBasisPoints : 0),
    maximum = Math.max(
      0,
      round(
        (targetPriceCents * (10000 - variable - rules.recommendedMarginBasisPoints)) /
          10000,
      ) - rules.commissionFixedCents,
    );
  const currentCost = result.totalCostCents,
    resultingProfit =
      targetPriceCents -
      currentCost -
      round((targetPriceCents * variable) / 10000) -
      rules.commissionFixedCents,
    resultingMargin = targetPriceCents
      ? Math.round((resultingProfit * 10000) / targetPriceCents)
      : 0;
  const impacts = [...components]
    .sort((a, b) => b.totalCostCents - a.totalCostCents)
    .slice(0, 3)
    .map((c) => c.description);
  return {
    targetPriceCents,
    maximumCostCents: maximum,
    resultingMarginBasisPoints: resultingMargin,
    resultingProfitCents: resultingProfit,
    differenceToRecommendedCents: targetPriceCents - result.recommendedPriceCents,
    differenceToMinimumCents: targetPriceCents - result.minimumPriceCents,
    loss: resultingProfit < 0,
    requiredReductionCents: Math.max(0, currentCost - maximum),
    impactComponents: impacts,
  };
}

export function stockDivergence(
  component: PricingCostComponent,
  current: StockPricingReference | null,
): PricingCostDivergence {
  const codes: PricingCostDivergence["codes"] = [];
  if (!current) codes.push("STOCK_ITEM_UNAVAILABLE");
  else {
    if (current.archived) codes.push("STOCK_ITEM_ARCHIVED");
    if (current.averageCostCents > (component.sourceCostCents ?? component.unitCostCents))
      codes.push("STOCK_COST_INCREASED");
    if (current.averageCostCents < (component.sourceCostCents ?? component.unitCostCents))
      codes.push("STOCK_COST_DECREASED");
    if (current.availableQuantity !== component.sourceSnapshot?.availableQuantity)
      codes.push("STOCK_AVAILABILITY_CHANGED");
  }
  if (component.manuallyModified) codes.push("MANUALLY_MODIFIED");
  return {
    componentId: component.id,
    sourceType: "STOCK",
    codes,
    currentCostCents: current?.averageCostCents,
    usedCostCents: component.unitCostCents,
    currentAvailableQuantity: current?.availableQuantity,
  };
}

export function equipmentDivergence(
  component: PricingCostComponent,
  current: EquipmentPricingReference | null,
): PricingCostDivergence {
  const snapshot = component.sourceSnapshot,
    codes: PricingCostDivergence["codes"] = [];
  if (!current) codes.push("EQUIPMENT_UNAVAILABLE");
  else {
    if (current.archived) codes.push("EQUIPMENT_ARCHIVED");
    if (current.status !== snapshot?.status) codes.push("EQUIPMENT_STATUS_CHANGED");
    if (current.condition !== snapshot?.condition)
      codes.push("EQUIPMENT_CONDITION_CHANGED");
    if (current.currentValueCents !== snapshot?.currentValueCents)
      codes.push("EQUIPMENT_VALUE_CHANGED");
    if (current.monthlyDepreciationCents !== snapshot?.monthlyDepreciationCents)
      codes.push("EQUIPMENT_DEPRECIATION_CHANGED");
    if (
      current.estimatedMaintenanceMonthlyCents !==
      snapshot?.estimatedMaintenanceMonthlyCents
    )
      codes.push("EQUIPMENT_MAINTENANCE_COST_CHANGED");
  }
  if (component.manuallyModified) codes.push("MANUALLY_MODIFIED");
  return {
    componentId: component.id,
    sourceType: "EQUIPMENT",
    codes,
    currentCostCents: current
      ? Math.round(
          ((current.ownership === "COMPANY" ? current.monthlyDepreciationCents : 0) +
            current.estimatedMaintenanceMonthlyCents) /
            (snapshot?.standardMonthlyHours ?? 160),
        )
      : undefined,
    usedCostCents: component.unitCostCents,
  };
}
