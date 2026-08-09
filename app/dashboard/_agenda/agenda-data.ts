export type AgendaView = "day" | "week" | "month";

export type AgendaEventType =
  | "INSTALLATION"
  | "PREVENTIVE"
  | "CORRECTIVE"
  | "ELECTRICAL"
  | "TECHNICAL_VISIT"
  | "BUDGET"
  | "MEETING";

export type AgendaEventStatus =
  | "CONFIRMED"
  | "IN_TRANSIT"
  | "IN_PROGRESS"
  | "PENDING"
  | "COMPLETED"
  | "CANCELED";

export type AgendaEventPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type AgendaEvent = {
  id: string;
  title: string;
  customer: string;
  serviceOrderNumber?: string;
  type: AgendaEventType;
  status: AgendaEventStatus;
  priority: AgendaEventPriority;
  startAt: string;
  endAt: string;
  technician: string;
  address: string;
  city: string;
  state: string;
  description?: string;
  origin?: "INDEPENDENT" | "SERVICE_ORDER";
  orderId?: string;
  clientId?: string;
  notes?: string;
};

export type AgendaTeam = {
  id: string;
  name: string;
  specialty: string;
  status: "AVAILABLE" | "BUSY" | "OFFLINE";
  nextAvailability?: string;
};

export const agendaEvents: AgendaEvent[] = [
  {
    id: "event-1",
    title: "Instalação de aparelhos Split",
    customer: "Cliente residencial de exemplo",
    serviceOrderNumber: "OS-2026-0102",
    type: "INSTALLATION",
    status: "CONFIRMED",
    priority: "NORMAL",
    startAt: "2026-07-13T08:00:00",
    endAt: "2026-07-13T11:00:00",
    technician: "Equipe técnica",
    address: "Endereço cadastrado",
    city: "Porto Seguro",
    state: "BA",
    description: "Instalação de três aparelhos com infraestrutura completa.",
  },
  {
    id: "event-2",
    title: "Manutenção preventiva",
    customer: "Empresa comercial de exemplo",
    serviceOrderNumber: "OS-2026-0103",
    type: "PREVENTIVE",
    status: "IN_PROGRESS",
    priority: "HIGH",
    startAt: "2026-07-13T09:30:00",
    endAt: "2026-07-13T12:30:00",
    technician: "Técnico responsável",
    address: "Endereço cadastrado",
    city: "Porto Seguro",
    state: "BA",
    description: "Higienização, medições elétricas e inspeção técnica.",
  },
  {
    id: "event-3",
    title: "Inspeção de quadro elétrico",
    customer: "Condomínio de exemplo",
    serviceOrderNumber: "OS-2026-0104",
    type: "ELECTRICAL",
    status: "IN_TRANSIT",
    priority: "URGENT",
    startAt: "2026-07-13T13:30:00",
    endAt: "2026-07-13T15:30:00",
    technician: "Equipe elétrica",
    address: "Endereço cadastrado",
    city: "Santa Cruz Cabrália",
    state: "BA",
  },
  {
    id: "event-4",
    title: "Visita técnica para orçamento",
    customer: "Cliente corporativo de exemplo",
    type: "TECHNICAL_VISIT",
    status: "PENDING",
    priority: "NORMAL",
    startAt: "2026-07-13T16:00:00",
    endAt: "2026-07-13T17:00:00",
    technician: "Consultor responsável",
    address: "Endereço cadastrado",
    city: "Porto Seguro",
    state: "BA",
  },
  {
    id: "event-5",
    title: "Manutenção corretiva",
    customer: "Estabelecimento comercial de exemplo",
    serviceOrderNumber: "OS-2026-0105",
    type: "CORRECTIVE",
    status: "CONFIRMED",
    priority: "HIGH",
    startAt: "2026-07-14T08:30:00",
    endAt: "2026-07-14T10:30:00",
    technician: "Técnico responsável",
    address: "Endereço cadastrado",
    city: "Arraial d’Ajuda",
    state: "BA",
  },
  {
    id: "event-6",
    title: "Apresentação de orçamento",
    customer: "Empresa de serviços de exemplo",
    type: "BUDGET",
    status: "CONFIRMED",
    priority: "NORMAL",
    startAt: "2026-07-15T14:00:00",
    endAt: "2026-07-15T15:00:00",
    technician: "Consultor responsável",
    address: "Atendimento remoto",
    city: "Porto Seguro",
    state: "BA",
  },
  {
    id: "event-7",
    title: "Reunião de planejamento",
    customer: "Equipe interna",
    type: "MEETING",
    status: "CONFIRMED",
    priority: "LOW",
    startAt: "2026-07-16T08:00:00",
    endAt: "2026-07-16T09:00:00",
    technician: "Equipe operacional",
    address: "Sede da empresa",
    city: "Porto Seguro",
    state: "BA",
  },
  {
    id: "event-8",
    title: "Instalação elétrica",
    customer: "Cliente empresarial de exemplo",
    serviceOrderNumber: "OS-2026-0106",
    type: "ELECTRICAL",
    status: "PENDING",
    priority: "HIGH",
    startAt: "2026-07-17T10:00:00",
    endAt: "2026-07-17T14:00:00",
    technician: "Equipe elétrica",
    address: "Endereço cadastrado",
    city: "Eunápolis",
    state: "BA",
  },
];

export const agendaTeams: AgendaTeam[] = [
  {
    id: "team-1",
    name: "Equipe de climatização",
    specialty: "Instalação e manutenção",
    status: "BUSY",
    nextAvailability: "2026-07-13T12:30:00",
  },
  {
    id: "team-2",
    name: "Equipe elétrica",
    specialty: "Instalações e diagnósticos",
    status: "BUSY",
    nextAvailability: "2026-07-13T15:30:00",
  },
  {
    id: "team-3",
    name: "Técnico de suporte",
    specialty: "Manutenção corretiva",
    status: "AVAILABLE",
  },
  {
    id: "team-4",
    name: "Consultor técnico",
    specialty: "Visitas e orçamentos",
    status: "AVAILABLE",
  },
];
