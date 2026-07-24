import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { actionRegistry } from "../actions/action-registry";
import { conditionRegistry } from "../conditions/condition-registry";
import { AutomationEngine } from "../engine/automation-engine";
import { AutomationSimulator } from "../engine/automation-simulator";
import { AutomationEventBus } from "../events/automation-event-bus";
import { AutomationRuntime } from "../runtime/automation-runtime";
import { FinancialSuggestionRepository } from "../suggestions/financial-suggestion-repository";
import { FinancialSuggestionService } from "../suggestions/financial-suggestion-service";
import type { FinancialSuggestionStorageAdapter } from "../suggestions/financial-suggestion-storage-adapter";
import {
  FINANCIAL_SUGGESTION_STATUS,
  type FinancialSuggestion,
} from "../suggestions/financial-suggestion-types";
import { AutomationAdminRepository } from "../admin/automation-admin-repository";
import { AutomationAdminService } from "../admin/automation-admin-service";
import {
  normalizeAutomationAdminState,
  type AutomationAdminStorageAdapter,
} from "../admin/automation-admin-storage-adapter";
import {
  AUTOMATION_HISTORY_STATUS,
  AUTOMATION_WORKFLOW_MODE,
  AUTOMATION_WORKFLOW_STATUS,
  type AutomationAdminState,
  type AutomationWorkflowInput,
} from "../admin/automation-admin-types";
import {
  ensureSystemWorkflow,
  SYSTEM_WORKFLOW_ID,
} from "../admin/automation-admin-seed";
import { financialSuggestionsToOperationalItems } from "../suggestions/financial-suggestion-operational";
import {
  FinancialSuggestionConversionService,
  type FinancialDraftInput,
} from "../suggestions/financial-suggestion-conversion-service";
import { triggerRegistry } from "../triggers/trigger-registry";
import { automationWorkflowRegistry } from "../registry/workflow-registry";
import { automationAdminService } from "../admin/automation-admin-actions";
import {
  AUTOMATION_ACTION,
  AUTOMATION_CONDITION,
  AUTOMATION_TRIGGER,
  type AutomationActionConfiguration,
  type AutomationConditionConfiguration,
  type AutomationIdGenerator,
  type AutomationTriggerEvent,
  type AutomationWorkflow,
} from "../types/automation-types";
import {
  completedOrderEvent,
  lowStockEvent,
  simulationWorkflows,
} from "./automation-fixtures";

const fixedClock = { now: () => new Date("2026-07-23T13:00:00.000Z") };
function ids(...values: string[]): AutomationIdGenerator {
  let index = 0;
  return { next: () => values[index++] ?? `fallback-${index}` };
}
function engine() {
  return new AutomationEngine({
    clock: fixedClock,
    idGenerator: ids("dry-run-1", "dry-run-2", "dry-run-3"),
  });
}

describe("registries de automação", () => {
  test("registra todos os triggers, condições e ações disponíveis", () => {
    assert.equal(triggerRegistry.size, 12);
    assert.equal(conditionRegistry.size, 8);
    assert.equal(actionRegistry.size, 8);
    assert.ok(triggerRegistry.has(AUTOMATION_TRIGGER.SERVICE_ORDER_COMPLETED));
    assert.ok(conditionRegistry.has(AUTOMATION_CONDITION.DAYS_WITHOUT_ACTIVITY));
    assert.ok(actionRegistry.has(AUTOMATION_ACTION.CREATE_SUGGESTION));
    assert.equal(automationWorkflowRegistry.list().length, 1);
  });
});

