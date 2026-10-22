import { calculatePricing } from "@/app/dashboard/precificacao/precificacao-selectors";
import type { PricingSimulation } from "@/app/dashboard/precificacao/precificacao-types";
import type { OrdemFormInput } from "./ordens-schema";

const AUTO_PREFIX = "[AUTO]"; // mesmo prefixo das linhas automáticas da Precificação

const categoryBySegment: Record<string, OrdemFormInput["category"]> = {
  CLIMATIZATION: "CLIMATIZATION",
  ELECTRICAL: "ELECTRICAL",
  IT: "IT",
};

/**
 * Converte uma precificação em valores iniciais para uma nova Ordem de Serviço.
 * Leva cliente, serviço, descrição, tipo, valor e materiais; o usuário ainda
 * revisa tudo no formulário antes de salvar.
 */
export function orderPrefillFromPricing(simulation: PricingSimulation): Partial<OrdemFormInput> {
  const parameters = simulation.parameters;
  const result = calculatePricing(simulation.costComponents, simulation.commercialRules);
  const priceCents = simulation.appliedPrice ?? result.recommendedPriceCents;
  const title = (parameters.serviceType?.trim() || simulation.title).trim();
  const description = parameters.description?.trim() || title;
  const materials = simulation.costComponents
    .filter((item) => item.type === "MATERIAL" && item.description.trim() && !item.description.startsWith(AUTO_PREFIX))
    .map((item) => item.description.trim());

  return {
    ...(simulation.clientId ? { clientId: simulation.clientId } : {}),
    ...(simulation.crmLeadId ? { crmLeadId: simulation.crmLeadId } : {}),
    title,
    description,
    category: categoryBySegment[parameters.segment ?? ""] ?? "CLIMATIZATION",
    estimatedValue: Math.max(0, Math.round(priceCents) / 100),
    materialsText: materials.join("\n"),
    notes: `Criada a partir da precificação "${simulation.title}".`,
  };
}
