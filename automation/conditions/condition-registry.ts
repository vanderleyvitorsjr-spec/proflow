import {
  AUTOMATION_CONDITION,
  type AutomationConditionType,
  type AutomationDefinition,
} from "../types/automation-types";

export const conditionDefinitions = [
  { type: AUTOMATION_CONDITION.ALWAYS, label: "Sempre", description: "A condição é considerada sem parâmetros adicionais.", parameterKeys: [] },
  { type: AUTOMATION_CONDITION.PREMIUM_CLIENT, label: "Cliente Premium", description: "Representa a futura verificação do segmento Premium.", parameterKeys: [] },
  { type: AUTOMATION_CONDITION.VALUE_ABOVE, label: "Valor acima de", description: "Representa a futura comparação de um valor em centavos.", parameterKeys: ["amountCents"] },
  { type: AUTOMATION_CONDITION.DAYS_WITHOUT_ACTIVITY, label: "Dias sem movimentação", description: "Representa a futura comparação de tempo sem atividade.", parameterKeys: ["days"] },
  { type: AUTOMATION_CONDITION.CATEGORY, label: "Categoria", description: "Representa a futura comparação por categoria.", parameterKeys: ["category"] },
  { type: AUTOMATION_CONDITION.SERVICE_TYPE, label: "Tipo de serviço", description: "Representa a futura comparação pelo tipo do serviço.", parameterKeys: ["serviceType"] },
  { type: AUTOMATION_CONDITION.RESPONSIBLE, label: "Responsável", description: "Representa a futura comparação pelo identificador do responsável.", parameterKeys: ["responsibleId"] },
  { type: AUTOMATION_CONDITION.STATUS, label: "Status", description: "Representa a futura comparação pelo estado do registro.", parameterKeys: ["status"] },
] as const satisfies ReadonlyArray<AutomationDefinition<AutomationConditionType>>;

export const conditionRegistry = new Map(
  conditionDefinitions.map((definition) => [definition.type, definition]),
) as ReadonlyMap<
  AutomationConditionType,
  AutomationDefinition<AutomationConditionType>
>;
