import {
  AUTOMATION_ACTION,
  AUTOMATION_CONDITION,
  AUTOMATION_TRIGGER,
  type AutomationWorkflow,
} from "../types/automation-types";

export const serviceOrderCompletedWorkflow = {
  id: "service-order-completed-receipt-suggestion",
  name: "Sugerir recebimento após conclusão da Ordem",
  description:
    "Cria somente uma sugestão pendente para revisão, sem movimentar o Financeiro.",
  enabled: true,
  trigger: { type: AUTOMATION_TRIGGER.SERVICE_ORDER_COMPLETED },
  conditions: [{ type: AUTOMATION_CONDITION.ALWAYS, parameters: {} }],
  actions: [
    {
      type: AUTOMATION_ACTION.CREATE_SUGGESTION,
      parameters: {
        title: "Criar sugestão de recebimento",
        description: "Revisar o recebimento da Ordem concluída.",
      },
    },
  ],
} as const satisfies AutomationWorkflow;
