export type ReportClient = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  lastInteractionAt?: string;
  status: string;
  segment: string;
  city: string;
  state: string;
};
