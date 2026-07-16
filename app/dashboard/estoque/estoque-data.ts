export type StockView = "list" | "cards";

export type StockItemStatus =
  | "AVAILABLE"
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | "RESERVED"
  | "INACTIVE";

export type StockUnit =
  | "UNIT"
  | "METER"
  | "KILOGRAM"
  | "LITER"
  | "BOX"
  | "PACKAGE"
  | "ROLL";

export type StockCategory =
  | "REFRIGERATION"
  | "ELECTRICAL"
  | "TOOLS"
  | "SAFETY"
  | "CONSUMABLES"
  | "CLEANING"
  | "OTHER";

export type StockItem = {
  id: string;
  name: string;
  internalCode: string;
  barcode?: string;
  category: StockCategory;
  brand?: string;
  model?: string;
  unit: StockUnit;
  location: string;
  supplier?: string;
  currentQuantity: number;
  minimumQuantity: number;
  reservedQuantity: number;
  averageCost: number;
  lastCost: number;
  pendingPurchaseQuantity: number;
  status: StockItemStatus;
  lastMovementAt?: string;
  notes?: string;
};

export type StockMovementType =
  | "ENTRY"
  | "EXIT"
  | "TRANSFER"
  | "ADJUSTMENT"
  | "RESERVATION"
  | "RETURN";

export type StockMovement = {
  id: string;
  stockItemId: string;
  type: StockMovementType;
  quantity: number;
  occurredAt: string;
  responsible: string;
  serviceOrderNumber?: string;
  description: string;
};

export const stockCategoryLabels: Record<StockCategory, string> = {
  REFRIGERATION: "Refrigeração",
  ELECTRICAL: "Elétrica",
  TOOLS: "Ferramentas",
  SAFETY: "Segurança",
  CONSUMABLES: "Consumíveis",
  CLEANING: "Limpeza",
  OTHER: "Outros",
};

export const stockStatusLabels: Record<StockItemStatus, string> = {
  AVAILABLE: "Disponível",
  LOW_STOCK: "Estoque baixo",
  OUT_OF_STOCK: "Sem estoque",
  RESERVED: "Reservado",
  INACTIVE: "Inativo",
};

export const stockUnitLabels: Record<StockUnit, string> = {
  UNIT: "UN",
  METER: "m",
  KILOGRAM: "kg",
  LITER: "L",
  BOX: "Caixa",
  PACKAGE: "Pacote",
  ROLL: "Rolo",
};

