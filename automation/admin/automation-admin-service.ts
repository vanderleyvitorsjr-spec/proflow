import { AutomationEngine } from "../engine/automation-engine";
import { AutomationSimulator } from "../engine/automation-simulator";
import type {
  AutomationClock,
  AutomationIdGenerator,
  AutomationTriggerEvent,
  AutomationTriggerPayloadMap,
  AutomationTriggerType,
  AutomationWorkflow,
} from "../types/automation-types";
import { AutomationAdminRepository } from "./automation-admin-repository";
import { SYSTEM_WORKFLOW_ID } from "./automation-admin-seed";
import {
  AUTOMATION_HISTORY_STATUS,
  AUTOMATION_WORKFLOW_MODE,
  AUTOMATION_WORKFLOW_STATUS,
  type AutomationHistoryEntry,
  type AutomationHistoryFilters,
  type AutomationWorkflowInput,
  type PersistedAutomationWorkflow,
} from "./automation-admin-types";
import { validateAdministrativeWorkflow } from "./automation-admin-validation";

export class AutomationAdminValidationError extends Error {
  constructor(
    message: string,
    readonly issues: ReturnType<typeof validateAdministrativeWorkflow>,
  ) {
    super(message);
  }
}

export class AutomationAdminService {
  constructor(
    private readonly repository: AutomationAdminRepository,
    private readonly clock: AutomationClock = { now: () => new Date() },
    private readonly idGenerator: AutomationIdGenerator = {
      next: () => crypto.randomUUID(),
    },
  ) {}

  async listWorkflows(): Promise<PersistedAutomationWorkflow[]> {
    return (await this.repository.read()).workflows;
  }

  async getWorkflow(id: string): Promise<PersistedAutomationWorkflow | null> {
    return (await this.listWorkflows()).find((item) => item.id === id) ?? null;
  }

  async listHistory(
    filters: AutomationHistoryFilters = {},
  ): Promise<AutomationHistoryEntry[]> {
    return (await this.repository.read()).history.filter(
      (entry) =>
        (!filters.workflowId || entry.workflowId === filters.workflowId) &&
        (!filters.status || entry.status === filters.status) &&
        (!filters.mode || entry.mode === filters.mode) &&
        (!filters.trigger || entry.trigger === filters.trigger) &&
        (!filters.from || entry.startedAt >= filters.from) &&
        (!filters.to || entry.startedAt <= filters.to),
    );
  }

