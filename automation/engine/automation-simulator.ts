import { AutomationEngine } from "./automation-engine";
import type {
  AutomationClock,
  AutomationIdGenerator,
  AutomationPlannedAction,
  AutomationSimulationReport,
  AutomationTriggerEvent,
  AutomationWorkflow,
  AutomationValidationIssue,
} from "../types/automation-types";

function evaluateConditions(
  workflow: AutomationWorkflow,
  event: AutomationTriggerEvent,
): AutomationValidationIssue[] {
  const payload = event.payload as Readonly<Record<string, unknown>>;
  const metadata = event.metadata ?? {};
  return workflow.conditions.flatMap((condition, index) => {
    let accepted = false;
    switch (condition.type) {
      case "ALWAYS":
        accepted = true;
        break;
      case "PREMIUM_CLIENT":
        accepted = payload.premiumClient === true || metadata.premiumClient === true;
        break;
      case "VALUE_ABOVE": {
        const value = payload.totalAmountCents ?? payload.amountCents;
        accepted =
          typeof value === "number" && value > condition.parameters.amountCents;
        break;
      }
      case "DAYS_WITHOUT_ACTIVITY":
        accepted =
          typeof metadata.daysWithoutActivity === "number" &&
          metadata.daysWithoutActivity >= condition.parameters.days;
        break;
      case "CATEGORY":
        accepted = payload.category === condition.parameters.category;
        break;
      case "SERVICE_TYPE":
        accepted = payload.serviceType === condition.parameters.serviceType;
        break;
      case "RESPONSIBLE":
        accepted = payload.responsibleId === condition.parameters.responsibleId;
        break;
      case "STATUS":
        accepted = payload.status === condition.parameters.status;
        break;
    }
    return accepted
      ? []
      : [
          {
            path: `workflow.conditions.${index}`,
            message: "A condição configurada não foi atendida pelo evento.",
          },
        ];
  });
}

export class AutomationSimulator {
  private readonly reports: AutomationSimulationReport[] = [];
  private readonly workflows: readonly AutomationWorkflow[];
  private readonly engine: AutomationEngine;
  private readonly clock: AutomationClock;
  private readonly idGenerator: AutomationIdGenerator;

  constructor({
    workflows,
    engine = new AutomationEngine(),
    clock = { now: () => new Date() },
    idGenerator = { next: () => crypto.randomUUID() },
  }: {
    workflows: readonly AutomationWorkflow[];
    engine?: AutomationEngine;
    clock?: AutomationClock;
    idGenerator?: AutomationIdGenerator;
  }) {
    this.workflows = [...workflows];
    this.engine = engine;
    this.clock = clock;
    this.idGenerator = idGenerator;
  }

  simulate(event: AutomationTriggerEvent): AutomationSimulationReport {
    const compatible = this.workflows.filter(
      (workflow) => workflow.enabled && workflow.trigger.type === event.type,
    );
    const acceptedWorkflows: string[] = [];
    const rejectedWorkflows: AutomationSimulationReport["rejectedWorkflows"] = [];
    const plannedActions: AutomationPlannedAction[] = [];

    for (const workflow of compatible) {
      const result = this.engine.register(workflow, event);
      if (!result.ok) {
        rejectedWorkflows.push({
          workflowId: workflow.id,
          workflowName: workflow.name,
          reasons: result.issues,
        });
        continue;
      }
      const conditionIssues = evaluateConditions(workflow, event);
      if (conditionIssues.length) {
        rejectedWorkflows.push({
          workflowId: workflow.id,
          workflowName: workflow.name,
          reasons: conditionIssues,
        });
        continue;
      }
      acceptedWorkflows.push(workflow.id);
      plannedActions.push(
        ...workflow.actions.map((action) => ({
          workflowId: workflow.id,
          workflowName: workflow.name,
          type: action.type,
          parameters: action.parameters,
        })),
      );
    }

    const report: AutomationSimulationReport = {
      id: this.idGenerator.next(),
      event,
      simulatedAt: this.clock.now().toISOString(),
      evaluatedWorkflows: compatible.length,
      acceptedWorkflows,
      rejectedWorkflows,
      plannedActions,
    };
    this.reports.push(report);
    return report;
  }

  listReports(): readonly AutomationSimulationReport[] {
    return [...this.reports];
  }

  clearReports(): void {
    this.reports.length = 0;
  }
}
