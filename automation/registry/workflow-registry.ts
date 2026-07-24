import type {
  AutomationTriggerType,
  AutomationWorkflow,
} from "../types/automation-types";
import { serviceOrderCompletedWorkflow } from "../workflows/service-order-completed-workflow";

export class AutomationWorkflowRegistry {
  constructor(
    private readonly workflows: readonly AutomationWorkflow[] = [
      serviceOrderCompletedWorkflow,
    ],
  ) {}

  list(): readonly AutomationWorkflow[] {
    return [...this.workflows];
  }

  listByTrigger(trigger: AutomationTriggerType): readonly AutomationWorkflow[] {
    return this.workflows.filter((workflow) => workflow.trigger.type === trigger);
  }
}

export const automationWorkflowRegistry = new AutomationWorkflowRegistry();
