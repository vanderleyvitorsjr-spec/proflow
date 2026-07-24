import {
  automationRegistry,
  type AutomationRegistry,
} from "../registry/automation-registry";
import type {
  AutomationClock,
  AutomationDryRunRecord,
  AutomationDryRunResult,
  AutomationIdGenerator,
  AutomationTriggerEvent,
  AutomationValidationIssue,
  AutomationWorkflow,
} from "../types/automation-types";

function missingParameters(
  parameters: Readonly<Record<string, unknown>>,
  requiredKeys: readonly string[],
  path: string,
): AutomationValidationIssue[] {
  return requiredKeys.flatMap((key) => {
    const value = parameters[key];
    return value === undefined || value === null || value === ""
      ? [{ path: `${path}.parameters.${key}`, message: `Informe o parâmetro obrigatório “${key}”.` }]
      : [];
  });
}

export class AutomationEngine {
  private readonly records: AutomationDryRunRecord[] = [];
  private readonly registry: AutomationRegistry;
  private readonly clock: AutomationClock;
  private readonly idGenerator: AutomationIdGenerator;

  constructor({
    registry = automationRegistry,
    clock = { now: () => new Date() },
    idGenerator = { next: () => crypto.randomUUID() },
  }: {
    registry?: AutomationRegistry;
    clock?: AutomationClock;
    idGenerator?: AutomationIdGenerator;
  } = {}) {
    this.registry = registry;
    this.clock = clock;
    this.idGenerator = idGenerator;
  }

  validate(
    workflow: AutomationWorkflow,
    event: AutomationTriggerEvent,
  ): AutomationValidationIssue[] {
    const issues: AutomationValidationIssue[] = [];

    if (!workflow.id.trim())
      issues.push({ path: "workflow.id", message: "Informe o identificador do fluxo." });
    if (!workflow.name.trim())
      issues.push({ path: "workflow.name", message: "Informe o nome do fluxo." });
    if (!event.id.trim())
      issues.push({ path: "event.id", message: "Informe o identificador do evento." });
    if (Number.isNaN(new Date(event.occurredAt).getTime()))
      issues.push({ path: "event.occurredAt", message: "Informe uma data válida para o evento." });
    if (!this.registry.getTrigger(workflow.trigger.type))
      issues.push({ path: "workflow.trigger.type", message: "O trigger não está registrado." });
    if (workflow.trigger.type !== event.type)
      issues.push({ path: "event.type", message: "O evento não corresponde ao trigger do fluxo." });
    if (!workflow.actions.length)
      issues.push({ path: "workflow.actions", message: "Adicione pelo menos uma ação ao fluxo." });

    workflow.conditions.forEach((condition, index) => {
      const definition = this.registry.getCondition(condition.type);
      if (!definition) {
        issues.push({ path: `workflow.conditions.${index}.type`, message: "A condição não está registrada." });
        return;
      }
      issues.push(
        ...missingParameters(
          condition.parameters,
          definition.parameterKeys,
          `workflow.conditions.${index}`,
        ),
      );
    });

    workflow.actions.forEach((action, index) => {
      const definition = this.registry.getAction(action.type);
      if (!definition) {
        issues.push({ path: `workflow.actions.${index}.type`, message: "A ação não está registrada." });
        return;
      }
      issues.push(
        ...missingParameters(
          action.parameters,
          definition.parameterKeys,
          `workflow.actions.${index}`,
        ),
      );
    });

    return issues;
  }

  register(
    workflow: AutomationWorkflow,
    event: AutomationTriggerEvent,
  ): AutomationDryRunResult {
    const issues = this.validate(workflow, event);
    const receivedAt = this.clock.now().toISOString();
    const record: AutomationDryRunRecord = {
      id: this.idGenerator.next(),
      workflowId: workflow.id,
      workflowName: workflow.name,
      triggerType: event.type,
      eventId: event.id,
      receivedAt,
      status: issues.length ? "REJECTED" : "REGISTERED",
      conditionCount: workflow.conditions.length,
      actionCount: workflow.actions.length,
      issues,
    };

    this.records.push(record);
    return issues.length
      ? { ok: false, record, issues }
      : { ok: true, record };
  }

  listRecords(): readonly AutomationDryRunRecord[] {
    return [...this.records];
  }

  clearRecords(): void {
    this.records.length = 0;
  }
}

export const automationEngine = new AutomationEngine();
