import {
  AUTOMATION_WORKFLOW_MODE,
  AUTOMATION_WORKFLOW_STATUS,
  type PersistedAutomationWorkflow,
} from "./automation-admin-types";
import { serviceOrderCompletedWorkflow } from "../workflows/service-order-completed-workflow";

export const SYSTEM_WORKFLOW_ID = serviceOrderCompletedWorkflow.id;

export function systemWorkflowSeed(now: string): PersistedAutomationWorkflow {
  return {
    ...serviceOrderCompletedWorkflow,
    description: serviceOrderCompletedWorkflow.description,
    status: AUTOMATION_WORKFLOW_STATUS.ACTIVE,
    mode: AUTOMATION_WORKFLOW_MODE.REAL,
    source: "Ordens de Serviço",
    isSystem: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function ensureSystemWorkflow(
  workflows: PersistedAutomationWorkflow[],
  now: string,
): PersistedAutomationWorkflow[] {
  const existing = workflows.find((item) => item.id === SYSTEM_WORKFLOW_ID);
  if (!existing) return [systemWorkflowSeed(now), ...workflows];
  return workflows.map((item) =>
    item.id === SYSTEM_WORKFLOW_ID
      ? {
          ...item,
          trigger: serviceOrderCompletedWorkflow.trigger,
          conditions: serviceOrderCompletedWorkflow.conditions,
          actions: serviceOrderCompletedWorkflow.actions,
          mode: AUTOMATION_WORKFLOW_MODE.REAL,
          isSystem: true,
        }
      : item,
  );
}
