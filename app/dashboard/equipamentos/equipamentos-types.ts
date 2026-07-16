export type AssetType =
  | "TECHNICAL_EQUIPMENT"
  | "TOOL"
  | "VEHICLE"
  | "COMPUTER"
  | "LIGHTING"
  | "AUDIO"
  | "MEASUREMENT_INSTRUMENT"
  | "MACHINE"
  | "OTHER";
export type AssetOwnership = "COMPANY" | "CUSTOMER" | "THIRD_PARTY";
export type AssetStatus =
  "AVAILABLE" | "IN_USE" | "UNDER_MAINTENANCE" | "INACTIVE" | "RETIRED" | "LOST";
export type AssetCondition = "GOOD" | "ATTENTION" | "DAMAGED" | "UNUSABLE";
export type AssetLocation = {
  id?: string;
  name: string;
  room?: string;
  container?: string;
  description?: string;
};
export type AssetMedia = {
  id: string;
  type: "PHOTO" | "DOCUMENT";
  name: string;
  reference?: string;
  mimeType?: string;
  createdAt: string;
};
export type AssetHistory = {
  id: string;
  type:
    | "CREATED"
    | "UPDATED"
    | "STATUS"
    | "CONDITION"
    | "LOCATION"
    | "DEPRECIATION"
    | "ARCHIVED";
  message: string;
  origin: "MANUAL" | "IMPORT" | "SYSTEM" | "FINANCIAL" | "SERVICE_ORDER";
  createdAt: string;
  metadata?: Record<string, string>;
};
export type EquipmentAsset = {
  id: string;
  sequence: number;
  internalCode: string;
  name: string;
  description: string;
  assetType: AssetType;
  category: string;
  manufacturer: string;
  model: string;
  serialNumber?: string;
  patrimonyNumber?: string;
  ownership: AssetOwnership;
  responsible: string;
  location: AssetLocation;
  acquisition: {
    acquisitionDate?: string;
    acquisitionValueCents: number;
    supplier: string;
    invoiceNumber: string;
    purchaseReference: string;
    notes: string;
  };
  depreciation: {
    mode: "LINEAR" | "NONE";
    startDate?: string;
    usefulLifeMonths?: number;
    residualValueCents: number;
  };
  status: AssetStatus;
  condition: AssetCondition;
  photos: AssetMedia[];
  documents: AssetMedia[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  archiveReason?: string;
  history: AssetHistory[];
};
export type EquipmentStorageState = {
  version: 1;
  revision: number;
  nextSequence: number;
  assets: EquipmentAsset[];
};
export type EquipmentView = "list" | "cards";
