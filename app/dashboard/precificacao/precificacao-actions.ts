"use client";
import { PricingRepository } from "./precificacao-repository";
import { PricingService, pricingError } from "./precificacao-service";
import { pricingStorageAdapter } from "./precificacao-storage-adapter";
import type { PricingActionResult } from "./precificacao-result";
import type {
  LaborProfileFormValues,
  PricingSimulationFormValues,
  PricingTemplateFormValues,
} from "./precificacao-schema";
import type { PricingPreferences } from "./precificacao-types";
import type { PricingPriceType } from "./precificacao-types";
import type { ReportPricingSource } from "@/lib/contracts/relatorios-precificacao.contract";
import { createServiceOrderReceivableAction, listFinancialStateAction } from "@/app/dashboard/financeiro/financeiro-actions";
import type { PricingApplicationInput } from "./precificacao-application-dialog";
const service = new PricingService(new PricingRepository(pricingStorageAdapter));
async function action<T>(work: () => Promise<T>): Promise<PricingActionResult<T>> {
  try {
    return { ok: true, data: await work() };
  } catch (cause) {
    const error = pricingError(cause);
    return {
      ok: false,
      error: {
        code: "code" in error ? String(error.code) : "UNKNOWN",
        message: error.message,
        fieldErrors:
          "fieldErrors" in error
            ? (error.fieldErrors as Record<string, string[]> | undefined)
            : undefined,
      },
    };
  }
}
export const listPricingAction = () => action(() => service.list());
export const getPricingSimulationAction = (id: string) =>
  action(() => service.getSimulation(id));
export const createPricingSimulationAction = (input: PricingSimulationFormValues) =>
  action(() => service.createSimulation(input));
export const updatePricingSimulationAction = (
  id: string,
  input: PricingSimulationFormValues,
) => action(() => service.updateSimulation(id, input));
export const duplicatePricingSimulationAction = (id: string, scenario = false) =>
  action(() => service.duplicateSimulation(id, scenario));
export const archivePricingSimulationAction = (id: string, reason: string) =>
  action(() => service.archiveSimulation(id, reason));
export const createPricingTemplateAction = (input: PricingTemplateFormValues) =>
  action(() => service.createTemplate(input));
export const updatePricingTemplateAction = (
  id: string,
  input: PricingTemplateFormValues,
) => action(() => service.updateTemplate(id, input));
export const duplicatePricingTemplateAction = (id: string) =>
  action(() => service.duplicateTemplate(id));
export const archivePricingTemplateAction = (id: string, reason: string) =>
  action(() => service.archiveTemplate(id, reason));
export const createPricingCompositionAction = (
  id: string,
  name: string,
  description: string,
) => action(() => service.createComposition(id, name, description));
export const saveLaborProfileAction = (input: LaborProfileFormValues, id?: string) =>
  action(() => service.saveLaborProfile(input, id));
export const savePricingPreferencesAction = (preferences: PricingPreferences) =>
  action(() => service.savePreferences(preferences));
export const recoverPricingBackupAction = () => action(() => service.recoverBackup());
export const reversePricingAction = (id: string, target: number) =>
  action(async () => {
    const simulation = await service.getSimulation(id);
    if (!simulation) throw new Error("Simulação não encontrada.");
    return service.reverse(simulation, target);
  });
export const comparePricingScenariosAction = (ids: string[]) =>
  action(async () => {
    const state = await service.list();
    return service.compare(state.simulations.filter((item) => ids.includes(item.id)));
  });
export const listPricingSourcesAction = () => action(() => service.pricingSources());
export const addStockPricingMaterialAction = (
  input: Parameters<PricingService["addStockMaterial"]>[0],
) => action(() => service.addStockMaterial(input));
export const addRealPricingEquipmentAction = (
  input: Parameters<PricingService["addRealEquipment"]>[0],
) => action(() => service.addRealEquipment(input));
export const getPricingDivergencesAction = (simulationId: string) =>
  action(() => service.divergences(simulationId));
