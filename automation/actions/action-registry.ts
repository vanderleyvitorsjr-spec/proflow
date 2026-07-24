import {
  AUTOMATION_ACTION,
  type AutomationActionType,
  type AutomationDefinition,
} from "../types/automation-types";

export const actionDefinitions = [
  { type: AUTOMATION_ACTION.CREATE_TASK, label: "Criar tarefa", description: "Descreve uma futura tarefa operacional.", parameterKeys: ["title"] },
  { type: AUTOMATION_ACTION.CREATE_APPOINTMENT, label: "Criar compromisso", description: "Descreve um futuro compromisso de Agenda.", parameterKeys: ["title"] },
  { type: AUTOMATION_ACTION.CREATE_FINANCIAL_ENTRY, label: "Criar lançamento financeiro", description: "Descreve um futuro lançamento financeiro.", parameterKeys: ["title"] },
  { type: AUTOMATION_ACTION.UPDATE_STATUS, label: "Atualizar status", description: "Descreve uma futura alteração de status.", parameterKeys: ["status"] },
  { type: AUTOMATION_ACTION.SEND_INTERNAL_NOTIFICATION, label: "Enviar notificação interna", description: "Descreve uma futura notificação dentro do ProFlow.", parameterKeys: ["title", "message"] },
  { type: AUTOMATION_ACTION.CREATE_SUGGESTION, label: "Criar sugestão", description: "Descreve uma futura sugestão operacional.", parameterKeys: ["title", "description"] },
  { type: AUTOMATION_ACTION.ADD_INSIGHT, label: "Adicionar insight", description: "Descreve um futuro insight operacional.", parameterKeys: ["title", "description", "priority"] },
  { type: AUTOMATION_ACTION.REGISTER_LOG, label: "Registrar log", description: "Descreve um futuro registro de auditoria.", parameterKeys: ["message"] },
] as const satisfies ReadonlyArray<AutomationDefinition<AutomationActionType>>;

export const actionRegistry = new Map(
  actionDefinitions.map((definition) => [definition.type, definition]),
) as ReadonlyMap<
  AutomationActionType,
  AutomationDefinition<AutomationActionType>
>;
