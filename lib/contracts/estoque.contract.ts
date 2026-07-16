export type StockPricingReference = {
  id: string;
  internalCode: string;
  name: string;
  unit: string;
  unitScale: number;
  averageCostCents: number;
  physicalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  archived: boolean;
  updatedAt: string;
};

export type StockPricingReferenceResult =
  | { ok: true; data: StockPricingReference[] }
  | { ok: false; error: { code: string; message: string } };

export type StockPricingItemResult =
  | { ok: true; data: StockPricingReference | null }
  | { ok: false; error: { code: string; message: string } };
