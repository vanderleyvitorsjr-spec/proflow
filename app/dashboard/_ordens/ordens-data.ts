export type ServiceOrderStatus =
  | "OPEN"
  | "SCHEDULED"
  | "IN_TRANSIT"
  | "IN_PROGRESS"
  | "WAITING_PART"
  | "COMPLETED"
  | "CANCELED"
  | "OVERDUE";

export type ServiceOrderPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "URGENT";

export type ServiceOrderCategory =
  | "CLIMATIZATION"
  | "ELECTRICAL"
  | "PREVENTIVE"
  | "CORRECTIVE"
  | "INSTALLATION";

export type ServiceOrder = {
  id: string;
  orderNumber: string;
  title: string;
  customer: string;
  technician: string;
  category: ServiceOrderCategory;
  status: ServiceOrderStatus;
  priority: ServiceOrderPriority;
  scheduledAt: string;
  address: string;
  city: string;
  state: string;
  estimatedDuration: string;
  amount: number;
  description: string;
  materialsPending: number;
  checklistProgress: number;
};

export const serviceOrders: ServiceOrder[] = [
  {
    id: "os-1",
    orderNumber: "OS-2026-0101",
    title: "Manutenção corretiva em Split",
    customer: "Cliente residencial de exemplo",
    technician: "Técnico responsável",
    category: "CORRECTIVE",
    status: "IN_PROGRESS",
    priority: "HIGH",
    scheduledAt: "2026-07-13T08:00:00",
    address: "Endereço cadastrado",
    city: "Porto Seguro",
    state: "BA",
    estimatedDuration: "2h30",
    amount: 1280,
    description: "Diagnóstico de baixa refrigeração e ruído excessivo.",
    materialsPending: 0,
    checklistProgress: 65,
  },
  {
    id: "os-2",
    orderNumber: "OS-2026-0102",
    title: "Instalação de quadro elétrico",
    customer: "Empresa comercial de exemplo",
    technician: "Equipe técnica",
    category: "ELECTRICAL",
    status: "SCHEDULED",
    priority: "NORMAL",
    scheduledAt: "2026-07-13T10:30:00",
    address: "Endereço cadastrado",
    city: "Santa Cruz Cabrália",
    state: "BA",
    estimatedDuration: "4h00",
    amount: 4850,
    description: "Substituição e reorganização do quadro de distribuição.",
    materialsPending: 0,
    checklistProgress: 0,
  },
  {
    id: "os-3",
    orderNumber: "OS-2026-0103",
    title: "Manutenção preventiva de climatização",
    customer: "Empresa de hospedagem de exemplo",
    technician: "Técnico responsável",
    category: "PREVENTIVE",
    status: "WAITING_PART",
    priority: "HIGH",
    scheduledAt: "2026-07-12T14:00:00",
    address: "Endereço cadastrado",
    city: "Arraial d’Ajuda",
    state: "BA",
    estimatedDuration: "3h00",
    amount: 2640,
    description: "Limpeza, testes elétricos e inspeção de componentes.",
    materialsPending: 2,
    checklistProgress: 45,
  },
  {
    id: "os-4",
    orderNumber: "OS-2026-0104",
    title: "Instalação de aparelhos Split",
    customer: "Condomínio de exemplo",
    technician: "Equipe técnica",
    category: "INSTALLATION",
    status: "IN_TRANSIT",
    priority: "NORMAL",
    scheduledAt: "2026-07-13T13:30:00",
    address: "Endereço cadastrado",
    city: "Porto Seguro",
    state: "BA",
    estimatedDuration: "5h00",
    amount: 7200,
    description: "Instalação de quatro aparelhos com infraestrutura.",
    materialsPending: 0,
    checklistProgress: 10,
  },
  {
    id: "os-5",
    orderNumber: "OS-2026-0105",
    title: "Inspeção elétrica preventiva",
    customer: "Cliente corporativo de exemplo",
    technician: "Técnico responsável",
    category: "ELECTRICAL",
    status: "OVERDUE",
    priority: "URGENT",
    scheduledAt: "2026-07-11T09:00:00",
    address: "Endereço cadastrado",
    city: "Eunápolis",
    state: "BA",
    estimatedDuration: "2h00",
    amount: 1950,
    description: "Inspeção de aquecimento, carga e conexões elétricas.",
    materialsPending: 0,
    checklistProgress: 20,
  },
  {
    id: "os-6",
    orderNumber: "OS-2026-0106",
    title: "Higienização de evaporadoras",
    customer: "Estabelecimento comercial de exemplo",
    technician: "Equipe técnica",
    category: "CLIMATIZATION",
    status: "COMPLETED",
    priority: "LOW",
    scheduledAt: "2026-07-10T15:00:00",
    address: "Endereço cadastrado",
    city: "Trancoso",
    state: "BA",
    estimatedDuration: "2h30",
    amount: 980,
    description: "Higienização completa e teste de funcionamento.",
    materialsPending: 0,
    checklistProgress: 100,
  },
];