export const stockItems: StockItem[] = [
  {
    id: "stock-1",
    name: "Tubulação de cobre 1/4",
    internalCode: "REF-COB-001",
    barcode: "7890000000011",
    category: "REFRIGERATION",
    brand: "Marca de exemplo",
    model: "Cobre flexível 1/4",
    unit: "METER",
    location: "Prateleira A1",
    supplier: "Fornecedor de refrigeração",
    currentQuantity: 8,
    minimumQuantity: 20,
    reservedQuantity: 3,
    averageCost: 19.5,
    lastCost: 21,
    pendingPurchaseQuantity: 30,
    status: "LOW_STOCK",
    lastMovementAt: "2026-07-12T15:30:00",
  },
  {
    id: "stock-2",
    name: "Tubulação de cobre 3/8",
    internalCode: "REF-COB-002",
    barcode: "7890000000028",
    category: "REFRIGERATION",
    brand: "Marca de exemplo",
    model: "Cobre flexível 3/8",
    unit: "METER",
    location: "Prateleira A1",
    supplier: "Fornecedor de refrigeração",
    currentQuantity: 42,
    minimumQuantity: 20,
    reservedQuantity: 12,
    averageCost: 28.75,
    lastCost: 29.9,
    pendingPurchaseQuantity: 0,
    status: "AVAILABLE",
    lastMovementAt: "2026-07-11T10:15:00",
  },
  {
    id: "stock-3",
    name: "Cabo flexível 2,5 mm²",
    internalCode: "ELE-CAB-001",
    barcode: "7890000000035",
    category: "ELECTRICAL",
    brand: "Marca de exemplo",
    model: "Cabo antichama",
    unit: "METER",
    location: "Prateleira B2",
    supplier: "Fornecedor elétrico",
    currentQuantity: 180,
    minimumQuantity: 80,
    reservedQuantity: 45,
    averageCost: 4.65,
    lastCost: 4.9,
    pendingPurchaseQuantity: 0,
    status: "AVAILABLE",
    lastMovementAt: "2026-07-13T08:40:00",
  },
  {
    id: "stock-4",
    name: "Disjuntor bipolar 32 A",
    internalCode: "ELE-DIS-032",
    barcode: "7890000000042",
    category: "ELECTRICAL",
    brand: "Marca de exemplo",
    model: "Curva C",
    unit: "UNIT",
    location: "Gaveta B4",
    supplier: "Fornecedor elétrico",
    currentQuantity: 3,
    minimumQuantity: 6,
    reservedQuantity: 2,
    averageCost: 58,
    lastCost: 62.5,
    pendingPurchaseQuantity: 10,
    status: "LOW_STOCK",
    lastMovementAt: "2026-07-12T16:20:00",
  },
  {
    id: "stock-5",
    name: "Fita isolante profissional",
    internalCode: "ELE-FIT-001",
    barcode: "7890000000059",
    category: "CONSUMABLES",
    brand: "Marca de exemplo",
    model: "19 mm × 20 m",
    unit: "ROLL",
    location: "Gaveta C1",
    supplier: "Fornecedor geral",
    currentQuantity: 24,
    minimumQuantity: 10,
    reservedQuantity: 4,
    averageCost: 12.8,
    lastCost: 13.2,
    pendingPurchaseQuantity: 0,
    status: "AVAILABLE",
    lastMovementAt: "2026-07-10T11:00:00",
  },
  {
    id: "stock-6",
    name: "Fluido refrigerante R-410A",
    internalCode: "REF-GAS-410",
    barcode: "7890000000066",
    category: "REFRIGERATION",
    brand: "Marca de exemplo",
    model: "Cilindro 11,3 kg",
    unit: "KILOGRAM",
    location: "Área controlada D1",
    supplier: "Fornecedor de gases",
    currentQuantity: 0,
    minimumQuantity: 5,
    reservedQuantity: 0,
    averageCost: 78,
    lastCost: 82,
    pendingPurchaseQuantity: 22.6,
    status: "OUT_OF_STOCK",
    lastMovementAt: "2026-07-09T14:00:00",
  },
  {
    id: "stock-7",
    name: "Suporte para condensadora",
    internalCode: "REF-SUP-001",
    barcode: "7890000000073",
    category: "REFRIGERATION",
    brand: "Marca de exemplo",
    model: "Suporte reforçado",
    unit: "UNIT",
    location: "Prateleira E2",
    supplier: "Fornecedor de climatização",
    currentQuantity: 14,
    minimumQuantity: 8,
    reservedQuantity: 8,
    averageCost: 89,
    lastCost: 94,
    pendingPurchaseQuantity: 0,
    status: "RESERVED",
    lastMovementAt: "2026-07-13T09:10:00",
  },
  {
    id: "stock-8",
    name: "Luva de proteção elétrica",
    internalCode: "SEG-LUV-001",
    barcode: "7890000000080",
    category: "SAFETY",
    brand: "Marca de exemplo",
    model: "Classe 00",
    unit: "PAIR" as StockUnit,
    location: "Armário de segurança",
    supplier: "Fornecedor de EPI",
    currentQuantity: 6,
    minimumQuantity: 4,
    reservedQuantity: 0,
    averageCost: 145,
    lastCost: 152,
    pendingPurchaseQuantity: 0,
    status: "AVAILABLE",
    lastMovementAt: "2026-07-07T09:00:00",
  },
  {
    id: "stock-9",
    name: "Produto para limpeza de evaporadora",
    internalCode: "LIM-EVA-001",
    barcode: "7890000000097",
    category: "CLEANING",
    brand: "Marca de exemplo",
    model: "Concentrado",
    unit: "LITER",
    location: "Prateleira F1",
    supplier: "Fornecedor de limpeza técnica",
    currentQuantity: 18,
    minimumQuantity: 8,
    reservedQuantity: 5,
    averageCost: 32.5,
    lastCost: 34,
    pendingPurchaseQuantity: 0,
    status: "AVAILABLE",
    lastMovementAt: "2026-07-12T13:45:00",
  },
  {
    id: "stock-10",
    name: "Contator tripolar 32 A",
    internalCode: "ELE-CON-032",
    barcode: "7890000000103",
    category: "ELECTRICAL",
    brand: "Marca de exemplo",
    model: "Bobina 220 V",
    unit: "UNIT",
    location: "Gaveta B5",
    supplier: "Fornecedor elétrico",
    currentQuantity: 2,
    minimumQuantity: 4,
    reservedQuantity: 2,
    averageCost: 184,
    lastCost: 196,
    pendingPurchaseQuantity: 6,
    status: "RESERVED",
    lastMovementAt: "2026-07-13T10:30:00",
  },
];

export const stockMovements: StockMovement[] = [
  {
    id: "movement-1",
    stockItemId: "stock-3",
    type: "EXIT",
    quantity: 25,
    occurredAt: "2026-07-13T08:40:00",
    responsible: "Responsável pelo estoque",
    serviceOrderNumber: "OS-2026-0104",
    description: "Saída para execução de serviço elétrico.",
  },
  {
    id: "movement-2",
    stockItemId: "stock-7",
    type: "RESERVATION",
    quantity: 4,
    occurredAt: "2026-07-13T09:10:00",
    responsible: "Responsável pelo estoque",
    serviceOrderNumber: "OS-2026-0102",
    description: "Reserva para instalação agendada.",
  },
  {
    id: "movement-3",
    stockItemId: "stock-1",
    type: "EXIT",
    quantity: 6,
    occurredAt: "2026-07-12T15:30:00",
    responsible: "Equipe técnica",
    serviceOrderNumber: "OS-2026-0101",
    description: "Consumo em manutenção corretiva.",
  },
];