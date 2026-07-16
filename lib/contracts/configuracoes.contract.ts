export type CompanyPublicSettings = {
  displayName: string;
  shortName: string;
  tradeName: string;
  phone: string;
  whatsapp: string;
  email: string;
  city: string;
  state: string;
  segment: string;
  specialties: string[];
  updatedAt: string;
};
export type TeamMemberPublicReference = {
  id: string;
  name: string;
  role: string;
  specialties: string[];
  hourlyCostCents: number;
  burdenRateBasisPoints: number;
  availability: string;
  active: boolean;
  archived: boolean;
  updatedAt: string;
};
export type OperationalPublicSettings = {
  serviceOrder: {
    prefix: string;
    sequenceDigits: number;
    statuses: string[];
    priorities: string[];
    categories: string[];
    defaultDurationMinutes: number;
    initialStatus: string;
    terminalStatuses: string[];
  };
  agenda: {
    startTime: string;
    endTime: string;
    defaultDurationMinutes: number;
    workingDays: number[];
    timezone: string;
    initialView: string;
    blockConflicts: boolean;
  };
  stock: {
    categories: string[];
    units: string[];
    allowNegative: boolean;
    costMethod: "WEIGHTED_AVERAGE";
  };
  equipment: {
    categories: string[];
    types: string[];
    statuses: string[];
    conditions: string[];
    depreciationMethod: "LINEAR" | "NONE";
  };
};
export type FinancialPublicSettings = {
  currency: "BRL";
  defaultAccountId: string;
  revenueCategories: string[];
  expenseCategories: string[];
  investmentCategories: string[];
  paymentMethods: string[];
  defaultDueDays: number;
  defaultInstallments: number;
  allowOverpayment: false;
};
export type PricingPublicSettings = {
  minimumMarginBasisPoints: number;
  recommendedMarginBasisPoints: number;
  premiumMarginBasisPoints: number;
  taxBasisPoints: number;
  commissionBasisPoints: number;
  laborBurdenBasisPoints: number;
  equipmentMonthlyHours: number;
  technicalLossBasisPoints: number;
  costPerKmCents: number;
  overheadBasisPoints: number;
  requireBelowMinimumConfirmation: boolean;
  rounding: string;
};
export type NumberingPublicSettings = Record<
  string,
  {
    prefix: string;
    nextNumber: number;
    digits: number;
    includeYear: boolean;
    separator: string;
  }
>;
export type AppearancePublicSettings = {
  theme: "light" | "dark" | "system";
  density: "comfortable" | "compact";
  radius: "default" | "rounded";
  contrast: "normal" | "high";
  accent: string;
  fontSize: "normal" | "large";
  reducedMotion: boolean;
};
export type ConfiguracoesPublicSettings = {
  revision: number;
  company: CompanyPublicSettings;
  team: TeamMemberPublicReference[];
  operational: OperationalPublicSettings;
  financial: FinancialPublicSettings;
  pricing: PricingPublicSettings;
  numbering: NumberingPublicSettings;
  appearance: AppearancePublicSettings;
};
