import type {
  AutomationActionConfiguration,
  AutomationConditionConfiguration,
  AutomationPlannedAction,
  AutomationTriggerType,
} from "../types/automation-types";

export const AUTOMATION_WORKFLOW_STATUS = {
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  DRAFT: "DRAFT",
} as const;
export type AutomationWorkflowStatus =
  (typeof AUTOMATION_WORKFLOW_STATUS)[keyof typeof AUTOMATION_WORKFLOW_STATUS];

export const AUTOMATION_WORKFLOW_MODE = {
  SIMULATION: "SIMULATION",
  REAL: "REAL",
} as const;
export type AutomationWorkflowMode =
  (typeof AUTOMATION_WORKFLOW_MODE)[keyof typeof AUTOMATION_WORKFLOW_MODE];

export const AUTOMATION_HISTORY_STATUS = {
  SUCCESS: "SUCCESS",
  REJECTED: "REJECTED",
  SKIPPED: "SKIPPED",
  FAILED: "FAILED",
  SIMULATED: "SIMULATED",
} as const;
export type AutomationHistoryStatus =
  (typeof AUTOMATION_HISTORY_STATUS)[keyof typeof AUTOMATION_HISTORY_STATUS];

export type PersistedAutomationWorkflow = {
  id: string;
  name: string;
  description: string;
  trigger: { type: AutomationTriggerType };
  conditions: AutomationConditionConfiguration[];
  actions: AutomationActionConfiguration[];
  status: AutomationWorkflowStatus;
  mode: AutomationWorkflowMode;
  source: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AutomationHistoryEntry = {
  id: string;
  workflowId: string;
  workflowName: string;
  eventId: string;
  trigger: AutomationTriggerType;
  mode: AutomationWorkflowMode;
  result: string;
  status: AutomationHistoryStatus;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  source: string;
  entityId?: string;
  plannedActions: AutomationPlannedAction[];
  executedActions: string[];
  skippedActions: string[];
  rejectionReasons: string[];
  errorMessage?: string;
};

export type AutomationAdminState = {
  version: 1;
  workflows: PersistedAutomationWorkflow[];
  history: AutomationHistoryEntry[];
};

export type AutomationWorkflowInput = Omit<
  PersistedAutomationWorkflow,
  "id" | "isSystem" | "createdAt" | "updatedAt"
>;

export type AutomationHistoryFilters = {
  workflowId?: string;
  status?: AutomationHistoryStatus;
  mode?: AutomationWorkflowMode;
  trigger?: AutomationTriggerType;
  from?: string;
  to?: string;
};
