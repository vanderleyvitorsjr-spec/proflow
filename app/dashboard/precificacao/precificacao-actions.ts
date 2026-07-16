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