export const reviewPricingSourceAction = (
  simulationId: string,
  componentId: string,
  update: boolean,
  notes: string,
) => action(() => service.reviewSource(simulationId, componentId, update, notes));
export const listPricingCommercialReferencesAction = () => action(() => service.commercialReferences());
export const linkPricingCommercialAction = (simulationId: string, input: { clientId?: string; crmLeadId?: string; serviceOrderId?: string }) => action(() => service.linkCommercial(simulationId, input));
export const applyPricingToOrderAction = (simulationId: string, input: PricingApplicationInput) => action(async () => {
  const financial = await listFinancialStateAction();
  if (!financial.ok) throw new Error("O Financeiro precisa estar disponível antes de aprovar o orçamento.");
  const account = financial.data.accounts.find((item) => item.isDefault && !item.archivedAt) ?? financial.data.accounts.find((item) => !item.archivedAt);
  if (!account) throw new Error("Cadastre uma conta financeira antes de aprovar o orçamento.");
  const simulation = await service.applyToOrder(simulationId, { priceType: input.priceType, manualPriceCents: input.manualPriceCents, reason: input.reason, belowMinimumConfirmed: input.belowMinimumConfirmed });
  if (!simulation.serviceOrderId) throw new Error("A simulação aplicada não possui Ordem vinculada.");
  const issued = new Date().toISOString().slice(0, 10);
  const receivable = await createServiceOrderReceivableAction(simulation.serviceOrderId, {
    title: `OS ${simulation.serviceOrderSnapshot?.number ?? ""} · ${simulation.title}`,
    description: simulation.parameters.description || simulation.title,
    category: "Serviços técnicos", accountId: account.id, total: "0,00",
    issueDate: issued, competenceDate: issued, firstDueDate: input.firstDueDate, installmentCount: input.installmentCount,
    supplier: "", customerName: simulation.clientSnapshot?.name ?? "", clientId: simulation.clientId ?? "",
    notes: `Recebível criado automaticamente pela aprovação da Precificação ${simulation.title}.`,
  });
  if (!receivable.ok) throw new Error(`O preço foi aplicado à OS, mas o recebível não pôde ser criado: ${receivable.error.message}`);
  return simulation;
});
export const listPricingReportAction = () =>
  action(async (): Promise<ReportPricingSource> => {
    const state = await service.list();
    return {
      activeTemplateCount: state.templates.filter((item) => item.active && !item.archivedAt).length,
      simulations: state.simulations.map((simulation) => {
        const result = simulation.revisions.at(-1)?.resultSnapshot;
        return {
          id: simulation.id, createdAt: simulation.createdAt, updatedAt: simulation.updatedAt,
          archivedAt: simulation.archivedAt, status: simulation.status,
          category: simulation.parameters.category, templateId: simulation.templateId,
          scenarioGroupId: simulation.scenarioGroupId, versionCount: simulation.revisions.length,
          currentVersion: simulation.currentVersion, totalCostCents: result?.totalCostCents ?? 0,
          minimumPriceCents: result?.minimumPriceCents ?? 0,
          recommendedPriceCents: result?.recommendedPriceCents ?? 0,
          profitCents: result?.profitCents ?? 0,
          marginBasisPoints: result?.effectiveMarginBasisPoints ?? 0,
          applications: simulation.applications.map((item) => ({
            serviceOrderId: item.serviceOrderId, priceCents: item.priceCents,
            profitCents: item.profitCents, marginBasisPoints: item.marginBasisPoints,
            appliedAt: item.appliedAt, superseded: Boolean(item.supersededAt),
          })),
          componentTypes: simulation.costComponents.map((item) => item.type),
          materialIds: simulation.costComponents.filter((item) => item.type === "MATERIAL").map((item) => item.stockItemId ?? item.id),
          equipmentIds: simulation.costComponents.filter((item) => item.type === "EQUIPMENT").map((item) => item.equipmentId ?? item.id),
        };
      }),
    };
  });
