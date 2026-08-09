export type SupplierStatus = "ACTIVE" | "ATTENTION" | "INACTIVE" | "ARCHIVED";
export type SupplierCategory =
  | "CLIMATIZATION"
  | "ELECTRICAL"
  | "REFRIGERATION"
  | "TOOLS"
  | "SAFETY"
  | "LOGISTICS"
  | "SERVICES"
  | "OTHER";

export type SupplierHistoryEntry = {
  id: string;
  type: "CREATED" | "UPDATED" | "ARCHIVED" | "RESTORED" | "RATING_CHANGED";
  description: string;
  createdAt: string;
};

export type SupplierRecord = {
  id: string;
  sequence: number;
  code: string;
  legalName: string;
  tradeName: string;
  document?: string;
  stateRegistration?: string;
  municipalRegistration?: string;
  contactName?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
  categories: SupplierCategory[];
  paymentTerms?: string;
  preferredPaymentMethod?: string;
  deliveryLeadTimeDays?: number;
  minimumOrderCents?: number;
  rating?: number;
  status: SupplierStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  history: SupplierHistoryEntry[];
};

export type SupplierStorageState = {
  version: 1;
  revision: number;
  nextSequence: number;
  suppliers: SupplierRecord[];
};
