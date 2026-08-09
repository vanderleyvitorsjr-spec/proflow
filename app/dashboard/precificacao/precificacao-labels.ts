import type { PricingIndicator, PricingSimulationStatus } from "./precificacao-types";

export const pricingSimulationStatusLabels: Record<PricingSimulationStatus, string> = {
  DRAFT: "Rascunho",
  READY: "Pronta",
  APPLIED: "Aplicada",
  OUTDATED: "Desatualizada",
  ARCHIVED: "Arquivada",
};

export const pricingIndicatorLabels: Record<PricingIndicator, string> = {
  LOSS: "Prejuízo",
  LOW_MARGIN: "Margem baixa",
  HEALTHY: "Margem saudável",
  PREMIUM: "Margem premium",
};
