import type { AgendaDisplayEvent } from "@/app/dashboard/agenda/agenda-types";
import type { OrdemRecord } from "@/app/dashboard/ordens/ordens-types";

export type OperationalSource =
  | "ORDERS"
  | "AGENDA"
  | "STOCK"
  | "EQUIPMENT";

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
};
