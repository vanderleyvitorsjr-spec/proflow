export type TechnicalLibraryView = "cards" | "list";

export type TechnicalContentType =
  | "MANUAL"
  | "DIAGRAM"
  | "PROCEDURE"
  | "STANDARD"
  | "VIDEO";

export type TechnicalCategory =
  | "AIR_CONDITIONING"
  | "REFRIGERATION"
  | "ELECTRICAL"
  | "AUTOMATION"
  | "SAFETY";

export type TechnicalDocument = {
  id: string;
  code: string;
  title: string;
  description: string;
  category: TechnicalCategory;
  contentType: TechnicalContentType;
  manufacturer: string;
  equipment: string;
  format: "PDF" | "MP4" | "SVG";
  fileSize?: string;
  duration?: string;
  version: string;
  updatedAt: string;
  views: number;
  isFavorite: boolean;
  isRecent: boolean;
  equipmentCodes: string[];
  serviceOrderReferences: string[];
  tags: string[];
};

export const categoryLabels: Record<TechnicalCategory, string> = {
  AIR_CONDITIONING: "Climatização",
  REFRIGERATION: "Refrigeração",
  ELECTRICAL: "Elétrica",
  AUTOMATION: "Automação",
  SAFETY: "Segurança",
};

export const contentTypeLabels: Record<TechnicalContentType, string> = {
  MANUAL: "Manual",
  DIAGRAM: "Diagrama",
  PROCEDURE: "Procedimento",
  STANDARD: "Norma",
  VIDEO: "Vídeo",
};

export const technicalDocuments: TechnicalDocument[] = [
  {
    id: "doc-001",
    code: "BT-MAN-001",
    title: "Manual de instalação de sistema split",
    description: "Orientações de montagem, vácuo, carga e partida inicial.",
    category: "AIR_CONDITIONING",
    contentType: "MANUAL",
    manufacturer: "Fabricante Alfa",
    equipment: "Condicionador split inverter",
    format: "PDF",
    fileSize: "8,4 MB",
    version: "3.2",
    updatedAt: "2026-07-12T09:00:00",
    views: 486,
    isFavorite: true,
    isRecent: true,
    equipmentCodes: ["EQ-AC-014", "EQ-AC-028"],
    serviceOrderReferences: ["OS-2026-0412"],
    tags: ["instalação", "vácuo", "partida"],
  },
  {
    id: "doc-002",
    code: "BT-DIA-004",
    title: "Diagrama elétrico de comando trifásico",
    description: "Circuito de força, proteção e acionamento para motores.",
    category: "ELECTRICAL",
    contentType: "DIAGRAM",
    manufacturer: "Multimarcas",
    equipment: "Painel de comando",
    format: "SVG",
    fileSize: "2,1 MB",
    version: "2.0",
    updatedAt: "2026-07-10T14:30:00",
    views: 812,
    isFavorite: true,
    isRecent: true,
    equipmentCodes: ["EQ-EL-009"],
    serviceOrderReferences: ["OS-2026-0388", "OS-2026-0401"],
    tags: ["comando", "trifásico", "proteção"],
  },
  {
    id: "doc-003",
    code: "BT-PRO-008",
    title: "Procedimento de manutenção preventiva",
    description: "Checklist técnico para inspeção e limpeza de evaporadoras.",
    category: "AIR_CONDITIONING",
    contentType: "PROCEDURE",
    manufacturer: "Multimarcas",
    equipment: "Evaporadora de parede",
    format: "PDF",
    fileSize: "3,7 MB",
    version: "4.1",
    updatedAt: "2026-07-08T11:15:00",
    views: 639,
    isFavorite: false,
    isRecent: true,
    equipmentCodes: ["EQ-AC-006", "EQ-AC-011"],
    serviceOrderReferences: [],
    tags: ["preventiva", "limpeza", "checklist"],
  },
  {
    id: "doc-004",
    code: "BT-NOR-003",
    title: "Boas práticas de segurança em instalações",
    description: "Resumo operacional de bloqueio, sinalização e uso de proteção.",
    category: "SAFETY",
    contentType: "STANDARD",
    manufacturer: "Referência técnica",
    equipment: "Instalações elétricas",
    format: "PDF",
    fileSize: "5,2 MB",
    version: "1.4",
    updatedAt: "2026-06-28T08:45:00",
    views: 925,
    isFavorite: true,
    isRecent: false,
    equipmentCodes: [],
    serviceOrderReferences: [],
    tags: ["segurança", "bloqueio", "proteção"],
  },
  {
    id: "doc-005",
    code: "BT-VID-006",
    title: "Diagnóstico de falhas em unidade condensadora",
    description: "Sequência visual para medições e análise de funcionamento.",
    category: "REFRIGERATION",
    contentType: "VIDEO",
    manufacturer: "Fabricante Beta",
    equipment: "Unidade condensadora",
    format: "MP4",
    duration: "18 min",
    version: "1.0",
    updatedAt: "2026-06-22T16:20:00",
    views: 1_284,
    isFavorite: false,
    isRecent: false,
    equipmentCodes: ["EQ-RF-021"],
    serviceOrderReferences: ["OS-2026-0352"],
    tags: ["diagnóstico", "pressão", "medição"],
  },
  {
    id: "doc-006",
    code: "BT-MAN-012",
    title: "Manual de controlador programável",
    description: "Configuração de entradas, saídas, alarmes e rotinas básicas.",
    category: "AUTOMATION",
    contentType: "MANUAL",
    manufacturer: "Fabricante Gama",
    equipment: "Controlador programável",
    format: "PDF",
    fileSize: "11,6 MB",
    version: "2.6",
    updatedAt: "2026-06-15T10:00:00",
    views: 374,
    isFavorite: false,
    isRecent: false,
    equipmentCodes: ["EQ-AU-004"],
    serviceOrderReferences: [],
    tags: ["controlador", "alarmes", "configuração"],
  },
];

export const categoryOptions = Object.entries(categoryLabels).map(
  ([value, label]) => ({ value: value as TechnicalCategory, label }),
);

export const contentTypeOptions = Object.entries(contentTypeLabels).map(
  ([value, label]) => ({ value: value as TechnicalContentType, label }),
);

export const manufacturerOptions = Array.from(
  new Set(technicalDocuments.map((document) => document.manufacturer)),
).sort((first, second) => first.localeCompare(second, "pt-BR"));

export const equipmentOptions = Array.from(
  new Set(technicalDocuments.map((document) => document.equipment)),
).sort((first, second) => first.localeCompare(second, "pt-BR"));
