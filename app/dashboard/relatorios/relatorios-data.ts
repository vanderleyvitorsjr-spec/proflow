export type ReportPeriod =
  | "CURRENT_MONTH"
  | "LAST_MONTH"
  | "LAST_3_MONTHS"
  | "LAST_6_MONTHS"
  | "CURRENT_YEAR";

export type ReportArea =
  | "ALL"
  | "FINANCIAL"
  | "COMMERCIAL"
  | "OPERATIONAL"
  | "STOCK";

export type ReportMetric = {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  format: "currency" | "number" | "percentage" | "hours";
  area: Exclude<ReportArea, "ALL">;
};

export type MonthlyReportData = {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  serviceOrders: number;
  proposals: number;
  approvals: number;
};

export type RankingRecord = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  revenue: number;
  percentage: number;
};

export type TechnicianPerformance = {
  id: string;
  name: string;
  specialty: string;
  completedOrders: number;
  averageTimeHours: number;
  revenue: number;
  satisfaction: number;
  productivity: number;
};

export type CityPerformance = {
  id: string;
  city: string;
  state: string;
  serviceOrders: number;
  customers: number;
  revenue: number;
  averageTicket: number;
};

export const reportMetrics: ReportMetric[] = [
  {
    id: "metric-revenue",
    label: "Receita bruta",
    value: 58700,
    previousValue: 52400,
    format: "currency",
    area: "FINANCIAL",
  },
  {
    id: "metric-expenses",
    label: "Despesas operacionais",
    value: 29400,
    previousValue: 27850,
    format: "currency",
    area: "FINANCIAL",
  },
  {
    id: "metric-profit",
    label: "Resultado líquido",
    value: 29300,
    previousValue: 24550,
    format: "currency",
    area: "FINANCIAL",
  },
  {
    id: "metric-margin",
    label: "Margem líquida",
    value: 49.91,
    previousValue: 46.85,
    format: "percentage",
    area: "FINANCIAL",
  },
  {
    id: "metric-leads",
    label: "Novos leads",
    value: 48,
    previousValue: 41,
    format: "number",
    area: "COMMERCIAL",
  },
  {
    id: "metric-conversion",
    label: "Taxa de conversão",
    value: 37.5,
    previousValue: 32.8,
    format: "percentage",
    area: "COMMERCIAL",
  },
  {
    id: "metric-ticket",
    label: "Ticket médio",
    value: 3250,
    previousValue: 2980,
    format: "currency",
    area: "COMMERCIAL",
  },
  {
    id: "metric-orders",
    label: "Ordens concluídas",
    value: 86,
    previousValue: 74,
    format: "number",
    area: "OPERATIONAL",
  },
  {
    id: "metric-time",
    label: "Tempo médio por OS",
    value: 3.45,
    previousValue: 3.92,
    format: "hours",
    area: "OPERATIONAL",
  },
  {
    id: "metric-rework",
    label: "Taxa de retrabalho",
    value: 2.8,
    previousValue: 4.1,
    format: "percentage",
    area: "OPERATIONAL",
  },
  {
    id: "metric-stock",
    label: "Valor em estoque",
    value: 38450,
    previousValue: 36100,
    format: "currency",
    area: "STOCK",
  },
  {
    id: "metric-turnover",
    label: "Giro de estoque",
    value: 4.25,
    previousValue: 3.8,
    format: "number",
    area: "STOCK",
  },
];

export const monthlyReportData: MonthlyReportData[] = [
  {
    month: "Fev",
    revenue: 38400,
    expenses: 22100,
    profit: 16300,
    serviceOrders: 58,
    proposals: 31,
    approvals: 12,
  },
  {
    month: "Mar",
    revenue: 45200,
    expenses: 24800,
    profit: 20400,
    serviceOrders: 64,
    proposals: 35,
    approvals: 14,
  },
  {
    month: "Abr",
    revenue: 41800,
    expenses: 26300,
    profit: 15500,
    serviceOrders: 61,
    proposals: 34,
    approvals: 13,
  },
  {
    month: "Mai",
    revenue: 53600,
    expenses: 28900,
    profit: 24700,
    serviceOrders: 77,
    proposals: 42,
    approvals: 17,
  },
  {
    month: "Jun",
    revenue: 62400,
    expenses: 31700,
    profit: 30700,
    serviceOrders: 91,
    proposals: 49,
    approvals: 21,
  },
  {
    month: "Jul",
    revenue: 58700,
    expenses: 29400,
    profit: 29300,
    serviceOrders: 86,
    proposals: 48,
    approvals: 18,
  },
];

