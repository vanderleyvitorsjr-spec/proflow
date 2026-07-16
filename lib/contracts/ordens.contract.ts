export type ServiceOrderFinancialSnapshot = {
  id: string;
  number: string;
  clientId: string;
  title: string;
  estimatedValueCents: number;
  status: string;
  canceled: boolean;
  archived: boolean;
  updatedAt: string;
};
export interface OrdensPublicContract {
  getFinancialSnapshot(id: string): Promise<ServiceOrderFinancialSnapshot | null>;
  listFinancialSnapshots(): Promise<ServiceOrderFinancialSnapshot[]>;
  exists(id: string): Promise<boolean>;
}
export type ServiceOrderTechnicalReference = {
  id: string;
  number: string;
  title: string;
  clientId?: string;
  canceled: boolean;
  archived: boolean;
};

export type ServiceOrderStockReference = {
  id: string;
  number: string;
  title: string;
  clientId: string;
  status: string;
  canceled: boolean;
  archived: boolean;
  updatedAt: string;
  stockReservationAllowed: boolean;
};

export type ServiceOrderAppliedPricing = {
  simulationId: string;
  simulationVersion: number;
  revisionId: string;
  priceCents: number;
  priceType: string;
  appliedAt: string;
  pricingUpdatedAtSnapshot: string;
};
export type ServiceOrderPricingReference = {
  id: string;
  number: string;
  title: string;
  clientId: string;
  currentPriceCents: number;
  status: string;
  canceled: boolean;
  archived: boolean;
  updatedAt: string;
  appliedPricing?: ServiceOrderAppliedPricing;
};
export type ApplyServiceOrderPricingInput = ServiceOrderAppliedPricing & { serviceOrderId: string };
