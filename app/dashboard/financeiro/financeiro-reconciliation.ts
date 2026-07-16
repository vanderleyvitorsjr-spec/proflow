import type { FinancialReconciliationStatus } from "@/lib/contracts/financeiro.contract";
import type { ServiceOrderFinancialSnapshot } from "@/lib/contracts/ordens.contract";
import { transactionOpenCents, transactionPaidCents } from "./financeiro-status";
import type { FinancialTransaction } from "./financeiro-types";

export type FinancialDivergence = {
  transaction: FinancialTransaction;
  order: ServiceOrderFinancialSnapshot | null;
  status: FinancialReconciliationStatus;
  currentOrderValueCents: number;
  issuedCents: number;
  paidCents: number;
  openCents: number;
  differenceCents: number;
};
export function reconcileTransaction(
  transaction: FinancialTransaction,
  order: ServiceOrderFinancialSnapshot | null,
): FinancialDivergence {
  const paidCents = transactionPaidCents(transaction),
    openCents = transactionOpenCents(transaction),
    issuedCents = transaction.totalCents,
    currentOrderValueCents = order?.estimatedValueCents ?? 0;
  let status: FinancialReconciliationStatus = "MATCHED";
  if (!order) status = "ORDER_UNAVAILABLE";
  else if (order.canceled) status = "ORDER_CANCELED";
  else if (order.archived) status = "ORDER_ARCHIVED";
  else if (transaction.manuallyModified) status = "MANUALLY_MODIFIED";
  else if (currentOrderValueCents > issuedCents) status = "ORDER_VALUE_INCREASED";
  else if (currentOrderValueCents < issuedCents) status = "ORDER_VALUE_DECREASED";
  return {
    transaction,
    order,
    status,
    currentOrderValueCents,
    issuedCents,
    paidCents,
    openCents,
    differenceCents: currentOrderValueCents - issuedCents,
  };
}