describe("validação estrutural do engine", () => {
  test("aceita uma automação estruturalmente válida", () => {
    const result = engine().register(simulationWorkflows[0], completedOrderEvent);
    assert.equal(result.ok, true);
    assert.equal(result.record.status, "REGISTERED");
  });

  test("rejeita trigger desconhecido", () => {
    const workflow = {
      ...simulationWorkflows[0],
      trigger: { type: "UNKNOWN_TRIGGER" },
    } as unknown as AutomationWorkflow;
    const result = engine().register(workflow, completedOrderEvent);
    assert.equal(result.ok, false);
    assert.ok(result.record.issues.some((issue) => issue.path === "workflow.trigger.type"));
  });

  test("rejeita condição e ação desconhecidas", () => {
    const workflow = {
      ...simulationWorkflows[0],
      conditions: [
        { type: "UNKNOWN_CONDITION", parameters: {} },
      ] as unknown as AutomationConditionConfiguration[],
      actions: [
        { type: "UNKNOWN_ACTION", parameters: {} },
      ] as unknown as AutomationActionConfiguration[],
    };
    const result = engine().register(workflow, completedOrderEvent);
    assert.equal(result.ok, false);
    assert.ok(result.record.issues.some((issue) => issue.path.includes("conditions.0.type")));
    assert.ok(result.record.issues.some((issue) => issue.path.includes("actions.0.type")));
  });

  test("rejeita parâmetro obrigatório ausente", () => {
    const workflow = {
      ...simulationWorkflows[0],
      actions: [
        {
          type: AUTOMATION_ACTION.CREATE_FINANCIAL_ENTRY,
          parameters: {},
        },
      ] as unknown as AutomationActionConfiguration[],
    };
    const result = engine().register(workflow, completedOrderEvent);
    assert.equal(result.ok, false);
    assert.ok(result.record.issues.some((issue) => issue.path.endsWith("parameters.title")));
  });

  test("mantém histórico determinístico e permite limpeza", () => {
    const instance = engine();
    instance.register(simulationWorkflows[0], completedOrderEvent);
    instance.register(
      simulationWorkflows[1],
      { ...lowStockEvent, id: "event-low-stock-2" },
    );
    assert.deepEqual(
      instance.listRecords().map((record) => record.id),
      ["dry-run-1", "dry-run-2"],
    );
    assert.ok(
      instance.listRecords().every(
        (record) => record.receivedAt === "2026-07-23T13:00:00.000Z",
      ),
    );
    instance.clearRecords();
    assert.equal(instance.listRecords().length, 0);
  });
});

describe("barramento tipado de eventos", () => {
  test("publica evento válido para múltiplos listeners", async () => {
    const bus = new AutomationEventBus();
    const calls: string[] = [];
    bus.subscribe(AUTOMATION_TRIGGER.SERVICE_ORDER_COMPLETED, (event) => {
      calls.push(event.payload.serviceOrderId);
    });
    bus.subscribe(AUTOMATION_TRIGGER.SERVICE_ORDER_COMPLETED, () => {
      calls.push("second");
    });
    const result = await bus.publish(completedOrderEvent);
    assert.equal(result.ok, true);
    assert.equal(result.deliveredListeners, 2);
    assert.deepEqual(calls, ["order-1", "second"]);
  });

  test("remove listener e limpa o barramento", async () => {
    const bus = new AutomationEventBus();
    let calls = 0;
    const remove = bus.subscribe(AUTOMATION_TRIGGER.STOCK_BELOW_MINIMUM, () => {
      calls += 1;
    });
    assert.equal(bus.listenerCount(), 1);
    remove();
    await bus.publish(lowStockEvent);
    assert.equal(calls, 0);
    bus.subscribe(AUTOMATION_TRIGGER.STOCK_BELOW_MINIMUM, () => undefined);
    bus.clearListeners();
    assert.equal(bus.listenerCount(), 0);
    assert.deepEqual(bus.registeredTriggers(), []);
  });

  test("rejeita payload inválido e identificador repetido", async () => {
    const bus = new AutomationEventBus();
    const invalid = {
      ...completedOrderEvent,
      payload: { serviceOrderId: "order-1" },
    } as unknown as AutomationTriggerEvent;
    const invalidResult = await bus.publish(invalid);
    assert.equal(invalidResult.ok, false);
    if (!invalidResult.ok)
      assert.ok(
        invalidResult.issues.some((issue) => issue.path === "event.payload.clientId"),
      );
    assert.equal((await bus.publish(completedOrderEvent)).ok, true);
    const duplicate = await bus.publish(completedOrderEvent);
    assert.equal(duplicate.ok, false);
  });

  test("aceita o modo de execução sem alterar a entrega tipada", async () => {
    const bus = new AutomationEventBus();
    const result = await bus.publish({
      ...completedOrderEvent,
      id: "event-order-execution",
      mode: "execution",
    });
    assert.equal(result.ok, true);
  });
});