  async create(
    input: AutomationWorkflowInput,
  ): Promise<PersistedAutomationWorkflow> {
    const existing = await this.listWorkflows();
    this.assertValid(input, existing);
    const now = this.clock.now().toISOString();
    const id = this.idGenerator.next();
    if (existing.some((item) => item.id === id))
      throw new Error("Já existe uma automação com este identificador.");
    return this.repository.saveWorkflow({
      ...input,
      id,
      isSystem: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  async update(
    id: string,
    input: AutomationWorkflowInput,
  ): Promise<PersistedAutomationWorkflow> {
    const existing = await this.listWorkflows();
    const current = existing.find((item) => item.id === id);
    if (!current) throw new Error("Automação não encontrada.");
    if (current.isSystem && input.status === AUTOMATION_WORKFLOW_STATUS.DRAFT)
      throw new Error("A automação obrigatória pode estar ativa ou pausada.");
    this.assertValid(input, existing, id);
    return this.repository.saveWorkflow({
      ...current,
      ...input,
      mode: current.isSystem ? AUTOMATION_WORKFLOW_MODE.REAL : input.mode,
      updatedAt: this.clock.now().toISOString(),
    });
  }

  async duplicate(id: string): Promise<PersistedAutomationWorkflow> {
    const current = await this.getWorkflow(id);
    if (!current) throw new Error("Automação não encontrada.");
    return this.create({
      name: `${current.name} — Cópia`,
      description: current.description,
      trigger: current.trigger,
      conditions: current.conditions,
      actions: current.actions,
      status: AUTOMATION_WORKFLOW_STATUS.DRAFT,
      mode: AUTOMATION_WORKFLOW_MODE.SIMULATION,
      source: current.source,
    });
  }

  async changeStatus(
    id: string,
    status: "ACTIVE" | "PAUSED",
  ): Promise<PersistedAutomationWorkflow> {
    const current = await this.getWorkflow(id);
    if (!current) throw new Error("Automação não encontrada.");
    return this.repository.saveWorkflow({
      ...current,
      status,
      updatedAt: this.clock.now().toISOString(),
    });
  }

  async remove(id: string): Promise<void> {
    const current = await this.getWorkflow(id);
    if (!current) throw new Error("Automação não encontrada.");
    if (current.isSystem)
      throw new Error("A automação obrigatória do sistema não pode ser excluída.");
    await this.repository.removeWorkflow(id);
  }

  appendHistory(entry: AutomationHistoryEntry): Promise<void> {
    return this.repository.appendHistory(entry);
  }

  async recordConfirmedFinancialConversion(input: {
    suggestionId: string;
    serviceOrderId: string;
    financialEntryId: string;
  }): Promise<void> {
    const workflow = await this.getWorkflow(SYSTEM_WORKFLOW_ID);
    if (!workflow) throw new Error("Automação obrigatória não encontrada.");
    const now = this.clock.now().toISOString();
    await this.appendHistory({
      id: this.idGenerator.next(),
      workflowId: workflow.id,
      workflowName: workflow.name,
      eventId: `financial-conversion:${input.suggestionId}`,
      trigger: workflow.trigger.type,
      mode: AUTOMATION_WORKFLOW_MODE.REAL,
      result: "Rascunho financeiro confirmado pelo usuário.",
      status: AUTOMATION_HISTORY_STATUS.SUCCESS,
      startedAt: now,
      finishedAt: now,
      durationMs: 0,
      source: "Central Operacional",
      entityId: input.serviceOrderId,
      plannedActions: [],
      executedActions: [`Recebível criado: ${input.financialEntryId}`],
      skippedActions: [],
      rejectionReasons: [],
    });
  }

  async simulateManually(
    id: string,
    payload?: Readonly<Record<string, unknown>>,
  ) {
    const workflow = await this.getWorkflow(id);
    if (!workflow) throw new Error("Automação não encontrada.");
    const started = this.clock.now();
    const event = this.manualEvent(workflow.trigger.type, payload, started);
    const simulator = new AutomationSimulator({
      workflows: [this.toEngineWorkflow(workflow, true)],
      engine: new AutomationEngine({
        clock: this.clock,
        idGenerator: this.idGenerator,
      }),
      clock: this.clock,
      idGenerator: this.idGenerator,
    });
    const report = simulator.simulate(event);
    const finished = this.clock.now();
    const accepted = report.acceptedWorkflows.includes(workflow.id);
    await this.appendHistory({
      id: this.idGenerator.next(),
      workflowId: workflow.id,
      workflowName: workflow.name,
      eventId: event.id,
      trigger: event.type,
      mode: AUTOMATION_WORKFLOW_MODE.SIMULATION,
      result: accepted ? "Simulação aceita." : "Simulação rejeitada.",
      status: accepted
        ? AUTOMATION_HISTORY_STATUS.SIMULATED
        : AUTOMATION_HISTORY_STATUS.REJECTED,
      startedAt: started.toISOString(),
      finishedAt: finished.toISOString(),
      durationMs: Math.max(0, finished.getTime() - started.getTime()),
      source: "Simulação manual",
      entityId: this.entityId(event),
      plannedActions: report.plannedActions,
      executedActions: [],
      skippedActions: report.plannedActions.map((action) => action.type),
      rejectionReasons: report.rejectedWorkflows.flatMap((item) =>
        item.reasons.map((reason) => reason.message),
      ),
    });
    return { event, report };
  }

  toEngineWorkflow(
    workflow: PersistedAutomationWorkflow,
    manual = false,
  ): AutomationWorkflow {
    return {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      enabled: manual || workflow.status === AUTOMATION_WORKFLOW_STATUS.ACTIVE,
      trigger: workflow.trigger,
      conditions: workflow.conditions,
      actions: workflow.actions,
    };
  }

  private assertValid(
    input: AutomationWorkflowInput,
    existing: PersistedAutomationWorkflow[],
    currentId?: string,
  ) {
    const issues = validateAdministrativeWorkflow(input, existing, currentId);
    if (issues.length)
      throw new AutomationAdminValidationError(issues[0]!.message, issues);
  }

  private manualEvent(
    type: AutomationTriggerType,
    payload: Readonly<Record<string, unknown>> | undefined,
    now: Date,
  ): AutomationTriggerEvent {
    return {
      id: this.idGenerator.next(),
      type,
      occurredAt: now.toISOString(),
      source: "automation-admin",
      mode: "simulation",
      payload: (payload ?? defaultPayload(type, now.toISOString())) as never,
      metadata: { manual: true },
    } as AutomationTriggerEvent;
  }

  private entityId(event: AutomationTriggerEvent): string | undefined {
    const payload = event.payload as Readonly<Record<string, unknown>>;
    const value =
      payload.serviceOrderId ??
      payload.clientId ??
      payload.leadId ??
      payload.eventId ??
      payload.equipmentId ??
      payload.stockItemId ??
      payload.financialEntryId;
    return typeof value === "string" ? value : undefined;
  }
}

export function defaultPayload<T extends AutomationTriggerType>(
  type: T,
  now = new Date().toISOString(),
): AutomationTriggerPayloadMap[T] {
  const examples: AutomationTriggerPayloadMap = {
    CLIENT_CREATED: { clientId: "cliente-exemplo", name: "Cliente de exemplo" },
    LEAD_CREATED: { leadId: "oportunidade-exemplo", status: "OPEN", createdAt: now },
    LEAD_UPDATED: { leadId: "oportunidade-exemplo", status: "OPEN", updatedAt: now },
    SERVICE_ORDER_CREATED: {
      serviceOrderId: "ordem-exemplo",
      clientId: "cliente-exemplo",
      totalAmountCents: 100000,
      createdAt: now,
    },
    SERVICE_ORDER_COMPLETED: {
      serviceOrderId: "ordem-exemplo",
      clientId: "cliente-exemplo",
      orderNumber: "OS-EXEMPLO",
      clientName: "Cliente de exemplo",
      totalAmountCents: 100000,
      completedAt: now,
    },
    PAYMENT_REGISTERED: {
      financialEntryId: "lancamento-exemplo",
      amountCents: 100000,
      paidAt: now,
    },
    PAYMENT_OVERDUE: {
      financialEntryId: "lancamento-exemplo",
      amountCents: 100000,
      dueDate: now.slice(0, 10),
    },
    EQUIPMENT_CREATED: { equipmentId: "equipamento-exemplo", createdAt: now },
    WARRANTY_EXPIRED: {
      equipmentId: "equipamento-exemplo",
      warrantyEndDate: now.slice(0, 10),
    },
    STOCK_BELOW_MINIMUM: {
      stockItemId: "item-exemplo",
      currentQuantity: 2,
      minimumQuantity: 5,
    },
    AGENDA_CREATED: { eventId: "agenda-exemplo", startAt: now },
    AGENDA_COMPLETED: { eventId: "agenda-exemplo", completedAt: now },
  };
  return examples[type];
}

export { SYSTEM_WORKFLOW_ID };
