export type ReportEquipmentAsset = {
  id: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  category: string;
  ownership: string;
  status: string;
  condition: string;
  acquisitionDate?: string;
  acquisitionValueCents: number;
  currentValueCents: number;
  accumulatedDepreciationCents: number;
  warrantyEndDate?: string;
};
export type ReportEquipmentMaintenance = {
  id: string;
  assetId: string;
  status: string;
  type: string;
  costCents: number;
  scheduledAt: string;
  completedAt?: string;
  canceledAt?: string;
  serviceOrderId?: string;
  hasFinancialLink: boolean;
};
export type ReportEquipmentLink = {
  assetId: string;
  serviceOrderId: string;
  linkedAt: string;
  unlinkedAt?: string;
};
export type ReportEquipmentSource = {
  assets: ReportEquipmentAsset[];
  maintenance: ReportEquipmentMaintenance[];
  links: ReportEquipmentLink[];
};
