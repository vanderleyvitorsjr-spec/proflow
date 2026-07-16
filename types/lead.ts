export type LeadPersonType = "INDIVIDUAL" | "COMPANY";

export type LeadPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "LOST" | "CONVERTED";

export type CreateLeadInput = {
  name: string;
  type: LeadPersonType;
  document: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  source: string;
  serviceInterest: string;
  salesOwner: string;
  priority: LeadPriority;
  estimatedValue: number;
  contactDate: string;
  notes: string;
};

export type Lead = CreateLeadInput & {
  id: string;
  companyId: string;
  status: LeadStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};
