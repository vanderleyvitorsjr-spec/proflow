export type EquipmentPricingReference = {
  id: string;
  internalCode: string;
  name: string;
  ownership: string;
  status: string;
  condition: string;
  currentValueCents: number;
  monthlyDepreciationCents: number;
  estimatedMaintenanceMonthlyCents: number;
  archived: boolean;
  updatedAt: string;
};

export type EquipmentPricingReferenceResult =
  | { ok: true; data: EquipmentPricingReference[] }
  | { ok: false; error: { code: string; message: string } };

export type EquipmentPricingItemResult =
  | { ok: true; data: EquipmentPricingReference | null }
  | { ok: false; error: { code: string; message: string } };
