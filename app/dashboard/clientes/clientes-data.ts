export type ClientType = "RESIDENTIAL" | "COMPANY" | "CONDOMINIUM";

export type ClientStatus =
  | "ACTIVE"
  | "RECURRING"
  | "ATTENTION"
  | "INACTIVE";

export type ClientSegment =
  | "CLIMATIZATION"
  | "ELECTRICAL"
  | "BOTH";

export type ClientRecord = {
  id: string;
  name: string;
  document?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  zipCode?: string;
  city: string;
  state: string;
  type: ClientType;
  segment: ClientSegment;
  status: ClientStatus;
  activeServiceOrders: number;
  installedEquipment: number;
  contracts: number;
  lifetimeValue: number;
  pendingAmount: number;
  lastInteractionAt?: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  notes?: string;
};

export const clients: ClientRecord[] = [
  {
    id: "client-1",
    name: "Cliente Residencial Exemplo",
    phone: "73988887777",
    email: "cliente.residencial@exemplo.com",
    city: "Porto Seguro",
    state: "BA",
    type: "RESIDENTIAL",
    segment: "CLIMATIZATION",
    status: "ACTIVE",
    activeServiceOrders: 1,
    installedEquipment: 3,
    contracts: 0,
    lifetimeValue: 4850,
    pendingAmount: 0,
    lastInteractionAt: "2026-07-12T14:30:00",
    createdAt: "2026-03-18T10:00:00",
  },
  {
    id: "client-2",
    name: "Empresa Comercial Exemplo",
    document: "12345678000190",
    phone: "7332884455",
    email: "contato@empresaexemplo.com",
    city: "Porto Seguro",
    state: "BA",
    type: "COMPANY",
    segment: "BOTH",
    status: "RECURRING",
    activeServiceOrders: 4,
    installedEquipment: 18,
    contracts: 2,
    lifetimeValue: 62800,
    pendingAmount: 3250,
    lastInteractionAt: "2026-07-13T08:15:00",
    createdAt: "2025-09-10T09:00:00",
  },
  {
    id: "client-3",
    name: "Condomínio Residencial Exemplo",
    document: "98765432000110",
    phone: "7330123456",
    email: "administracao@condominioexemplo.com",
    city: "Santa Cruz Cabrália",
    state: "BA",
    type: "CONDOMINIUM",
    segment: "ELECTRICAL",
    status: "ATTENTION",
    activeServiceOrders: 2,
    installedEquipment: 9,
    contracts: 1,
    lifetimeValue: 28400,
    pendingAmount: 2180,
    lastInteractionAt: "2026-07-08T16:40:00",
    createdAt: "2026-01-22T11:30:00",
  },
  {
    id: "client-4",
    name: "Cliente Corporativo Exemplo",
    document: "11223344000155",
    phone: "71999998888",
    email: "manutencao@clienteexemplo.com",
    city: "Eunápolis",
    state: "BA",
    type: "COMPANY",
    segment: "CLIMATIZATION",
    status: "RECURRING",
    activeServiceOrders: 3,
    installedEquipment: 27,
    contracts: 3,
    lifetimeValue: 98450,
    pendingAmount: 0,
    lastInteractionAt: "2026-07-11T09:20:00",
    createdAt: "2025-06-04T08:00:00",
  },
  {
    id: "client-5",
    name: "Cliente de Instalação Exemplo",
    phone: "73991234567",
    email: "cliente.instalacao@exemplo.com",
    city: "Arraial d’Ajuda",
    state: "BA",
    type: "RESIDENTIAL",
    segment: "BOTH",
    status: "ACTIVE",
    activeServiceOrders: 0,
    installedEquipment: 2,
    contracts: 0,
    lifetimeValue: 7350,
    pendingAmount: 0,
    lastInteractionAt: "2026-07-05T13:10:00",
    createdAt: "2026-04-16T15:00:00",
  },
  {
    id: "client-6",
    name: "Estabelecimento Comercial Exemplo",
    document: "55667788000122",
    phone: "7332889900",
    email: "financeiro@estabelecimentoexemplo.com",
    city: "Trancoso",
    state: "BA",
    type: "COMPANY",
    segment: "CLIMATIZATION",
    status: "INACTIVE",
    activeServiceOrders: 0,
    installedEquipment: 6,
    contracts: 0,
    lifetimeValue: 12600,
    pendingAmount: 0,
    lastInteractionAt: "2026-03-14T10:45:00",
    createdAt: "2025-11-08T09:30:00",
  },
];
