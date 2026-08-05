const statusLabels = {
  OPEN: "Aberta",
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  PENDING: "Pendente",
  SCHEDULED: "Agendada",
  CONFIRMED: "Confirmada",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluída",
  CANCELED: "Cancelada",
  CANCELLED: "Cancelada",
  OVERDUE: "Atrasada",
  DRAFT: "Rascunho",
  PAUSED: "Pausada",
  ARCHIVED: "Arquivada",
  REOPENED: "Reaberta",
  SNOOZED: "Adiada",
  RESOLVED: "Resolvida",
  HIDDEN: "Oculta",
  NOT_APPLICABLE: "Não Aplicável",
  BLOCKED: "Bloqueado",
  PLANNED: "Planejado",
  RESERVED: "Reservado",
  USED: "Utilizado",
  PARTIALLY_USED: "Parcialmente Utilizado",
  RETURNED: "Devolvido",
  CONFIRMED_COST: "Confirmado",
  REVERSED: "Estornado",
} as const;

const roleLabels = {
  OWNER: "Proprietário",
  ADMINISTRATOR: "Administrador",
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  FINANCIAL: "Financeiro",
  SELLER: "Comercial",
  ATTENDANT: "Atendimento",
  TECHNICIAN: "Técnico",
  STOCK: "Estoque",
  VIEWER: "Visualização",
  TECHNICAL_LEAD: "Responsável Técnico",
  ASSISTANT: "Auxiliar",
  ELECTRICIAN: "Eletricista",
  INSTALLER: "Instalador",
  SUPERVISOR: "Supervisor",
  CUSTOMER_SERVICE: "Atendimento",
  OTHER: "Outro",
} as const;

const priorityLabels = {
  CRITICAL: "Crítica",
  URGENT: "Urgente",
  HIGH: "Alta",
  WARNING: "Atenção",
  MEDIUM: "Média",
  NORMAL: "Normal",
  LOW: "Baixa",
  INFO: "Informativa",
  INFORMATIONAL: "Informativa",
} as const;

const eventTypeLabels = {
  CLIENT_CREATED: "Cliente criado",
  LEAD_CREATED: "Oportunidade criada",
  LEAD_UPDATED: "Oportunidade atualizada",
  SERVICE_ORDER_CREATED: "Ordem de Serviço criada",
  SERVICE_ORDER_COMPLETED: "Ordem de Serviço concluída",
  PAYMENT_REGISTERED: "Pagamento registrado",
  PAYMENT_OVERDUE: "Pagamento vencido",
  EQUIPMENT_CREATED: "Equipamento cadastrado",
  WARRANTY_EXPIRED: "Garantia vencida",
  STOCK_BELOW_MINIMUM: "Estoque abaixo do mínimo",
  AGENDA_CREATED: "Compromisso criado",
  AGENDA_COMPLETED: "Compromisso concluído",
  GOAL_CREATED: "Meta criada",
  GOAL_UPDATED: "Meta atualizada",
  GOAL_ACHIEVED: "Meta alcançada",
  PENDING_ITEM_SNOOZED: "Pendência adiada",
  PENDING_ITEM_RESOLVED: "Pendência resolvida",
  PENDING_ITEM_REOPENED: "Pendência reaberta",
  CHECKLIST_UPDATED: "Checklist atualizado",
  MATERIAL_UPDATED: "Material atualizado",
  COST_UPDATED: "Custo atualizado",
  TEAM_UPDATED: "Equipe da Ordem atualizada",
  QUOTE_CREATED: "Orçamento criado",
  QUOTE_UPDATED: "Orçamento atualizado",
  QUOTE_APPROVED: "Orçamento aprovado",
  QUOTE_CONVERTED: "Orçamento convertido em Ordem",
  SERVICE_PRICE_UPDATED: "Preço do serviço atualizado",
  QUOTATION_CREATED: "Cotação criada",
  PURCHASE_ORDER_CREATED: "Pedido de Compra criado",
  PURCHASE_RECEIVED: "Recebimento de compra registrado",
  EQUIPMENT_MEASUREMENT: "Medição do equipamento registrada",
} as const;

const automationModeLabels = {
  REAL: "Execução real",
  SIMULATION: "Simulação",
} as const;

const entityTypeLabels = {
  CLIENT: "Cliente",
  LEAD: "Oportunidade",
  SERVICE_ORDER: "Ordem de Serviço",
  AGENDA: "Agenda",
  STOCK: "Estoque",
  EQUIPMENT: "Equipamento",
  FINANCIAL: "Financeiro",
  AUTOMATION: "Automação",
  DOCUMENT: "Documento",
} as const;

function humanize(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("pt-BR")
    .split("_")
    .filter(Boolean)
    .map((part, index) =>
      index === 0 ? part.charAt(0).toLocaleUpperCase("pt-BR") + part.slice(1) : part,
    )
    .join(" ");
}

function translate(
  catalog: Readonly<Record<string, string>>,
  value?: string | null,
  fallback?: string,
) {
  if (!value) return fallback ?? "Não informado";
  return catalog[value] ?? fallback ?? humanize(value);
}

export const translateStatus = (value?: string | null, fallback?: string) =>
  translate(statusLabels, value, fallback);
export const translateRole = (value?: string | null, fallback?: string) =>
  translate(roleLabels, value, fallback);
export const translatePriority = (value?: string | null, fallback?: string) =>
  translate(priorityLabels, value, fallback);
export const translateEventType = (value?: string | null, fallback?: string) =>
  translate(eventTypeLabels, value, fallback);
export const translateAutomationMode = (value?: string | null, fallback?: string) =>
  translate(automationModeLabels, value, fallback);
export const translateEntityType = (value?: string | null, fallback?: string) =>
  translate(entityTypeLabels, value, fallback);

export const ptBrTranslationCatalog = {
  status: statusLabels,
  role: roleLabels,
  priority: priorityLabels,
  eventType: eventTypeLabels,
  automationMode: automationModeLabels,
  entityType: entityTypeLabels,
} as const;
