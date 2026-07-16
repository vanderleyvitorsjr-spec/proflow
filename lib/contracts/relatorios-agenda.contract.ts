export type ReportAgendaEvent = {
  id: string;
  origin: "INDEPENDENT" | "SERVICE_ORDER";
  orderId?: string;
  createdAt?: string;
  startAt: string;
  endAt: string;
  status: string;
  type: string;
  technician: string;
  city: string;
  state: string;
};
