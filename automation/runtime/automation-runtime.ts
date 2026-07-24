import { AutomationEngine } from "../engine/automation-engine";
import { AutomationSimulator } from "../engine/automation-simulator";
import { AutomationEventBus } from "../events/automation-event-bus";
import { financialSuggestionService } from "../suggestions/financial-suggestion-actions";
import { automationAdminService } from "../admin/automation-admin-actions";
import {
  AUTOMATION_HISTORY_STATUS,
  AUTOMATION_WORKFLOW_MODE,
  AUTOMATION_WORKFLOW_STATUS,
  type AutomationHistoryEntry,
  type PersistedAutomationWorkflow,
} from "../admin/automation-admin-types";
import {
  AUTOMATION_ACTION,
  AUTOMATION_TRIGGER,
  type AutomationClock,
  type AutomationIdGenerator,
  type AutomationSimulationReport,
  type AutomationTriggerEvent,
} from "../types/automation-types";

export interface FinancialSuggestionExecutionPort {
  createFromCompletedOrder(
    event: AutomationTriggerEvent<"SERVICE_ORDER_COMPLETED">,
  ): Promise<unknown>;
}

export interface AutomationRuntimeAdminPort {
  listWorkflows(): Promise<PersistedAutomationWorkflow[]>;
  appendHistory(entry: AutomationHistoryEntry): Promise<void>;
  toEngineWorkflow(workflow: PersistedAutomationWorkflow): import("../types/automation-types").AutomationWorkflow;
}

export class AutomationRuntime {
  constructor(
    private readonly suggestionService: FinancialSuggestionExecutionPort =
      financialSuggestionService,
    private readonly admin: AutomationRuntimeAdminPort = automationAdminService,
    private readonly engine = new AutomationEngine(),
    private readonly clock: AutomationClock = { now: () => new Date() },
    private readonly idGenerator: AutomationIdGenerator = {
      next: () => crypto.randomUUID(),
    },
  ) {}

  async simulate(
    event: AutomationTriggerEvent,
  ): Promise<AutomationSimulationReport> {
    const workflows = (await this.admin.listWorkflows()).filter(
      (workflow) => workflow.trigger.type === event.type,
    );
    const started = this.clock.now();
    const inactive = workflows.filter(
      (workflow) => workflow.status !== AUTOMATION_WORKFLOW_STATUS.ACTIVE,
    );
    for (const workflow of inactive) {
      await this.admin.appendHistory(
        this.historyEntry({
          workflow,
          event,
          started,
          status: AUTOMATION_HISTORY_STATUS.SKIPPED,
          result:
            workflow.status === AUTOMATION_WORKFLOW_STATUS.PAUSED
              ? "Automação pausada; evento ignorado."
              : "Rascunho disponível somente para simulação manual.",
          skippedActions: workflow.actions.map((action) => action.type),
        }),
      );
    }
    const active = workflows.filter(
      (workflow) => workflow.status === AUTOMATION_WORKFLOW_STATUS.ACTIVE,
    );
    const simulator = new AutomationSimulator({
      workflows: active.map((workflow) => this.admin.toEngineWorkflow(workflow)),
      engine: this.engine,
      clock: this.clock,
      idGenerator: this.idGenerator,
    });
    const report = simulator.simulate(event);
    for (const workflow of active) {
      const planned = report.plannedActions.filter(
        (action) => action.workflowId === workflow.id,
      );
      const rejection = report.rejectedWorkflows.find(
        (item) => item.workflowId === workflow.id,
      );
      const executedActions: string[] = [];
      const skippedActions: string[] = [];
      try {
        if (
          workflow.mode === AUTOMATION_WORKFLOW_MODE.REAL &&
          workflow.isSystem &&
          event.mode === "execution" &&
          event.type === AUTOMATION_TRIGGER.SERVICE_ORDER_COMPLETED &&
          planned.some((action) => action.type === AUTOMATION_ACTION.CREATE_SUGGESTION)
        ) {
          await this.suggestionService.createFromCompletedOrder(event);
          executedActions.push(AUTOMATION_ACTION.CREATE_SUGGESTION);
        } else {
          skippedActions.push(...planned.map((action) => action.type));
        }
        await this.admin.appendHistory(
          this.historyEntry({
            workflow,
            event,
            started,
            status: rejection
              ? AUTOMATION_HISTORY_STATUS.REJECTED
              : workflow.mode === AUTOMATION_WORKFLOW_MODE.SIMULATION
                ? AUTOMATION_HISTORY_STATUS.SIMULATED
                : AUTOMATION_HISTORY_STATUS.SUCCESS,
            result: rejection
              ? "Workflow rejeitado pela validação."
              : executedActions.length
                ? "Sugestão financeira criada."
                : "Ações avaliadas somente em simulação.",
            plannedActions: planned,
            executedActions,
            skippedActions,
            rejectionReasons:
              rejection?.reasons.map((reason) => reason.message) ?? [],
          }),
        );
      } catch (cause) {
        await this.admin.appendHistory(
          this.historyEntry({
            workflow,
            event,
            started,
            status: AUTOMATION_HISTORY_STATUS.FAILED,
            result: "A execução não foi concluída.",
            plannedActions: planned,
            skippedActions: planned.map((action) => action.type),
            errorMessage:
              cause instanceof Error
                ? cause.message
                : "Não foi possível executar a automação.",
          }),
        );
        throw cause;
      }
    }
    return report;
  }

  private historyEntry({
    workflow,
    event,
    started,
    status,
    result,
    plannedActions = [],
    executedActions = [],
    skippedActions = [],
    rejectionReasons = [],
    errorMessage,
  }: {
    workflow: PersistedAutomationWorkflow;
    event: AutomationTriggerEvent;
    started: Date;
    status: AutomationHistoryEntry["status"];
    result: string;
    plannedActions?: AutomationHistoryEntry["plannedActions"];
    executedActions?: string[];
    skippedActions?: string[];
    rejectionReasons?: string[];
    errorMessage?: string;
  }): AutomationHistoryEntry {
    const finished = this.clock.now();
    const payload = event.payload as Readonly<Record<string, unknown>>;
    const entityId = [
      payload.serviceOrderId,
      payload.clientId,
      payload.leadId,
      payload.eventId,
    ].find((value): value is string => typeof value === "string");
    return {
      id: this.idGenerator.next(),
      workflowId: workflow.id,
      workflowName: workflow.name,
      eventId: event.id,
      trigger: event.type,
      mode: workflow.mode,
      result,
      status,
      startedAt: started.toISOString(),
      finishedAt: finished.toISOString(),
      durationMs: Math.max(0, finished.getTime() - started.getTime()),
      source: event.source,
      entityId,
      plannedActions,
      executedActions,
      skippedActions,
      rejectionReasons,
      errorMessage,
    };
  }
}

export const automationRuntime = new AutomationRuntime();
export const automationEventBus = new AutomationEventBus(automationRuntime);
