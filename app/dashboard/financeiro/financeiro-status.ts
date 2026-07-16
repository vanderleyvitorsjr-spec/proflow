import type {
  FinancialInstallment,
  FinancialPayment,
  FinancialStatus,
  FinancialTransaction,
} from "./financeiro-types";
export const activePaymentAmount = (payment: FinancialPayment) =>
  payment.reversedAt ? 0 : payment.amountCents;
export const installmentPaidCents = (installment: FinancialInstallment) =>
  installment.payments.reduce((sum, item) => sum + activePaymentAmount(item), 0);
export const installmentOpenCents = (installment: FinancialInstallment) =>
  installment.canceledAt
    ? 0
    : Math.max(0, installment.amountCents - installmentPaidCents(installment));
export function installmentStatus(
  installment: FinancialInstallment,
  today = new Date().toISOString().slice(0, 10),
): FinancialStatus {
  const paid = installmentPaidCents(installment),
    open = installmentOpenCents(installment);
  if (installment.canceledAt) return "CANCELED";
  if (open === 0) return "PAID";
  if (paid > 0) return "PARTIALLY_PAID";
  if (installment.dueDate < today) return "OVERDUE";
  return "PENDING";
}
export const transactionPaidCents = (transaction: FinancialTransaction) =>
  transaction.installments.reduce((sum, item) => sum + installmentPaidCents(item), 0);
export const transactionOpenCents = (transaction: FinancialTransaction) =>
  transaction.installments.reduce((sum, item) => sum + installmentOpenCents(item), 0);
export function transactionStatus(
  transaction: FinancialTransaction,
  today = new Date().toISOString().slice(0, 10),
): FinancialStatus {
  if (transaction.canceledAt) return "CANCELED";
  const paid = transactionPaidCents(transaction),
    open = transactionOpenCents(transaction);
  if (open === 0 && paid > 0) return "PAID";
  if (paid > 0 && open > 0) return "PARTIALLY_PAID";
  if (
    transaction.installments.some((item) => installmentStatus(item, today) === "OVERDUE")
  )
    return "OVERDUE";
  if (
    transaction.installments.length &&
    transaction.installments.every((item) => item.canceledAt)
  )
    return "CANCELED";
  return "PENDING";
}
export const nextOpenInstallment = (transaction: FinancialTransaction) =>
  transaction.installments
    .filter((item) => installmentOpenCents(item) > 0)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