export const serviceRanking: RankingRecord[] = [
  {
    id: "service-1",
    name: "Manutenção preventiva",
    description: "Climatização",
    quantity: 37,
    revenue: 28860,
    percentage: 100,
  },
  {
    id: "service-2",
    name: "Instalação de Split",
    description: "Instalação",
    quantity: 18,
    revenue: 42300,
    percentage: 78,
  },
  {
    id: "service-3",
    name: "Manutenção corretiva",
    description: "Elétrica e climatização",
    quantity: 24,
    revenue: 36960,
    percentage: 65,
  },
  {
    id: "service-4",
    name: "Inspeção elétrica",
    description: "Elétrica",
    quantity: 11,
    revenue: 9790,
    percentage: 42,
  },
  {
    id: "service-5",
    name: "Carga de fluido",
    description: "Climatização",
    quantity: 5,
    revenue: 7250,
    percentage: 28,
  },
];

export const customerRanking: RankingRecord[] = [
  {
    id: "customer-1",
    name: "Cliente corporativo de exemplo",
    description: "Contrato recorrente",
    quantity: 14,
    revenue: 42800,
    percentage: 100,
  },
  {
    id: "customer-2",
    name: "Empresa comercial de exemplo",
    description: "Serviços elétricos",
    quantity: 9,
    revenue: 28450,
    percentage: 67,
  },
  {
    id: "customer-3",
    name: "Condomínio de exemplo",
    description: "Manutenções preventivas",
    quantity: 8,
    revenue: 22100,
    percentage: 52,
  },
  {
    id: "customer-4",
    name: "Empresa de hospedagem de exemplo",
    description: "Climatização",
    quantity: 7,
    revenue: 18600,
    percentage: 43,
  },
];

export const technicianPerformance: TechnicianPerformance[] = [
  {
    id: "technician-1",
    name: "Equipe de climatização",
    specialty: "Instalação e manutenção",
    completedOrders: 34,
    averageTimeHours: 3.2,
    revenue: 28400,
    satisfaction: 96.5,
    productivity: 92,
  },
  {
    id: "technician-2",
    name: "Equipe elétrica",
    specialty: "Instalações e diagnósticos",
    completedOrders: 27,
    averageTimeHours: 3.8,
    revenue: 23800,
    satisfaction: 94.2,
    productivity: 85,
  },
  {
    id: "technician-3",
    name: "Técnico de suporte",
    specialty: "Manutenção corretiva",
    completedOrders: 18,
    averageTimeHours: 2.9,
    revenue: 15600,
    satisfaction: 97.1,
    productivity: 78,
  },
  {
    id: "technician-4",
    name: "Consultor técnico",
    specialty: "Visitas e orçamentos",
    completedOrders: 12,
    averageTimeHours: 1.4,
    revenue: 9400,
    satisfaction: 95.8,
    productivity: 69,
  },
];

export const cityPerformance: CityPerformance[] = [
  {
    id: "city-1",
    city: "Porto Seguro",
    state: "BA",
    serviceOrders: 58,
    customers: 34,
    revenue: 38900,
    averageTicket: 3241.67,
  },
  {
    id: "city-2",
    city: "Santa Cruz Cabrália",
    state: "BA",
    serviceOrders: 17,
    customers: 11,
    revenue: 12800,
    averageTicket: 2560,
  },
  {
    id: "city-3",
    city: "Arraial d’Ajuda",
    state: "BA",
    serviceOrders: 14,
    customers: 9,
    revenue: 11200,
    averageTicket: 2800,
  },
  {
    id: "city-4",
    city: "Trancoso",
    state: "BA",
    serviceOrders: 8,
    customers: 6,
    revenue: 9400,
    averageTicket: 3133.33,
  },
  {
    id: "city-5",
    city: "Eunápolis",
    state: "BA",
    serviceOrders: 6,
    customers: 4,
    revenue: 6800,
    averageTicket: 2266.67,
  },
];
