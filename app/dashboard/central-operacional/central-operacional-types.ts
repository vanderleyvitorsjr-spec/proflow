import type { AgendaDisplayEvent } from "@/app/dashboard/agenda/agenda-types";
import type { OrdemRecord } from "@/app/dashboard/ordens/ordens-types";
import type { OperationalInsight } from "@/lib/operational-insights";
import type { FinancialSuggestion } from "@/automation/suggestions/financial-suggestion-types";

export type OperationalSource =
  | "CLIENTS"
  | "CRM"
  | "ORDERS"
  | "AGENDA"
  | "STOCK"
  | "EQUIPMENT"
  | "FINANCE"
  | "AUTOMATION";

export type OperationalSourceStatus = {
  source: OperationalSource;
  available: boolean;
  partial: boolean;
  recordCount: number;
  error?: string;
};

export type OperationalAlertLevel = "INFO" | "WARNING" | "CRITICAL";

export type OperationalAlert = {
  id: string;
  level: OperationalAlertLevel;
  title: string;
  description: string;
  link: string;
};

export type TechnicianStatus = {
  id: string;
  name: string;
  status: "AVAILABLE" | "BUSY" | "UPCOMING";
  currentEvent?: AgendaDisplayEvent;
  nextEvent?: AgendaDisplayEvent;
};

export type OperationalCenterSnapshot = {
  generatedAt: string;
  sourceStatus: OperationalSourceStatus[];
  orders: {
    today: OrdemRecord[];
    overdue: OrdemRecord[];
    inProgress: OrdemRecord[];
    withoutTechnician: OrdemRecord[];
  };
  agenda: {
    today: AgendaDisplayEvent[];
    upcoming: AgendaDisplayEvent[];
    technicians: TechnicianStatus[];
  };
  stock: {
    lowCount: number;
    outCount: number;
    activeReservations: number;
  };
  equipment: {
    inMaintenanceCount: number;
    overdueMaintenanceCount: number;
    expiringWarrantyCount: number;
  };
  alerts: OperationalAlert[];
  insights: OperationalInsight[];
  financialSuggestions: FinancialSuggestion[];
};