describe("simulação sem efeitos colaterais", () => {
  test("encaminha evento, relata ações planejadas e não executa action real", async () => {
    const state = { writes: 0 };
    const simulator = new AutomationSimulator({
      workflows: simulationWorkflows,
      engine: engine(),
      clock: fixedClock,
      idGenerator: ids("simulation-1"),
    });
    const bus = new AutomationEventBus(simulator);
    const result = await bus.publish(completedOrderEvent);
    assert.equal(result.ok, true);
    assert.equal(state.writes, 0);
    if (result.ok) {
      assert.equal(result.simulation?.evaluatedWorkflows, 1);
      assert.deepEqual(result.simulation?.acceptedWorkflows, [
        "fixture-order-completed",
      ]);
      assert.equal(result.simulation?.rejectedWorkflows.length, 0);
      assert.equal(
        result.simulation?.plannedActions[0]?.type,
        AUTOMATION_ACTION.CREATE_FINANCIAL_ENTRY,
      );
      assert.equal(result.simulation?.simulatedAt, "2026-07-23T13:00:00.000Z");
    }
  });

  test("relata rejeição estrutural e limpa histórico de simulação", () => {
    const invalidWorkflow = {
      ...simulationWorkflows[0],
      id: "fixture-invalid",
      actions: [
        {
          type: AUTOMATION_ACTION.CREATE_FINANCIAL_ENTRY,
          parameters: {},
        },
      ] as unknown as AutomationActionConfiguration[],
    };
    const simulator = new AutomationSimulator({
      workflows: [invalidWorkflow],
      engine: engine(),
      clock: fixedClock,
      idGenerator: ids("simulation-rejected"),
    });
    const report = simulator.simulate(completedOrderEvent);
    assert.equal(report.acceptedWorkflows.length, 0);
    assert.equal(report.rejectedWorkflows.length, 1);
    assert.ok(report.rejectedWorkflows[0]?.reasons.length);
    assert.equal(simulator.listReports().length, 1);
    simulator.clearReports();
    assert.equal(simulator.listReports().length, 0);
  });

  test("rejeita workflow quando a condição tipada não é atendida", () => {
    const conditional: AutomationWorkflow = {
      ...simulationWorkflows[0],
      id: "fixture-value-condition",
      conditions: [
        {
          type: AUTOMATION_CONDITION.VALUE_ABOVE,
          parameters: { amountCents: 200000 },
        },
      ],
    };
    const report = new AutomationSimulator({
      workflows: [conditional],
      engine: engine(),
      clock: fixedClock,
      idGenerator: ids("condition-report"),
    }).simulate(completedOrderEvent);
    assert.equal(report.acceptedWorkflows.length, 0);
    assert.match(
      report.rejectedWorkflows[0]?.reasons[0]?.message ?? "",
      /condição/,
    );
  });
});

