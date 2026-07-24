import type {
  ReportFinancialSource,
  ReportFinancialTransaction,
} from "@/lib/contracts/relatorios-financeiro.contract";

export type CashProjectionWindow = {
  days: 30 | 60 | 90;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
};

export type CashProjection = {
  referenceDate: string;
  overdueIncomeCents: number;
  overdueExpenseCents: number;
  windows: CashProjectionWindow[];
  concentration: Array<{ date: string; amountCents: number }>;
  available: boolean;
};

function openAmount(installment: ReportFinancialTransaction["installments"][number]) {
  const paid = installment.payments
    .filter((payment) => !payment.reversedAt)
    .reduce((sum, payment) => sum + payment.amountCents, 0);
  return Math.max(0, installment.amountCents - paid);
}

export function projectCashFlow(
  source: ReportFinancialSource | undefined,
  referenceDate: Date,
): CashProjection {
  const today = referenceDate.toISOString().slice(0, 10);
  if (!source)
    return {
      referenceDate: today,
      overdueIncomeCents: 0,
      overdueExpenseCents: 0,
      windows: [],
      concentration: [],
      available: false,
    };
  const entries = source.transactions
    .filter(
      (transaction) =>
        !transaction.archived &&
        !transaction.canceled &&
        (transaction.kind === "RECEIVABLE" || transaction.kind === "PAYABLE"),
    )
    .flatMap((transaction) =>
      transaction.installments
        .filter((installment) => !installment.canceled && installment.dueDate)
        .map((installment) => ({
          date: installment.dueDate,
          direction: transaction.direction,
          amountCents: openAmount(installment),
        })),
    )
    .filter((entry) => entry.amountCents > 0);
  const overdue = entries.filter((entry) => entry.date < today);
  const byDate = new Map<string, number>();
  for (const entry of entries.filter((item) => item.date >= today))
    byDate.set(entry.date, (byDate.get(entry.date) ?? 0) + entry.amountCents);
  const windows = ([30, 60, 90] as const).map((days) => {
    const end = new Date(referenceDate);
    end.setUTCDate(end.getUTCDate() + days);
    const endKey = end.toISOString().slice(0, 10);
    const eligible = entries.filter(
      (entry) => entry.date >= today && entry.date <= endKey,
    );
    const incomeCents = eligible
      .filter((entry) => entry.direction === "INCOME")
      .reduce((sum, entry) => sum + entry.amountCents, 0);
    const expenseCents = eligible
      .filter((entry) => entry.direction === "EXPENSE")
      .reduce((sum, entry) => sum + entry.amountCents, 0);
    return { days, incomeCents, expenseCents, balanceCents: incomeCents - expenseCents };
  });
  return {
    referenceDate: today,
    overdueIncomeCents: overdue
      .filter((entry) => entry.direction === "INCOME")
      .reduce((sum, entry) => sum + entry.amountCents, 0),
    overdueExpenseCents: overdue
      .filter((entry) => entry.direction === "EXPENSE")
      .reduce((sum, entry) => sum + entry.amountCents, 0),
    windows,
    concentration: [...byDate.entries()]
      .map(([date, amountCents]) => ({ date, amountCents }))
      .sort((a, b) => b.amountCents - a.amountCents)
      .slice(0, 5),
    available: true,
  };
}
