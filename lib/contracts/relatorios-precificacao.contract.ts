export type ReportPricingSimulation = {
  id: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  status: string;
  category: string;
  templateId?: string;
  scenarioGroupId?: string;
  versionCount: number;
  currentVersion: number;
  totalCostCents: number;
  minimumPriceCents: number;
  recommendedPriceCents: number;
  profitCents: number;
  marginBasisPoints: number;
  applications: {
    serviceOrderId: string;
    priceCents: number;
    profitCents: number;
    marginBasisPoints: number;
    appliedAt: string;
    superseded: boolean;
  }[];
  componentTypes: string[];
  materialIds: string[];
  equipmentIds: string[];
};
export type ReportPricingSource = {
  simulations: ReportPricingSimulation[];
  activeTemplateCount: number;
};
