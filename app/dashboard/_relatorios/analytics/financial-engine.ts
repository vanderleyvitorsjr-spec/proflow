import type {
  ReportFinancialSource,
  ReportFinancialTransaction,
} from "@/lib/contracts/relatorios-financeiro.contract";
import type { DateRange, ReportFilter, ReportSection } from "../relatorios-types";
import { groupBy, ranking, safeRatio } from "./aggregation-engine";
import { margin, result } from "./formula-engine";
import { inPeriod, monthLabel } from "./date-engine";
import { chart, metric, monthsInRange, rankingItems, toReais } from "./report-builders";
type Totals = {
  income: number;
  expense: number;
  investment: number;
  received: number;
  paid: number;
  overdueIncome: number;
  overdueExpense: number;
  reversals: number;
};
const transactions = (source: ReportFinancialSource | undefined, filters: ReportFilter) =>
  source?.transactions.filter(
    (item) =>
      !item.archived &&
      (filters.includeArchived || !item.archived) &&
      (!filters.financialAccount || item.accountId === filters.financialAccount) &&
      (!filters.financialNature || item.nature === filters.financialNature) &&
      (!filters.clientId || item.clientId === filters.clientId),
  );
function totals(
  items: ReportFinancialTransaction[] | undefined,
  period: DateRange,
): Totals | undefined {
  if (!items) return undefined;
  const total: Totals = {
    income: 0,
    expense: 0,
    investment: 0,
    received: 0,
    paid: 0,
    overdueIncome: 0,
    overdueExpense: 0,
    reversals: 0,
  };
  const today = new Date().toISOString().slice(0, 10);
  for (const item of items.filter((entry) => !entry.canceled)) {
    if (item.kind === "REALIZED" && inPeriod(item.realizedAt, period)) {
      if (item.direction === "INCOME") total.income += item.totalCents;
      else if (item.nature === "INVESTMENT") total.investment += item.totalCents;
      else total.expense += item.totalCents;
    }
    for (const installment of item.installments.filter((entry) => !entry.canceled)) {
      const paid = installment.payments
        .filter((payment) => !payment.reversedAt && inPeriod(payment.paidAt, period))
        .reduce((sum, payment) => sum + payment.amountCents, 0);
      const reversed = installment.payments
        .filter((payment) => payment.reversedAt && inPeriod(payment.reversedAt, period))
        .reduce((sum, payment) => sum + payment.amountCents, 0);
      total.reversals += reversed;
      if (item.direction === "INCOME") total.received += paid;
      else total.paid += paid;
      const allPaid = installment.payments
        .filter((payment) => !payment.reversedAt)
        .reduce((sum, payment) => sum + payment.amountCents, 0);
      if (installment.dueDate < today) {
        const open = Math.max(0, installment.amountCents - allPaid);
        if (item.direction === "INCOME") total.overdueIncome += open;
        else total.overdueExpense += open;
      }
    }
  }
  total.income += total.received;
  const expensePayments = items
    .filter((item) => item.nature === "EXPENSE")
    .flatMap((item) => item.installments)
    .flatMap((item) => item.payments)
    .filter((payment) => !payment.reversedAt && inPeriod(payment.paidAt, period))
    .reduce((sum, payment) => sum + payment.amountCents, 0);
  const investmentPayments = items
    .filter((item) => item.nature === "INVESTMENT")
    .flatMap((item) => item.installments)
    .flatMap((item) => item.payments)
    .filter((payment) => !payment.reversedAt && inPeriod(payment.paidAt, period))
    .reduce((sum, payment) => sum + payment.amountCents, 0);
  total.expense += expensePayments;
  total.investment += investmentPayments;
  return total;
}
export function financialSection(
  source: ReportFinancialSource | undefined,
  period: DateRange,
  previous: DateRange | undefined,
  filters: ReportFilter,
): ReportSection {
  const items = transactions(source, filters),
    current = totals(items, period),
    prev = previous ? totals(items, previous) : undefined;
  const realized = current && result(current.income, current.expense, current.investment),
    prevResult = prev && result(prev.income, prev.expense, prev.investment);
  const predictedIncome =
    items
      ?.filter((item) => item.kind === "RECEIVABLE" && !item.canceled)
      .reduce(
        (sum, item) =>
          sum +
          item.installments.reduce(
            (value, installment) =>
              value +
              Math.max(
                0,
                installment.amountCents -
                  installment.payments
                    .filter((payment) => !payment.reversedAt)
                    .reduce((paid, payment) => paid + payment.amountCents, 0),
              ),
            0,
          ),
        0,
      ) ?? 0;
  const predictedExpense =
    items
      ?.filter((item) => item.kind === "PAYABLE" && !item.canceled)
      .reduce(
        (sum, item) =>
          sum +
          item.installments.reduce(
            (value, installment) =>
              value +
              Math.max(
                0,
                installment.amountCents -
                  installment.payments
                    .filter((payment) => !payment.reversedAt)
                    .reduce((paid, payment) => paid + payment.amountCents, 0),
              ),
            0,
          ),
        0,
      ) ?? 0;
  const months = monthsInRange(period);
  const monthTotals = months.map((month) =>
    totals(items, { start: `${month}-01`, end: `${month}-31` }),
  );
  return {
    area: "FINANCIAL",
    title: "Financeiro",
    description:
      "Caixa realizado, obrigações previstas e vencimentos sem dupla contagem.",
    metrics: [
      metric({
        id: "balance",
        title: "Saldo total",
        current: toReais(
          source?.accounts
            .filter((item) => !item.archived)
            .reduce((sum, item) => sum + item.currentBalanceCents, 0),
        ),
        format: "currency",
        source: ["FINANCIAL"],
        description: "Saldo atual consolidado das contas.",
        link: "/dashboard/financeiro",
      }),
      metric({
        id: "realized-income",
        title: "Receitas realizadas",
        current: current && current.income / 100,
        previous: prev && prev.income / 100,
        format: "currency",
        source: ["FINANCIAL"],
        description: "Receitas realizadas ou recebidas no período.",
      }),
      metric({
        id: "realized-expense",
        title: "Despesas realizadas",
        current: current && current.expense / 100,
        previous: prev && prev.expense / 100,
        format: "currency",
        inverse: true,
        source: ["FINANCIAL"],
        description: "Despesas realizadas ou pagas, sem investimentos.",
      }),
      metric({
        id: "realized-investment",
        title: "Investimentos",
        current: current && current.investment / 100,
        previous: prev && prev.investment / 100,
        format: "currency",
        source: ["FINANCIAL"],
        description: "Investimentos realizados ou pagos.",
      }),
      metric({
        id: "realized-result",
        title: "Resultado realizado",
        current: realized === undefined ? undefined : realized / 100,
        previous: prevResult === undefined ? undefined : prevResult / 100,
        format: "currency",
        source: ["FINANCIAL"],
        description: "Receitas recebidas − despesas pagas − investimentos pagos.",
      }),
      metric({
        id: "predicted-result",
        title: "Resultado previsto",
        current: items ? (predictedIncome - predictedExpense) / 100 : undefined,
        format: "currency",
        source: ["FINANCIAL"],
        description: "Saldo aberto a receber − saldo aberto a pagar.",
      }),
      metric({
        id: "overdue-income",
        title: "Vencido a receber",
        current: current && current.overdueIncome / 100,
        format: "currency",
        inverse: true,
        source: ["FINANCIAL"],
        description: "Saldo vencido ainda não recebido.",
      }),
      metric({
        id: "delinquency",
        title: "Inadimplência",
        current: current
          ? (safeRatio(current.overdueIncome, current.overdueIncome + current.received) ??
              0) * 100
          : undefined,
        format: "percentage",
        inverse: true,
        source: ["FINANCIAL"],
        description: "Vencido ÷ (vencido + recebido elegível).",
      }),
      metric({
        id: "financial-margin",
        title: "Margem financeira",
        current: current ? margin(realized, current.income) : undefined,
        previous: prev ? margin(prevResult, prev.income) : undefined,
        format: "percentage",
        source: ["FINANCIAL"],
        description: "Resultado realizado ÷ receitas realizadas.",
      }),
      metric({
        id: "reversals",
        title: "Estornos",
        current: current && current.reversals / 100,
        format: "currency",
        inverse: true,
        source: ["FINANCIAL"],
        description: "Pagamentos revertidos no período.",
      }),
    ],
    charts: [
      chart(
        "cash-flow",
        "Fluxo de caixa realizado",
        months.map(monthLabel),
        [
          {
            name: "Receitas",
            values: monthTotals.map((item) => (item?.income ?? 0) / 100),
          },
          {
            name: "Despesas",
            values: monthTotals.map(
              (item) => ((item?.expense ?? 0) + (item?.investment ?? 0)) / 100,
            ),
          },
        ],
        "currency",
        ["FINANCIAL"],
        !source,
      ),
    ],
    rankings: [
      {
        id: "expense-category",
        title: "Despesas por categoria",
        items: rankingItems(
          ranking(
            Object.fromEntries(
              [
                ...groupBy(
                  items?.filter((item) => item.direction === "EXPENSE") ?? [],
                  (item) => item.category,
                ),
              ].map(([key, values]) => [
                key,
                values.reduce((sum, item) => sum + item.totalCents / 100, 0),
              ]),
            ),
          ),
          "currency",
          "/dashboard/financeiro",
        ),
      },
      {
        id: "receipts-client",
        title: "Recebimentos por cliente",
        items: rankingItems(
          ranking(
            Object.fromEntries(
              [
                ...groupBy(
                  items?.filter((item) => item.direction === "INCOME") ?? [],
                  (item) => item.customerName ?? "Não informado",
                ),
              ].map(([key, values]) => [
                key,
                values.reduce((sum, item) => sum + item.totalCents / 100, 0),
              ]),
            ),
          ),
          "currency",
          "/dashboard/financeiro",
        ),
      },
      {
        id: "accounts",
        title: "Contas e saldos",
        items: rankingItems(
          source?.accounts
            .filter((item) => !item.archived)
            .map(
              (item) => [item.name, item.currentBalanceCents / 100] as [string, number],
            )
            .sort((a, b) => b[1] - a[1]) ?? [],
          "currency",
          "/dashboard/financeiro",
        ),
      },
    ],
  };
}
