export type ReportCrmLead = {
  id: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  convertedAt?: string;
  convertedClientId?: string;
  stage: string;
  source: string;
  serviceInterest: string;
  salesOwner: string;
  estimatedValue: number;
  city: string;
  state: string;
};
