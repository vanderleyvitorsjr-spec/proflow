export type CrmStageId = "new" | "contacted" | "technical-visit" | "sent" | "negotiation" | "approved" | "lost";
export type CrmPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type CrmPersonType = "INDIVIDUAL" | "COMPANY";

export type CrmHistoryEvent = {
  id: string;
  type: "CREATED" | "UPDATED" | "STAGE_CHANGED" | "CONVERTED" | "ARCHIVED";
  description: string;
  createdAt: string;
};

export type CrmLeadRecord = {
  id: string;
  name: string;
  type: CrmPersonType;
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
  priority: CrmPriority;
  estimatedValue: number;
  contactDate: string;
  notes: string;
  stageId: CrmStageId;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  convertedAt?: string;
  convertedClientId?: string;
  history: CrmHistoryEvent[];
};
