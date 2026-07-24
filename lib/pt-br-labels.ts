/** Rótulos de apresentação em português do Brasil para valores internos do domínio. */
const LABELS: Record<string, string> = {
  LOW: "Baixa", NORMAL: "Normal", MEDIUM: "Média", HIGH: "Alta", URGENT: "Urgente", CRITICAL: "Crítica",
  OPEN: "Aberta", SCHEDULED: "Agendada", CONFIRMED: "Confirmada", IN_TRANSIT: "Em deslocamento",
  IN_PROGRESS: "Em andamento", WAITING_PART: "Aguardando peça", PENDING: "Pendente", COMPLETED: "Concluída",
  CANCELED: "Cancelada", CANCELLED: "Cancelada", OVERDUE: "Atrasada",
  CLIMATIZATION: "Climatização", ELECTRICAL: "Elétrica", PREVENTIVE: "Manutenção preventiva",
  CORRECTIVE: "Manutenção corretiva", INSTALLATION: "Instalação", TECHNICAL_VISIT: "Visita técnica",
  BUDGET: "Orçamento", MEETING: "Reunião",
  ADMINISTRATOR: "Administrador", MANAGER: "Gerente", ATTENDANT: "Atendente", SELLER: "Comercial",
  TECHNICIAN: "Técnico", ASSISTANT: "Auxiliar", ELECTRICIAN: "Eletricista", SUPERVISOR: "Supervisor",
  FINANCIAL: "Financeiro", OTHER: "Outro",
  ACTIVE: "Ativo", INACTIVE: "Inativo", ATTENTION: "Requer atenção", ARCHIVED: "Arquivado",
  DRAFT: "Rascunho", OUTDATED: "Desatualizado", EXPIRED: "Expirado",
  ORDERED: "Pedido confirmado", PARTIALLY_RECEIVED: "Recebido parcialmente", RECEIVED: "Recebido",
  PARTIALLY_CONSUMED: "Consumido parcialmente", CONSUMED: "Consumido",
  PARTIALLY_RELEASED: "Liberado parcialmente", RELEASED: "Liberado", DIVERGENT: "Com divergência",
  ORDER_CANCELED: "Ordem cancelada", ORDER_ARCHIVED: "Ordem arquivada",
  ORDER_UNAVAILABLE: "Ordem indisponível", ORDER_UPDATED: "Ordem atualizada",
  OVER_RESERVED: "Reserva acima do necessário", OVER_CONSUMED: "Consumo acima da reserva",
  MATCHED: "Valores conciliados", EQUIPMENT_VALUE_INCREASED: "Valor do equipamento aumentou",
  EQUIPMENT_VALUE_DECREASED: "Valor do equipamento diminuiu",
  MAINTENANCE_VALUE_INCREASED: "Valor da manutenção aumentou",
  MAINTENANCE_VALUE_DECREASED: "Valor da manutenção diminuiu",
  FINANCIAL_CANCELED: "Lançamento financeiro cancelado",
  FINANCIAL_ARCHIVED: "Lançamento financeiro arquivado",
  FINANCIAL_UNAVAILABLE: "Financeiro indisponível", MANUALLY_MODIFIED: "Alterado manualmente",
  MANUAL: "Manual", DATASHEET: "Ficha técnica", PROCEDURE: "Procedimento", STANDARD: "Norma",
  DIAGRAM: "Diagrama", CERTIFICATE: "Certificado", WARRANTY: "Garantia", TECHNICAL_REPORT: "Relatório técnico",
  PHOTO: "Foto", VIDEO: "Vídeo", SPREADSHEET: "Planilha", DRAWING: "Desenho",
  CASH: "Dinheiro", CHECKING: "Conta corrente", SAVINGS: "Poupança", DIGITAL_WALLET: "Carteira digital", INVESTMENT: "Investimento", PIX: "Pix", CREDIT_CARD: "Cartão de crédito", DEBIT_CARD: "Cartão de débito",
  BANK_TRANSFER: "Transferência bancária", BOLETO: "Boleto",
  ENTRY: "Entrada", EXIT: "Saída", ADJUSTMENT: "Ajuste", TRANSFER: "Transferência", RETURN: "Devolução", SUPPLIER_RETURN: "Devolução ao fornecedor", CONSUMPTION: "Consumo", RESERVATION: "Reserva", RELEASE: "Liberação",
  MATERIAL: "Material", LABOR: "Mão de obra", EQUIPMENT: "Equipamento", DISPLACEMENT: "Deslocamento", OVERHEAD: "Custos indiretos",
  READY: "Pronto", APPLIED: "Aplicado", NOT_STARTED: "Não iniciado", PAUSED: "Pausado",
  NONE: "Nenhum", WEEKLY: "Semanal", MONTHLY: "Mensal",
  CLIMATIZACAO: "Climatização", AR_CONDICIONADO: "Ar-condicionado", ELETRICA: "Elétrica",
  REFRIGERACAO: "Refrigeração", MANUTENCAO_PREDIAL: "Manutenção predial", SERVICOS_TECNICOS: "Serviços técnicos", OUTRO: "Outro",
  NEAREST_REAL: "Real mais próximo", MULTIPLE_5: "Múltiplo de R$ 5", MULTIPLE_10: "Múltiplo de R$ 10",
  ENDING_0: "Final zero", ENDING_9: "Final nove",
  sky: "Azul-claro", blue: "Azul", violet: "Violeta", emerald: "Verde", amber: "Âmbar",
};

export function ptBrLabel(value?: string | null, fallback?: string): string {
  if (!value) return fallback ?? "Não informado";
  return LABELS[value] ?? fallback ?? humanizeCode(value);
}

export function teamRoleLabel(value?: string | null): string {
  return ptBrLabel(value, value ? humanizeCode(value) : "Sem função definida");
}

export function humanizeCode(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part, index) => index === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part)
    .join(" ");
}
