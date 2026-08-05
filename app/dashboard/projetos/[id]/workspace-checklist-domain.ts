export type ChecklistTemplateCategory =
  | "PRE_SERVICE"
  | "ARRIVAL"
  | "DIAGNOSIS"
  | "INSTALLATION"
  | "ELECTRICAL"
  | "TESTS"
  | "FINALIZATION"
  | "DOCUMENTATION"
  | "FINANCIAL"
  | "POST_SERVICE";

const templates: Record<string, string[]> = {
  INSTALLATION: [
    "Confirmar Voltagem",
    "Conferir Material",
    "Verificar Local de Instalação",
    "Realizar Teste de Funcionamento",
    "Registrar Fotos",
    "Orientar Cliente",
    "Confirmar Finalização",
  ],
  PREVENTIVE: [
    "Conferir Equipamento",
    "Registrar Diagnóstico",
    "Identificar Peças",
    "Executar Serviço",
    "Realizar Teste",
    "Registrar Recomendação",
    "Finalizar Atendimento",
  ],
  CORRECTIVE: [
    "Conferir Equipamento",
    "Registrar Diagnóstico",
    "Identificar Peças",
    "Executar Serviço",
    "Realizar Teste",
    "Registrar Recomendação",
    "Finalizar Atendimento",
  ],
  ELECTRICAL: [
    "Desligar Alimentação",
    "Verificar Tensão",
    "Inspecionar Circuito",
    "Executar Correção",
    "Testar Segurança",
    "Registrar Resultado",
  ],
};

export function checklistTemplateFor(serviceType: string) {
  return templates[serviceType] ?? [];
}

export function checklistSummary(
  items: Array<{ status: string; required: boolean; title: string; responsible?: string }>,
) {
  const completed = items.filter((item) => ["COMPLETED", "SKIPPED"].includes(item.status));
  const blocked = items.filter((item) => item.status === "BLOCKED");
  const pending = items.filter((item) => !["COMPLETED", "SKIPPED"].includes(item.status));
  return {
    completed: completed.length,
    pending: pending.length,
    blocked: blocked.length,
    percentage: items.length ? Math.round((completed.length / items.length) * 100) : 0,
    nextTask: pending[0]?.title,
    responsible: pending[0]?.responsible,
    requiredPending: pending.filter((item) => item.required).map((item) => item.title),
  };
}
