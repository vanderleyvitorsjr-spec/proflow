import {
  installmentOpenCents,
  installmentStatus,
  transactionOpenCents,
  transactionPaidCents,
} from "./financeiro-status";
import type {
  FinancialAccount,
  FinancialAccountWithBalance,
  FinancialStorageState,
  FinancialTransaction,
  FinancialTransactionView,
} from "./financeiro-types";
export function realizedMovements(transaction: FinancialTransaction) {
  if (transaction.archivedAt) return [];
  if (transaction.kind === "REALIZED")
    return transaction.canceledAt
      ? []
      : [
          {
            accountId: transaction.accountId,
            date: transaction.realizedAt,
            amountCents:
              transaction.direction === "INCOME"
                ? transaction.totalCents
                : -transaction.totalCents,
          },
        ];
  return transaction.installments.flatMap((installment) =>
    installment.payments
      .filter((payment) => !payment.reversedAt)
      .map((payment) => ({
        accountId: payment.accountId,
        date: payment.paidAt,
        amountCents:
          transaction.direction === "INCOME" ? payment.amountCents : -payment.amountCents,
      })),
  );
}
export function accountsWithBalance(
  state: FinancialStorageState,
): FinancialAccountWithBalance[] {
  const movements = state.transactions.flatMap(realizedMovements);
  return state.accounts
    .filter((account) => !account.archivedAt)
    .map((account) => ({
      ...account,
      currentBalanceCents:
        account.openingBalanceCents +
        movements
          .filter((item) => item.accountId === account.id)
          .reduce((sum, item) => sum + item.amountCents, 0),
    }));
}
export function transactionsWithAccount(
  state: FinancialStorageState,
  includeArchived = false,
): FinancialTransactionView[] {
  const accounts = new Map<string, FinancialAccount>(
    state.accounts.map((item) => [item.id, item]),
  );
  return state.transactions
    .filter((item) => includeArchived || !item.archivedAt)
    .map((item) => ({
      ...item,
      accountName: accounts.get(item.accountId)?.name ?? "Conta arquivada",
    }));
}
export function financialMetrics(
  state: FinancialStorageState,
  from?: string,
  to?: string,
) {
  const tx = state.transactions.filter((item) => !item.archivedAt);
  const realized = tx
    .flatMap(realizedMovements)
    .filter((item) => (!from || item.date >= from) && (!to || item.date <= to));
  const incomeCents = realized
    .filter((item) => item.amountCents > 0)
    .reduce((sum, item) => sum + item.amountCents, 0);
  const expenseCents = Math.abs(
    realized
      .filter((item) => item.amountCents < 0)
      .reduce((sum, item) => sum + item.amountCents, 0),
  );
  const investmentCents = tx
    .filter(
      (item) =>
        item.kind === "REALIZED" &&
        item.nature === "INVESTMENT" &&
        !item.canceledAt &&
        (!from || item.realizedAt >= from) &&
        (!to || item.realizedAt <= to),
    )
    .reduce((sum, item) => sum + item.totalCents, 0);
  const receivables = tx.filter((item) => item.kind === "RECEIVABLE"),
    payables = tx.filter((item) => item.kind === "PAYABLE");
  const receivableOpenCents = receivables.reduce(
      (sum, item) => sum + transactionOpenCents(item),
      0,
    ),
    payableOpenCents = payables.reduce(
      (sum, item) => sum + transactionOpenCents(item),
      0,
    );
  const overdueReceivableCents = receivables
      .flatMap((item) => item.installments)
      .filter((item) => installmentStatus(item) === "OVERDUE")
      .reduce((sum, item) => sum + installmentOpenCents(item), 0),
    overduePayableCents = payables
      .flatMap((item) => item.installments)
      .filter((item) => installmentStatus(item) === "OVERDUE")
      .reduce((sum, item) => sum + installmentOpenCents(item), 0);
  const balances = accountsWithBalance(state);
  return {
    totalBalanceCents: balances.reduce((sum, item) => sum + item.currentBalanceCents, 0),
    incomeCents,
    expenseCents: Math.max(0, expenseCents - investmentCents),
    investmentCents,
    resultCents: incomeCents - expenseCents,
    transactionCount: tx.length,
    accounts: balances,
    transactions: tx,
    receivableOpenCents,
    payableOpenCents,
    overdueReceivableCents,
    overduePayableCents,
    receivedCents: receivables.reduce((sum, item) => sum + transactionPaidCents(item), 0),
    paidCents: payables.reduce((sum, item) => sum + transactionPaidCents(item), 0),
    predictedResultCents: receivableOpenCents - payableOpenCents,
  };
}
export function monthlyCashFlow(state: FinancialStorageState) {
  const map = new Map<
    string,
    {
      month: string;
      incomeCents: number;
      expenseCents: number;
      predictedIncomeCents: number;
      predictedExpenseCents: number;
    }
  >();
  const point = (month: string) =>
    map.get(month) ?? {
      month,
      incomeCents: 0,
      expenseCents: 0,
      predictedIncomeCents: 0,
      predictedExpenseCents: 0,
    };
  for (const transaction of state.transactions.filter((item) => !item.archivedAt)) {
    for (const movement of realizedMovements(transaction)) {
      const month = movement.date.slice(0, 7),
        current = point(month);
      if (movement.amountCents >= 0) current.incomeCents += movement.amountCents;
      else current.expenseCents += Math.abs(movement.amountCents);
      map.set(month, current);
    }
    if (transaction.kind !== "REALIZED" && !transaction.canceledAt)
      for (const installment of transaction.installments) {
        const open = installmentOpenCents(installment);
        if (!open) continue;
        const month = installment.dueDate.slice(0, 7),
          current = point(month);
        if (transaction.direction === "INCOME") current.predictedIncomeCents += open;
        else current.predictedExpenseCents += open;
        map.set(month, current);
      }
  }
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
}
