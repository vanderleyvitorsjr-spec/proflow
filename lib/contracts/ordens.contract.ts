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
