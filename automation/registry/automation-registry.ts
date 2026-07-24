import { actionRegistry } from "../actions/action-registry";
import { conditionRegistry } from "../conditions/condition-registry";
import { triggerRegistry } from "../triggers/trigger-registry";
import type {
  AutomationActionType,
  AutomationConditionType,
  AutomationDefinition,
  AutomationTriggerType,
} from "../types/automation-types";

export class AutomationRegistry {
  constructor(
    private readonly triggers = triggerRegistry,
    private readonly conditions = conditionRegistry,
    private readonly actions = actionRegistry,
  ) {}

  getTrigger(type: AutomationTriggerType) {
    return this.triggers.get(type);
  }

  getCondition(type: AutomationConditionType) {
    return this.conditions.get(type);
  }

  getAction(type: AutomationActionType) {
    return this.actions.get(type);
  }

  listTriggers(): ReadonlyArray<AutomationDefinition<AutomationTriggerType>> {
    return [...this.triggers.values()];
  }

  listConditions(): ReadonlyArray<AutomationDefinition<AutomationConditionType>> {
    return [...this.conditions.values()];
  }

  listActions(): ReadonlyArray<AutomationDefinition<AutomationActionType>> {
    return [...this.actions.values()];
  }
}

export const automationRegistry = new AutomationRegistry();
