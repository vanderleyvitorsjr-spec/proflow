export type FinancialDirection = "INCOME" | "EXPENSE";
export type FinancialNature = "REVENUE" | "EXPENSE" | "INVESTMENT";
export type FinancialAccountType =
  "CASH" | "CHECKING" | "SAVINGS" | "DIGITAL_WALLET" | "INVESTMENT" | "OTHER";
export type FinancialTransactionSource = "MANUAL" | "SERVICE_ORDER";
export type FinancialTransactionKind = "REALIZED" | "RECEIVABLE" | "PAYABLE";
export type FinancialStatus =
  "PENDING" | "OVERDUE" | "PARTIALLY_PAID" | "PAID" | "CANCELED";
export type FinancialHistoryEntry = {
  id: string;
  type:
    | "CREATED"
    | "UPDATED"
    | "DUPLICATED"
    | "ARCHIVED"
    | "DEFAULT_CHANGED"
    | "PAYMENT"
    | "CANCELED"
    | "REVERSED"
    | "RECONCILIATION";
  description: string;
  createdAt: string;
};
export type FinancialPayment = {
  id: string;
  amountCents: number;
  paidAt: string;
  accountId: string;
  method: string;
  notes: string;
  reference: string;
  createdAt: string;
  reversedAt?: string;
  reversalReason?: string;
  history: FinancialHistoryEntry[];
};
export type FinancialInstallment = {
  id: string;
  number: number;
  total: number;
  amountCents: number;
  dueDate: string;
  description?: string;
  payments: FinancialPayment[];
  canceledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  history: FinancialHistoryEntry[];
};
export type FinancialAccount = {
  id: string;
  name: string;
  type: FinancialAccountType;
  openingBalanceCents: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  history: FinancialHistoryEntry[];
};
export type FinancialTransaction = {
  id: string;
  sequence: number;
  title: string;
  description: string;
  nature: FinancialNature;
  direction: FinancialDirection;
  category: string;
  accountId: string;
  competenceDate: string;
  issueDate: string;
  realizedAt: string;
  totalCents: number;
  supplier: string;
  notes: string;
  source: FinancialTransactionSource;
  kind: FinancialTransactionKind;
  customerName?: string;
  clientId?: string;
  clientNameSnapshot?: string;
  serviceOrderId?: string;
  serviceOrderNumberSnapshot?: string;
  serviceOrderTitleSnapshot?: string;
  serviceOrderValueSnapshotCents?: number;
  serviceOrderUpdatedAtSnapshot?: string;
  sourceId?: string;
  purpose?: string;
  idempotencyKey?: string;
  manuallyModified?: boolean;
  reconciliationReviewedAt?: string;
  installments: FinancialInstallment[];
  canceledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  history: FinancialHistoryEntry[];
};
export type FinancialStorageState = {
  version: 3;
  revision: number;
  nextSequence: number;
  accounts: FinancialAccount[];
  transactions: FinancialTransaction[];
};
export type FinancialAccountWithBalance = FinancialAccount & {
  currentBalanceCents: number;
};
export type FinancialTransactionView = FinancialTransaction & { accountName: string };
