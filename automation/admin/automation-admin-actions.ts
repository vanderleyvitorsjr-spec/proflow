import { AutomationAdminRepository } from "./automation-admin-repository";
import { AutomationAdminService } from "./automation-admin-service";
import { automationAdminStorageAdapter } from "./automation-admin-storage-adapter";
import type {
  AutomationHistoryFilters,
  AutomationWorkflowInput,
} from "./automation-admin-types";
import { automationRegistry } from "../registry/automation-registry";
import { defaultPayload } from "./automation-admin-service";
import type { AutomationTriggerType } from "../types/automation-types";

export const automationAdminService = new AutomationAdminService(
  new AutomationAdminRepository(automationAdminStorageAdapter),
);

export const listAutomationWorkflowsAction = () =>
  automationAdminService.listWorkflows();
export const getAutomationWorkflowAction = (id: string) =>
  automationAdminService.getWorkflow(id);
export const listAutomationHistoryAction = (filters?: AutomationHistoryFilters) =>
  automationAdminService.listHistory(filters);
export const createAutomationWorkflowAction = (input: AutomationWorkflowInput) =>
  automationAdminService.create(input);
export const updateAutomationWorkflowAction = (
  id: string,
  input: AutomationWorkflowInput,
) => automationAdminService.update(id, input);
export const duplicateAutomationWorkflowAction = (id: string) =>
  automationAdminService.duplicate(id);
export const changeAutomationWorkflowStatusAction = (
  id: string,
  status: "ACTIVE" | "PAUSED",
) => automationAdminService.changeStatus(id, status);
export const deleteAutomationWorkflowAction = (id: string) =>
  automationAdminService.remove(id);
export const simulateAutomationWorkflowAction = (
  id: string,
  payload?: Readonly<Record<string, unknown>>,
) => automationAdminService.simulateManually(id, payload);
export const getAutomationCatalogAction = () => ({
  triggers: automationRegistry.listTriggers(),
  conditions: automationRegistry.listConditions(),
  actions: automationRegistry.listActions(),
});
export const getAutomationExamplePayloadAction = (trigger: AutomationTriggerType) =>
  defaultPayload(trigger);
export const recordAutomationFinancialConversionAction = (input: {
  suggestionId: string;
  serviceOrderId: string;
  financialEntryId: string;
}) => automationAdminService.recordConfirmedFinancialConversion(input);
