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

export type EquipmentFinancialSource = {
  sourceType: "EQUIPMENT" | "EQUIPMENT_MAINTENANCE";
  sourceId: string;
  equipmentId: string;
  purpose: "ACQUISITION" | "MAINTENANCE";
};
export type EquipmentFinancialNature = "INVESTMENT" | "EXPENSE";
export type EquipmentFinancialAccountReference = { id: string; name: string };
export type EquipmentFinancialCreateInput = {
  source: EquipmentFinancialSource;
  nature: EquipmentFinancialNature;
  title: string;
  description: string;
  category: string;
  accountId: string;
  totalCents: number;
  issueDate: string;
  competenceDate: string;
  firstDueDate: string;
  installmentCount: number;
  supplier: string;
  notes: string;
  payNow?: boolean;
  paymentMethod?: string;
  additionalSequence?: number;
};
export type EquipmentFinancialTransactionReference = {
  id: string;
  number: string;
  nature: EquipmentFinancialNature;
  totalCents: number;
  paidCents: number;
  openCents: number;
  status: "PENDING" | "OVERDUE" | "PARTIALLY_PAID" | "PAID" | "CANCELED";
  accountId: string;
  accountName: string;
  canceled: boolean;
  archived: boolean;
  manuallyModified: boolean;
  updatedAt: string;
  idempotencyKey: string;
};
export type EquipmentFinancialCreationResult = {
  transaction: EquipmentFinancialTransactionReference;
  existing: boolean;
  blocked: boolean;
};
export type StockPurchaseFinancialSource = {
  sourceType: "STOCK_PURCHASE";
  sourceId: string;
  purchaseId: string;
  purpose: "PAYABLE";
};
export type StockPurchaseFinancialCreateInput = {
  source: StockPurchaseFinancialSource;
  title: string;
  description: string;
  accountId: string;
  totalCents: number;
  issueDate: string;
  competenceDate: string;
  firstDueDate: string;
  installmentCount: number;
  supplier: string;
  notes: string;
  additionalSequence?: number;
};
export type StockPurchaseFinancialAccountReference = EquipmentFinancialAccountReference;
export type StockPurchaseFinancialTransactionReference =
  EquipmentFinancialTransactionReference;
export type StockPurchaseFinancialCreationResult = EquipmentFinancialCreationResult;
