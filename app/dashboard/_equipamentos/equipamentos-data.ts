import type {
  AssetCondition,
  AssetOwnership,
  AssetStatus,
  AssetType,
  EquipmentStorageState,
} from "./equipamentos-types";
export const assetTypeLabels: Record<AssetType, string> = {
  TECHNICAL_EQUIPMENT: "Equipamento técnico",
  TOOL: "Ferramenta",
  VEHICLE: "Veículo",
  COMPUTER: "Informática",
  LIGHTING: "Iluminação",
  AUDIO: "Áudio",
  MEASUREMENT_INSTRUMENT: "Instrumento de medição",
  MACHINE: "Máquina",
  OTHER: "Outro",
};
export const ownershipLabels: Record<AssetOwnership, string> = {
  COMPANY: "Empresa",
  CUSTOMER: "Cliente",
  THIRD_PARTY: "Terceiro",
};
export const statusLabels: Record<AssetStatus, string> = {
  AVAILABLE: "Disponível",
  IN_USE: "Em uso",
  UNDER_MAINTENANCE: "Em manutenção",
  INACTIVE: "Inativo",
  RETIRED: "Retirado",
  LOST: "Perdido",
};
export const conditionLabels: Record<AssetCondition, string> = {
  GOOD: "Bom",
  ATTENTION: "Atenção",
  DAMAGED: "Danificado",
  UNUSABLE: "Inutilizável",
};
export const initialEquipmentState: EquipmentStorageState = {
  version: 3,
  revision: 0,
  nextSequence: 1,
  maintenanceRecords: [],
  serviceOrderLinks: [],
  assets: [],
};
export type { EquipmentView } from "./equipamentos-types";
