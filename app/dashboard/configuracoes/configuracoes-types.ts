import type {
  AppearancePublicSettings,
  FinancialPublicSettings,
  NumberingPublicSettings,
  OperationalPublicSettings,
  PricingPublicSettings,
} from "@/lib/contracts/configuracoes.contract";
export type HistoryEntry = {
  id: string;
  type: string;
  description: string;
  createdAt: string;
};
export type CompanySettings = {
  legalName: string;
  tradeName: string;
  document: string;
  stateRegistration: string;
  municipalRegistration: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  legalRepresentative: string;
  notes: string;
  segment: string;
  specialties: string[];
  businessHours: string;
  displayName: string;
  shortName: string;
  logoMetadata: string;
  iconMetadata: string;
  primaryColor: string;
  secondaryColor: string;
  documentHeader: string;
  documentFooter: string;
  textualSignature: string;
  updatedAt: string;
};
export type TeamMember = {
  id: string;
  name: string;
  role: string;
  specialties: string[];
  phone: string;
  email: string;
  document?: string;
  hourlyCostCents: number;
  burdenRateBasisPoints: number;
  active: boolean;
  colorIdentifier?: string;
  availability: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  history: HistoryEntry[];
};
export type NumberingSettings = NumberingPublicSettings;
export type SystemPreferences = {
  dateFormat: "DD/MM/YYYY";
  timeFormat: "24h" | "12h";
  language: "pt-BR";
  timezone: string;
  tableRows: number;
  moduleInitialViews: Record<string, string>;
  confirmDeletion: boolean;
  confirmArchiving: boolean;
  openDetails: "same-tab" | "new-tab";
  preserveFilters: boolean;
  internalNotifications: boolean;
};
export type ConfigSection =
  | "company"
  | "team"
  | "operational"
  | "financial"
  | "pricing"
  | "numbering"
  | "appearance"
  | "preferences";
export type ConfigState = {
  version: 1;
  revision: number;
  company: CompanySettings;
  teamMembers: TeamMember[];
  operationalSettings: OperationalPublicSettings;
  financialSettings: FinancialPublicSettings;
  pricingSettings: PricingPublicSettings;
  numberingSettings: NumberingSettings;
  appearanceSettings: AppearancePublicSettings;
  systemPreferences: SystemPreferences;
  history: HistoryEntry[];
};
