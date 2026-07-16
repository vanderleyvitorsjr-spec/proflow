export type FinancialReconciliationStatus =
  | "MATCHED"
  | "ORDER_VALUE_INCREASED"
  | "ORDER_VALUE_DECREASED"
  | "ORDER_ARCHIVED"
  | "ORDER_CANCELED"
  | "ORDER_UNAVAILABLE"
  | "MANUALLY_MODIFIED";
export type ServiceOrderFinancialSummary = {
  serviceOrderId: string;
  issuedCents: number;
  paidCents: number;
  openCents: number;
  receivableIds: string[];
};
export type FinancialDivergenceReference = {
  transactionId: string;
  serviceOrderId: string;
  status: FinancialReconciliationStatus;
};
export interface FinanceiroPublicContract {
  getServiceOrderSummary(id: string): Promise<ServiceOrderFinancialSummary | null>;
  hasReceivable(id: string, purpose: string): Promise<boolean>;
  listDivergences(): Promise<FinancialDivergenceReference[]>;
  getOpenBalanceByServiceOrder(id: string): Promise<number>;
}
