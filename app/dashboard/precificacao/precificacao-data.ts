export type PricingView = "calculator" | "services";

export type PricingListView = "list" | "cards";

export type PricingCategory =
  | "CLIMATIZATION"
  | "ELECTRICAL"
  | "INSTALLATION"
  | "PREVENTIVE"
  | "CORRECTIVE"
  | "INSPECTION"
  | "OTHER";

export type PricingStatus = "DRAFT" | "ACTIVE" | "REVIEW" | "INACTIVE";

export type PricingMarginLevel = "LOW" | "HEALTHY" | "HIGH";

export type PricingService = {
  id: string;
  name: string;
  code: string;
  description: string;
  category: PricingCategory;
  status: PricingStatus;
  averageDurationHours: number;
  techniciansRequired: number;
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  displacementCost: number;
  thirdPartyCost: number;
  taxRate: number;
  commissionRate: number;
  marginRate: number;
  minimumPrice: number;
  suggestedPrice: number;
  premiumPrice: number;
  timesSold: number;
  updatedAt: string;
};

export type PricingCalculationInput = {
  materialCost: number;
  laborHours: number;
  laborHourlyCost: number;
  technicians: number;
  equipmentCost: number;
  distanceKm: number;
  costPerKm: number;
  tollCost: number;
  accommodationCost: number;
  foodCost: number;
  thirdPartyCost: number;
  taxRate: number;
  commissionRate: number;
  marginRate: number;
  discountRate: number;
};

export const pricingCategoryLabels: Record<PricingCategory, string> = {
  CLIMATIZATION: "Climatização",
  ELECTRICAL: "Elétrica",
  INSTALLATION: "Instalação",
  PREVENTIVE: "Manutenção preventiva",
  CORRECTIVE: "Manutenção corretiva",
  INSPECTION: "Inspeção",
  OTHER: "Outros",
};

export const pricingStatusLabels: Record<PricingStatus, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativo",
  REVIEW: "Em revisão",
  INACTIVE: "Inativo",
};

export const pricingServices: PricingService[] = [
  {
    id: "pricing-1",
    name: "Instalação de ar-condicionado Split",
    code: "CLI-INS-001",
    description: "Instalação padrão de equipamento Split com infraestrutura básica.",
    category: "INSTALLATION",
    status: "ACTIVE",
    averageDurationHours: 4,
    techniciansRequired: 2,
    materialCost: 680,
    laborCost: 520,
    equipmentCost: 120,
    displacementCost: 90,
    thirdPartyCost: 0,
    taxRate: 6,
    commissionRate: 3,
    marginRate: 35,
    minimumPrice: 1980,
    suggestedPrice: 2350,
    premiumPrice: 2780,
    timesSold: 18,
    updatedAt: "2026-07-10T10:00:00",
  },
  {
    id: "pricing-2",
    name: "Manutenção preventiva de Split",
    code: "CLI-PRE-001",
    description: "Limpeza, higienização, medições e inspeção geral do equipamento.",
    category: "PREVENTIVE",
    status: "ACTIVE",
    averageDurationHours: 2,
    techniciansRequired: 1,
    materialCost: 95,
    laborCost: 230,
    equipmentCost: 40,
    displacementCost: 70,
    thirdPartyCost: 0,
    taxRate: 6,
    commissionRate: 2,
    marginRate: 42,
    minimumPrice: 640,
    suggestedPrice: 780,
    premiumPrice: 950,
    timesSold: 37,
    updatedAt: "2026-07-11T14:30:00",
  },
  {
    id: "pricing-3",
    name: "Manutenção corretiva elétrica",
    code: "ELE-COR-001",
    description: "Diagnóstico, correção de falha e testes de segurança elétrica.",
    category: "CORRECTIVE",
    status: "ACTIVE",
    averageDurationHours: 3,
    techniciansRequired: 1,
    materialCost: 340,
    laborCost: 420,
    equipmentCost: 65,
    displacementCost: 85,
    thirdPartyCost: 0,
    taxRate: 6,
    commissionRate: 3,
    marginRate: 38,
    minimumPrice: 1280,
    suggestedPrice: 1540,
    premiumPrice: 1890,
    timesSold: 24,
    updatedAt: "2026-07-09T09:15:00",
  },
  {
    id: "pricing-4",
    name: "Inspeção de quadro elétrico",
    code: "ELE-INS-002",
    description: "Inspeção técnica, medições, registro fotográfico e relatório.",
    category: "INSPECTION",
    status: "REVIEW",
    averageDurationHours: 2.5,
    techniciansRequired: 1,
    materialCost: 45,
    laborCost: 310,
    equipmentCost: 80,
    displacementCost: 95,
    thirdPartyCost: 0,
    taxRate: 6,
    commissionRate: 0,
    marginRate: 30,
    minimumPrice: 760,
    suggestedPrice: 890,
    premiumPrice: 1120,
    timesSold: 11,
    updatedAt: "2026-07-08T16:20:00",
  },
  {
    id: "pricing-5",
    name: "Instalação de quadro de distribuição",
    code: "ELE-INS-003",
    description: "Montagem, organização, identificação e instalação de quadro elétrico.",
    category: "ELECTRICAL",
    status: "ACTIVE",
    averageDurationHours: 8,
    techniciansRequired: 2,
    materialCost: 1850,
    laborCost: 1280,
    equipmentCost: 180,
    displacementCost: 120,
    thirdPartyCost: 250,
    taxRate: 6,
    commissionRate: 3,
    marginRate: 32,
    minimumPrice: 4950,
    suggestedPrice: 5680,
    premiumPrice: 6450,
    timesSold: 9,
    updatedAt: "2026-07-07T11:45:00",
  },
  {
    id: "pricing-6",
    name: "Carga de fluido refrigerante",
    code: "CLI-COR-004",
    description: "Teste de estanqueidade, diagnóstico e complemento de fluido.",
    category: "CLIMATIZATION",
    status: "DRAFT",
    averageDurationHours: 2,
    techniciansRequired: 1,
    materialCost: 560,
    laborCost: 260,
    equipmentCost: 90,
    displacementCost: 75,
    thirdPartyCost: 0,
    taxRate: 6,
    commissionRate: 2,
    marginRate: 28,
    minimumPrice: 1280,
    suggestedPrice: 1450,
    premiumPrice: 1680,
    timesSold: 5,
    updatedAt: "2026-07-06T08:30:00",
  },
];

export const defaultCalculationInput: PricingCalculationInput = {
  materialCost: 650,
  laborHours: 4,
  laborHourlyCost: 85,
  technicians: 2,
  equipmentCost: 120,
  distanceKm: 40,
  costPerKm: 2,
  tollCost: 0,
  accommodationCost: 0,
  foodCost: 120,
  thirdPartyCost: 0,
  taxRate: 6,
  commissionRate: 3,
  marginRate: 35,
  discountRate: 0,
};
