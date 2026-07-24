import type {
  AutomationHistoryStatus,
  AutomationWorkflowMode,
  AutomationWorkflowStatus,
} from "./automation-admin-types";

export const workflowStatusLabels: Record<AutomationWorkflowStatus, string> = {
  ACTIVE: "Ativa",
  PAUSED: "Pausada",
  DRAFT: "Rascunho",
};

export const workflowModeLabels: Record<AutomationWorkflowMode, string> = {
  SIMULATION: "Simulação",
  REAL: "Real",
};

export const automationHistoryStatusLabels: Record<
  AutomationHistoryStatus,
  string
> = {
  SUCCESS: "Concluída",
  REJECTED: "Rejeitada",
  SKIPPED: "Ignorada",
  FAILED: "Não concluída",
  SIMULATED: "Simulada",
};