describe("primeira automação real: sugestão de recebimento", () => {
  function suggestionFixture() {
    let records: FinancialSuggestion[] = [];
    const storage: FinancialSuggestionStorageAdapter = {
      list: async () => structuredClone(records),
      replace: async (next) => {
        records = structuredClone(next);
      },
    };
    const service = new FinancialSuggestionService(
      new FinancialSuggestionRepository(storage),
      fixedClock,
      ids("suggestion-1"),
    );
    return { service, records: () => records };
  }

  test("avalia o workflow e cria somente uma sugestão pendente", async () => {
    const fixture = suggestionFixture();
    const runtime = new AutomationRuntime(
      fixture.service,
      automationAdminService,
      engine(),
    );
    const bus = new AutomationEventBus(runtime);
    const result = await bus.publish({
      ...completedOrderEvent,
      id: "real-order-completed-1",
      mode: "execution",
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(result.simulation?.acceptedWorkflows, [
        "service-order-completed-receipt-suggestion",
      ]);
      assert.equal(
        result.simulation?.plannedActions[0]?.type,
        AUTOMATION_ACTION.CREATE_SUGGESTION,
      );
    }
    assert.equal(fixture.records().length, 1);
    assert.deepEqual(
      {
        origin: fixture.records()[0]?.origin,
        orderNumber: fixture.records()[0]?.orderNumber,
        clientName: fixture.records()[0]?.clientName,
        amountCents: fixture.records()[0]?.amountCents,
        status: fixture.records()[0]?.status,
      },
      {
        origin: "SERVICE_ORDER",
        orderNumber: "OS-2026-0001",
        clientName: "Cliente de Teste",
        amountCents: 125000,
        status: FINANCIAL_SUGGESTION_STATUS.PENDING,
      },
    );
  });

  test("não duplica a sugestão e aceitar ou descartar não cria lançamento", async () => {
    const fixture = suggestionFixture();
    const first = await fixture.service.createFromCompletedOrder(completedOrderEvent);
    const second = await fixture.service.createFromCompletedOrder({
      ...completedOrderEvent,
      id: "event-order-completed-replayed",
    });
    assert.equal(first.id, second.id);
    assert.equal(fixture.records().length, 1);

    const accepted = await fixture.service.changeStatus(
      first.id,
      FINANCIAL_SUGGESTION_STATUS.ACCEPTED,
    );
    assert.equal(accepted.status, FINANCIAL_SUGGESTION_STATUS.ACCEPTED);
    assert.equal(fixture.records().length, 1);

    const discardedFixture = suggestionFixture();
    const pending = await discardedFixture.service.createFromCompletedOrder({
      ...completedOrderEvent,
      id: "event-order-completed-discard",
      payload: {
        ...completedOrderEvent.payload,
        serviceOrderId: "order-2",
        orderNumber: "OS-2026-0002",
      },
    });
    const discarded = await discardedFixture.service.changeStatus(
      pending.id,
      FINANCIAL_SUGGESTION_STATUS.DISCARDED,
    );
    assert.equal(discarded.status, FINANCIAL_SUGGESTION_STATUS.DISCARDED);
    assert.equal(discardedFixture.records().length, 1);
  });
});

describe("administração persistente de automações", () => {
  function adminFixture(initial?: Partial<AutomationAdminState>) {
    let state: AutomationAdminState = normalizeAutomationAdminState(
      {
        version: 1,
        workflows: initial?.workflows ?? [],
        history: initial?.history ?? [],
      },
      "2026-07-23T10:00:00.000Z",
    );
    const storage: AutomationAdminStorageAdapter = {
      read: async () => structuredClone(state),
      write: async (next) => {
        state = structuredClone(next);
      },
    };
    let sequence = 0;
    const service = new AutomationAdminService(
      new AutomationAdminRepository(storage),
      fixedClock,
      { next: () => `admin-id-${++sequence}` },
    );
    return { service, state: () => state };
  }

  const validInput = (name = "Acompanhar novo cliente"): AutomationWorkflowInput => ({
    name,
    description: "Planeja uma tarefa de acompanhamento para o novo cadastro.",
    source: "Clientes",
    status: AUTOMATION_WORKFLOW_STATUS.DRAFT,
    mode: AUTOMATION_WORKFLOW_MODE.SIMULATION,
    trigger: { type: AUTOMATION_TRIGGER.CLIENT_CREATED },
    conditions: [{ type: AUTOMATION_CONDITION.ALWAYS, parameters: {} }],
    actions: [
      {
        type: AUTOMATION_ACTION.CREATE_TASK,
        parameters: { title: "Revisar cadastro" },
      },
    ],
  });

  test("seed do sistema é idempotente e normaliza versões antigas", () => {
    const once = ensureSystemWorkflow([], "2026-07-23T10:00:00.000Z");
    const twice = ensureSystemWorkflow(once, "2026-07-23T11:00:00.000Z");
    assert.equal(twice.filter((item) => item.id === SYSTEM_WORKFLOW_ID).length, 1);
    const migrated = normalizeAutomationAdminState(
      { version: 0, workflows: [], history: [] },
      "2026-07-23T10:00:00.000Z",
    );
    assert.equal(migrated.version, 1);
    assert.ok(migrated.workflows.some((item) => item.isSystem));
  });

  test("persiste, cria rascunho, ativa, pausa e filtra histórico", async () => {
    const fixture = adminFixture();
    const created = await fixture.service.create(validInput());
    assert.equal(created.status, AUTOMATION_WORKFLOW_STATUS.DRAFT);
    assert.ok(fixture.state().workflows.some((item) => item.id === created.id));
    const active = await fixture.service.changeStatus(created.id, "ACTIVE");
    assert.equal(active.status, AUTOMATION_WORKFLOW_STATUS.ACTIVE);
    const paused = await fixture.service.changeStatus(created.id, "PAUSED");
    assert.equal(paused.status, AUTOMATION_WORKFLOW_STATUS.PAUSED);
    await fixture.service.appendHistory({
      id: "history-filter",
      workflowId: created.id,
      workflowName: created.name,
      eventId: "event-filter",
      trigger: created.trigger.type,
      mode: created.mode,
      result: "Simulada.",
      status: AUTOMATION_HISTORY_STATUS.SIMULATED,
      startedAt: "2026-07-23T10:00:00.000Z",
      finishedAt: "2026-07-23T10:00:00.000Z",
      durationMs: 0,
      source: "Teste",
      plannedActions: [],
      executedActions: [],
      skippedActions: [],
      rejectionReasons: [],
    });
    assert.equal(
      (await fixture.service.listHistory({
        workflowId: created.id,
        status: AUTOMATION_HISTORY_STATUS.SIMULATED,
      })).length,
      1,
    );
  });

  test("duplica e exclui workflow comum, mas protege o workflow do sistema", async () => {
    const fixture = adminFixture();
    const created = await fixture.service.create(validInput());
    const copy = await fixture.service.duplicate(created.id);
    assert.equal(copy.mode, AUTOMATION_WORKFLOW_MODE.SIMULATION);
    assert.equal(copy.status, AUTOMATION_WORKFLOW_STATUS.DRAFT);
    await fixture.service.remove(created.id);
    assert.equal(await fixture.service.getWorkflow(created.id), null);
    await assert.rejects(
      () => fixture.service.remove(SYSTEM_WORKFLOW_ID),
      /não pode ser excluída/,
    );
  });

  test("bloqueia modo real, gatilho, condição, ação e parâmetros inválidos", async () => {
    const fixture = adminFixture();
    await assert.rejects(
      () =>
        fixture.service.create({
          ...validInput(),
          mode: AUTOMATION_WORKFLOW_MODE.REAL,
        }),
      /simulação/,
    );
    await assert.rejects(
      () =>
        fixture.service.create({
          ...validInput("Gatilho inválido"),
          trigger: { type: "UNKNOWN" as never },
        }),
      /gatilho/,
    );
    await assert.rejects(
      () =>
        fixture.service.create({
          ...validInput("Sem condição"),
          conditions: [],
        }),
      /condição/,
    );
    await assert.rejects(
      () =>
        fixture.service.create({
          ...validInput("Sem ação"),
          actions: [],
        }),
      /ação/,
    );
    await assert.rejects(
      () =>
        fixture.service.create({
          ...validInput("Parâmetro ausente"),
          actions: [
            {
              type: AUTOMATION_ACTION.CREATE_TASK,
              parameters: {},
            } as never,
          ],
        }),
      /parâmetro/,
    );
  });

  test("simula manualmente rascunho e persiste o relatório", async () => {
    const fixture = adminFixture();
    const created = await fixture.service.create(validInput());
    const result = await fixture.service.simulateManually(created.id);
    assert.ok(result.report.acceptedWorkflows.includes(created.id));
    const records = await fixture.service.listHistory({
      status: AUTOMATION_HISTORY_STATUS.SIMULATED,
    });
    assert.equal(records.length, 1);
    assert.equal(records[0]?.executedActions.length, 0);
  });

  test("workflow pausado registra evento ignorado e não produz sugestão", async () => {
    const fixture = adminFixture();
    await fixture.service.changeStatus(SYSTEM_WORKFLOW_ID, "PAUSED");
    let suggestions = 0;
    const runtime = new AutomationRuntime(
      {
        createFromCompletedOrder: async () => {
          suggestions += 1;
        },
      },
      fixture.service,
      engine(),
      fixedClock,
      ids("runtime-report", "runtime-history"),
    );
    await runtime.simulate({
      ...completedOrderEvent,
      id: "event-paused-system",
      mode: "execution",
    });
    assert.equal(suggestions, 0);
    const skipped = await fixture.service.listHistory({
      status: AUTOMATION_HISTORY_STATUS.SKIPPED,
    });
    assert.equal(skipped.length, 1);
  });
});

describe("conversão confirmada da sugestão financeira", () => {
  const draft: FinancialDraftInput = {
    title: "Recebível da OS-2026-0001",
    description: "Serviço concluído",
    category: "Serviços",
    accountId: "account-1",
    total: "1.250,00",
    issueDate: "2026-07-23",
    competenceDate: "2026-07-23",
    firstDueDate: "2026-07-30",
    installmentCount: 1,
    supplier: "",
    customerName: "Cliente de Teste",
    clientId: "client-1",
    notes: "Origem automática.",
  };

  test("confirma uma única conta pendente, converte e não altera pagamento ou saldo", async () => {
    const suggestionFixture = (() => {
      let records: FinancialSuggestion[] = [];
      const storage: FinancialSuggestionStorageAdapter = {
        list: async () => structuredClone(records),
        replace: async (next) => {
          records = structuredClone(next);
        },
      };
      return new FinancialSuggestionService(
        new FinancialSuggestionRepository(storage),
        fixedClock,
        ids("suggestion-conversion"),
      );
    })();
    const pending = await suggestionFixture.createFromCompletedOrder(completedOrderEvent);
    await suggestionFixture.changeStatus(
      pending.id,
      FINANCIAL_SUGGESTION_STATUS.ACCEPTED,
    );
    let receivables = 0;
    const payments = 0;
    const balanceChanges = 0;
    let audits = 0;
    const conversion = new FinancialSuggestionConversionService({
      getSuggestion: (id) =>
        suggestionFixture.list().then(
          (items) => items.find((item) => item.id === id) ?? null,
        ),
      createReceivable: async () => {
        receivables += 1;
        return { id: "financial-entry-1", existing: false };
      },
      markConverted: (id, financialEntryId) =>
        suggestionFixture.markConverted(id, financialEntryId),
      recordAudit: async () => {
        audits += 1;
      },
    });
    const first = await conversion.confirm(pending.id, draft);
    const second = await conversion.confirm(pending.id, draft);
    assert.equal(receivables, 1);
    assert.equal(audits, 1);
    assert.equal(first.suggestion.status, FINANCIAL_SUGGESTION_STATUS.CONVERTED);
    assert.equal(first.financialEntryId, "financial-entry-1");
    assert.equal(second.existing, true);
    assert.equal(payments, 0);
    assert.equal(balanceChanges, 0);
  });

  test("cancelar antes da confirmação não chama o Financeiro e itens convertidos somem das pendências", async () => {
    const financialCalls = 0;
    const suggestions: FinancialSuggestion[] = [
      {
        id: "pending",
        origin: "SERVICE_ORDER",
        sourceId: "order-1",
        orderNumber: "OS-2026-0001",
        clientId: "client-1",
        clientName: "Cliente de Teste",
        amountCents: 125000,
        occurredAt: "2026-07-23T10:00:00.000Z",
        status: "PENDING",
        createdAt: "2026-07-23T10:00:00.000Z",
        updatedAt: "2026-07-23T10:00:00.000Z",
      },
      {
        id: "converted",
        origin: "SERVICE_ORDER",
        sourceId: "order-2",
        orderNumber: "OS-2026-0002",
        clientId: "client-2",
        clientName: "Outro Cliente",
        amountCents: 90000,
        occurredAt: "2026-07-23T10:00:00.000Z",
        status: "CONVERTED",
        financialEntryId: "financial-2",
        convertedAt: "2026-07-23T11:00:00.000Z",
        createdAt: "2026-07-23T10:00:00.000Z",
        updatedAt: "2026-07-23T11:00:00.000Z",
      },
    ];
    assert.equal(financialCalls, 0);
    const operational = financialSuggestionsToOperationalItems(suggestions);
    assert.equal(operational.length, 1);
    assert.equal(operational[0]?.id, "financial-suggestion-pending");
    assert.equal(new Set(operational.map((item) => item.id)).size, operational.length);
  });
});
