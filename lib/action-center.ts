import type {
  OperationalInsight,
  OperationalInsightModule,
  OperationalInsightPriority,
} from "@/lib/operational-insights";

export type ActionCenterAction = {
  label: string;
  href: string;
};

export type ActionCenterTask = {
  id: string;
  type: string;
  typeLabel: string;
  title: string;
  description: string;
  priority: OperationalInsightPriority;
  module: OperationalInsightModule;
  detectedAt: string;
  primaryAction: ActionCenterAction;
  secondaryAction?: ActionCenterAction;
};

const moduleRoutes: Record<OperationalInsightModule, ActionCenterAction> = {
  CLIENTS: { label: "Abrir Clientes", href: "/dashboard/clientes" },
  CRM: { label: "Abrir CRM", href: "/dashboard/crm" },
  AGENDA: { label: "Abrir Agenda", href: "/dashboard/agenda" },
  ORDERS: { label: "Abrir Ordens", href: "/dashboard/ordens" },
  STOCK: { label: "Visualizar Estoque", href: "/dashboard/estoque" },
  EQUIPMENT: { label: "Abrir Equipamentos", href: "/dashboard/equipamentos" },
  FINANCE: { label: "Abrir Financeiro", href: "/dashboard/financeiro" },
};

const primaryLabels: Partial<Record<string, string>> = {
  MISSING_PHONE: "Revisar cadastro",
  MISSING_EMAIL: "Revisar cadastro",
  MISSING_ADDRESS: "Completar endereço",
  DUPLICATE: "Revisar duplicidade",
  NO_SERVICE: "Abrir cliente",
  MISSING_OWNER: "Definir responsável",
  NO_RECENT_ACTIVITY: "Retomar contato",
  FORGOTTEN: "Retomar contato",
  OLD_OPPORTUNITY: "Abrir oportunidade",
  OVERDUE_APPOINTMENT: "Reagendar compromisso",
  SCHEDULE_CONFLICT: "Revisar horários",
  OPEN_TOO_LONG: "Revisar Ordem",
  MISSING_TECHNICIAN: "Definir técnico",
  MISSING_SCHEDULE: "Programar atendimento",
  MISSING_RECEIPT: "Registrar recebimento",
  LOW_STOCK: "Revisar reposição",
  NEVER_USED: "Revisar item",
  MISSING_SUPPLIER: "Definir fornecedor",
  MISSING_LOCATION: "Definir localização",
  EXPIRED_WARRANTY: "Abrir equipamento",
  OVERDUE_PREVENTIVE: "Registrar manutenção",
  MISSING_CLIENT: "Vincular cliente",
  OVERDUE_ACCOUNT: "Registrar pagamento",
  LATE_RECEIPT: "Registrar recebimento",
  MISSING_CATEGORY: "Definir categoria",
  FINANCIAL_SUGGESTION: "Revisar sugestão",
};

export function transformInsightsToActions(
  insights: OperationalInsight[],
): ActionCenterTask[] {
  const rank = { CRITICAL: 0, WARNING: 1, INFO: 2 } as const;

  return insights
    .map((insight) => {
      const moduleAction = moduleRoutes[insight.module];
      const primaryAction = {
        label: primaryLabels[insight.type] ?? insight.action.label,
        href: insight.action.href,
      };

      return {
        id: `action-${insight.id}`,
        type: insight.type,
        typeLabel: insight.title,
        title: insight.title,
        description: insight.description,
        priority: insight.priority,
        module: insight.module,
        detectedAt: insight.detectedAt,
        primaryAction,
        secondaryAction:
          moduleAction.href === primaryAction.href ? undefined : moduleAction,
      } satisfies ActionCenterTask;
    })
    .sort(
      (a, b) =>
        rank[a.priority] - rank[b.priority] ||
        b.detectedAt.localeCompare(a.detectedAt) ||
        a.title.localeCompare(b.title, "pt-BR"),
    );
}
