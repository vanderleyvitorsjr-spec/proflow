export type ReportFinancialAccount = {
  id: string;
  name: string;
  currentBalanceCents: number;
  archived: boolean;
};
export type ReportFinancialPayment = {
  amountCents: number;
  paidAt: string;
  reversedAt?: string;
};
export type ReportFinancialInstallment = {
  dueDate: string;
  amountCents: number;
  canceled: boolean;
  payments: ReportFinancialPayment[];
};
export type ReportFinancialTransaction = {
  id: string;
  title: string;
  nature: "REVENUE" | "EXPENSE" | "INVESTMENT";
  direction: "INCOME" | "EXPENSE";
  kind: "REALIZED" | "RECEIVABLE" | "PAYABLE";
  category: string;
  competenceDate: string;
  issueDate: string;
  realizedAt: string;
  totalCents: number;
  accountId: string;
  clientId?: string;
  customerName?: string;
  serviceOrderId?: string;
  canceled: boolean;
  archived: boolean;
  installments: ReportFinancialInstallment[];
};
export type ReportFinancialSource = {
  accounts: ReportFinancialAccount[];
  transactions: ReportFinancialTransaction[];
};
