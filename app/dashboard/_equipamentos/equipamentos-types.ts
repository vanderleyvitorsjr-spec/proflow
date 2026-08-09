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
    | "CLIENT_LINKED"
    | "CLIENT_UNLINKED"
    | "SERVICE_ORDER_LINKED"
    | "SERVICE_ORDER_UNLINKED"
    | "MAINTENANCE_CREATED"
    | "MAINTENANCE_STARTED"
    | "MAINTENANCE_COMPLETED"
    | "MAINTENANCE_CANCELED"
    | "MAINTENANCE_COST"
    | "WARRANTY_CREATED"
    | "WARRANTY_UPDATED"
    | "WARRANTY_REMOVED"
    | "NEXT_MAINTENANCE"
    | "FINANCIAL_CREATED"
    | "FINANCIAL_EXISTING"
    | "FINANCIAL_DIVERGENCE"
    | "FINANCIAL_COMPLEMENT"
    | "FINANCIAL_BALANCE_CANCELED"
    | "FINANCIAL_REVIEWED"
    | "FINANCIAL_SNAPSHOT_UPDATED"
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
  clientId?: string;
  clientNameSnapshot?: string;
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
  warranty?: EquipmentWarranty;
  acquisitionFinancial?: EquipmentFinancialReference;
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
export type EquipmentWarranty = {
  startDate?: string;
  endDate?: string;
  supplier: string;
  description: string;
  documentReference: string;
  notes: string;
};
export type MaintenanceType = "PREVENTIVE" | "CORRECTIVE";
export type MaintenanceStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELED";
export type MaintenanceHistory = {
  id: string;
  message: string;
  origin: AssetHistory["origin"];
  createdAt: string;
};
export type MaintenanceRecord = {
  id: string;
  assetId: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  title: string;
  description: string;
  supplier: string;
  costCents: number;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  canceledAt?: string;
  nextMaintenanceAt?: string;
  serviceOrderId?: string;
  serviceOrderNumberSnapshot?: string;
  responsible: string;
  notes: string;
  financialTransactionId?: string;
  financialPurpose?: "MAINTENANCE";
  financialSnapshot?: EquipmentFinancialSnapshot;
  reconciliationReviewedAt?: string;
  reconciliationNotes?: string;
  manuallyModified?: boolean;
  previousAssetStatus?: AssetStatus;
  createdAt: string;
  updatedAt: string;
  history: MaintenanceHistory[];
};
export type EquipmentFinancialReconciliationStatus =
  | "MATCHED"
  | "EQUIPMENT_VALUE_INCREASED"
  | "EQUIPMENT_VALUE_DECREASED"
  | "MAINTENANCE_VALUE_INCREASED"
  | "MAINTENANCE_VALUE_DECREASED"
  | "FINANCIAL_CANCELED"
  | "FINANCIAL_ARCHIVED"
  | "FINANCIAL_UNAVAILABLE"
  | "MANUALLY_MODIFIED";
export type EquipmentFinancialSnapshot = {
  transactionId: string;
  number: string;
  nature: "INVESTMENT" | "EXPENSE";
  totalCents: number;
  paidCents: number;
  openCents: number;
  status: string;
  accountName: string;
  canceled: boolean;
  archived: boolean;
  manuallyModified: boolean;
  updatedAt: string;
};
export type EquipmentFinancialReference = {
  financialTransactionId: string;
  financialPurpose: "ACQUISITION";
  financialSnapshot: EquipmentFinancialSnapshot;
  reconciliationReviewedAt?: string;
  reconciliationNotes?: string;
  manuallyModified?: boolean;
};
export type EquipmentServiceOrderLink = {
  id: string;
  assetId: string;
  serviceOrderId: string;
  serviceOrderNumberSnapshot: string;
  serviceOrderTitleSnapshot: string;
  clientIdSnapshot?: string;
  purpose?: string;
  linkedAt: string;
  unlinkedAt?: string;
  createdAt: string;
  updatedAt: string;
};
export type EquipmentStorageState = {
  version: 3;
  revision: number;
  nextSequence: number;
  assets: EquipmentAsset[];
  maintenanceRecords: MaintenanceRecord[];
  serviceOrderLinks: EquipmentServiceOrderLink[];
};
export type EquipmentView = "list" | "cards";
