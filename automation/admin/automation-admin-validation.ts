import { automationRegistry } from "../registry/automation-registry";
import type { AutomationValidationIssue } from "../types/automation-types";
import { SYSTEM_WORKFLOW_ID } from "./automation-admin-seed";
import {
  AUTOMATION_WORKFLOW_MODE,
  type AutomationWorkflowInput,
  type PersistedAutomationWorkflow,
} from "./automation-admin-types";

function missing(
  parameters: Readonly<Record<string, unknown>>,
  keys: readonly string[],
  base: string,
): AutomationValidationIssue[] {
  return keys.flatMap((key) =>
    parameters[key] === undefined ||
    parameters[key] === null ||
    parameters[key] === ""
      ? [
          {
            path: `${base}.${key}`,
            message: `Informe o parâmetro obrigatório “${key}”.`,
          },
        ]
      : [],
  );
}

export function validateAdministrativeWorkflow(
  input: AutomationWorkflowInput,
  existing: PersistedAutomationWorkflow[],
  currentId?: string,
): AutomationValidationIssue[] {
  const issues: AutomationValidationIssue[] = [];
  if (input.name.trim().length < 3)
    issues.push({ path: "name", message: "Informe um nome para a automação." });
  if (!input.description.trim())
    issues.push({
      path: "description",
      message: "Explique de forma breve o que esta automação fará.",
    });
  if (!input.source.trim())
    issues.push({
      path: "source",
      message: "Informe o módulo ou área de origem da automação.",
    });
  if (!automationRegistry.getTrigger(input.trigger.type))
    issues.push({ path: "trigger", message: "Selecione um gatilho disponível." });
  if (!input.conditions.length)
    issues.push({
      path: "conditions",
      message: "Selecione ao menos uma condição.",
    });
  if (!input.actions.length)
    issues.push({ path: "actions", message: "Selecione ao menos uma ação." });
  input.conditions.forEach((condition, index) => {
    const definition = automationRegistry.getCondition(condition.type);
    if (!definition)
      issues.push({
        path: `conditions.${index}`,
        message: "A condição selecionada não está disponível.",
      });
    else
      issues.push(
        ...missing(
          condition.parameters,
          definition.parameterKeys,
          `conditions.${index}`,
        ),
      );
  });
  input.actions.forEach((action, index) => {
    const definition = automationRegistry.getAction(action.type);
    if (!definition)
      issues.push({
        path: `actions.${index}`,
        message: "A ação selecionada não está disponível.",
      });
    else
      issues.push(
        ...missing(action.parameters, definition.parameterKeys, `actions.${index}`),
      );
  });
  if (input.mode === AUTOMATION_WORKFLOW_MODE.REAL && currentId !== SYSTEM_WORKFLOW_ID)
    issues.push({
      path: "mode",
      message: "Esta automação só pode funcionar em modo de simulação.",
    });
  if (
    existing.some(
      (item) =>
        item.id !== currentId &&
        item.name.trim().toLocaleLowerCase("pt-BR") ===
          input.name.trim().toLocaleLowerCase("pt-BR"),
    )
  )
    issues.push({
      path: "name",
      message: "Já existe uma automação com este nome.",
    });
  if (
    currentId !== SYSTEM_WORKFLOW_ID &&
    input.trigger.type === "SERVICE_ORDER_COMPLETED" &&
    input.actions.some((action) => action.type === "CREATE_SUGGESTION") &&
    existing.some((item) => item.id === SYSTEM_WORKFLOW_ID)
  )
    issues.push({
      path: "trigger",
      message: "A automação obrigatória para Ordens já está cadastrada.",
    });
  return issues;
}
