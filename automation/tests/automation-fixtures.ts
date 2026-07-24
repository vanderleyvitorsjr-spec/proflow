import {
  AUTOMATION_ACTION,
  AUTOMATION_CONDITION,
  AUTOMATION_TRIGGER,
  type AutomationTriggerEvent,
  type AutomationWorkflow,
} from "../types/automation-types";

export const simulationWorkflows = [
  {
    id: "fixture-order-completed",
    name: "Simular financeiro após conclusão",
    enabled: true,
    trigger: { type: AUTOMATION_TRIGGER.SERVICE_ORDER_COMPLETED },
    conditions: [{ type: AUTOMATION_CONDITION.ALWAYS, parameters: {} }],
    actions: [
      {
        type: AUTOMATION_ACTION.CREATE_FINANCIAL_ENTRY,
        parameters: { title: "Lançamento simulado da Ordem" },
      },
    ],
  },
  {
    id: "fixture-low-stock",
    name: "Simular sugestão de reposição",
    enabled: true,
    trigger: { type: AUTOMATION_TRIGGER.STOCK_BELOW_MINIMUM },
    conditions: [{ type: AUTOMATION_CONDITION.ALWAYS, parameters: {} }],
    actions: [
      {
        type: AUTOMATION_ACTION.CREATE_SUGGESTION,
        parameters: {
          title: "Repor material",
          description: "Avaliar uma compra para recompor o estoque.",
        },
      },
    ],
  },
  {
    id: "fixture-stale-lead",
    name: "Simular tarefa para lead sem atividade",
    enabled: true,
    trigger: { type: AUTOMATION_TRIGGER.LEAD_UPDATED },
    conditions: [
      {
        type: AUTOMATION_CONDITION.DAYS_WITHOUT_ACTIVITY,
        parameters: { days: 7 },
      },
    ],
    actions: [
      {
        type: AUTOMATION_ACTION.CREATE_TASK,
        parameters: { title: "Retomar contato comercial" },
      },
    ],
  },
] as const satisfies readonly AutomationWorkflow[];

export const completedOrderEvent: AutomationTriggerEvent<"SERVICE_ORDER_COMPLETED"> = {
  id: "event-order-completed-1",
  type: AUTOMATION_TRIGGER.SERVICE_ORDER_COMPLETED,
  occurredAt: "2026-07-23T12:00:00.000Z",
  source: "service-orders",
  mode: "simulation",
  payload: {
    serviceOrderId: "order-1",
    clientId: "client-1",
    orderNumber: "OS-2026-0001",
    clientName: "Cliente de Teste",
    totalAmountCents: 125000,
    completedAt: "2026-07-23T11:55:00.000Z",
  },
  metadata: { requestedBy: "unit-test" },
};

export const lowStockEvent: AutomationTriggerEvent<"STOCK_BELOW_MINIMUM"> = {
  id: "event-low-stock-1",
  type: AUTOMATION_TRIGGER.STOCK_BELOW_MINIMUM,
  occurredAt: "2026-07-23T12:05:00.000Z",
  source: "stock",
  mode: "simulation",
  payload: {
    stockItemId: "stock-1",
    currentQuantity: 2,
    minimumQuantity: 5,
  },
};
