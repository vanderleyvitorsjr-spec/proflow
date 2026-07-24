import {
  AUTOMATION_TRIGGER,
  type AutomationDefinition,
  type AutomationTriggerType,
} from "../types/automation-types";

const definitions = [
  [AUTOMATION_TRIGGER.CLIENT_CREATED, "Cliente criado", "Recebido quando um cliente é cadastrado.", ["clientId", "name"]],
  [AUTOMATION_TRIGGER.LEAD_CREATED, "Lead criado", "Recebido quando uma oportunidade é cadastrada.", ["leadId", "status", "createdAt"]],
  [AUTOMATION_TRIGGER.LEAD_UPDATED, "Lead atualizado", "Recebido quando uma oportunidade é modificada.", ["leadId", "status", "updatedAt"]],
  [AUTOMATION_TRIGGER.SERVICE_ORDER_CREATED, "Ordem criada", "Recebido quando uma Ordem de Serviço é criada.", ["serviceOrderId", "clientId", "createdAt"]],
  [AUTOMATION_TRIGGER.SERVICE_ORDER_COMPLETED, "Ordem concluída", "Recebido quando uma Ordem de Serviço é concluída.", ["serviceOrderId", "clientId", "orderNumber", "clientName", "totalAmountCents", "completedAt"]],
  [AUTOMATION_TRIGGER.PAYMENT_REGISTERED, "Pagamento registrado", "Recebido quando um pagamento é confirmado.", ["financialEntryId", "amountCents", "paidAt"]],
  [AUTOMATION_TRIGGER.PAYMENT_OVERDUE, "Pagamento vencido", "Recebido quando uma obrigação financeira vence.", ["financialEntryId", "amountCents", "dueDate"]],
  [AUTOMATION_TRIGGER.EQUIPMENT_CREATED, "Equipamento cadastrado", "Recebido quando um equipamento é cadastrado.", ["equipmentId", "createdAt"]],
  [AUTOMATION_TRIGGER.WARRANTY_EXPIRED, "Garantia vencida", "Recebido quando uma garantia alcança seu vencimento.", ["equipmentId", "warrantyEndDate"]],
  [AUTOMATION_TRIGGER.STOCK_BELOW_MINIMUM, "Estoque abaixo do mínimo", "Recebido quando o saldo disponível fica abaixo do mínimo.", ["stockItemId", "currentQuantity", "minimumQuantity"]],
  [AUTOMATION_TRIGGER.AGENDA_CREATED, "Agenda criada", "Recebido quando um compromisso é criado.", ["eventId", "startAt"]],
  [AUTOMATION_TRIGGER.AGENDA_COMPLETED, "Agenda concluída", "Recebido quando um compromisso é concluído.", ["eventId", "completedAt"]],
] as const satisfies ReadonlyArray<
  readonly [AutomationTriggerType, string, string, readonly string[]]
>;

export const triggerDefinitions = definitions.map(
  ([type, label, description, parameterKeys]) =>
    ({
      type,
      label,
      description,
      parameterKeys,
    }) satisfies AutomationDefinition<AutomationTriggerType>,
);

export const triggerRegistry = new Map(
  triggerDefinitions.map((definition) => [definition.type, definition]),
) as ReadonlyMap<
  AutomationTriggerType,
  AutomationDefinition<AutomationTriggerType>
>;
