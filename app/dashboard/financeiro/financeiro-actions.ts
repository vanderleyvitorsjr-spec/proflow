import { ZodError } from "zod";
import { FinancialDomainError } from "./financeiro-errors";
import { FinancialRepository } from "./financeiro-repository";
import type { ActionResult } from "./financeiro-result";
import type {
  FinancialAccountFormValues,
  FinancialObligationFormValues,
  FinancialPaymentFormValues,
  FinancialReasonFormValues,
  FinancialTransactionFormValues,
} from "./financeiro-schema";
import { FinancialService } from "./financeiro-service";
import { financialStorageAdapter } from "./financeiro-storage-adapter";
import { financialRelationsGateway } from "./financeiro-relations-gateway";
import { reconcileTransaction } from "./financeiro-reconciliation";
import type {
  EquipmentFinancialCreateInput,
  EquipmentFinancialTransactionReference,
  StockPurchaseFinancialCreateInput,
  StockPurchaseFinancialTransactionReference,
} from "@/lib/contracts/financeiro.contract";
import type { ReportFinancialSource } from "@/lib/contracts/relatorios-financeiro.contract";
import { accountsWithBalance } from "./financeiro-selectors";
import {
  transactionOpenCents,
  transactionPaidCents,
  transactionStatus,
} from "./financeiro-status";
const service = new FinancialService(new FinancialRepository(financialStorageAdapter));
async function action<T>(operation: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await operation() };
  } catch (error) {
    if (error instanceof ZodError)
      return {
        ok: false,
        error: {
          code: "VALIDATION",
          message: error.issues[0]?.message ?? "Revise os campos.",
          fieldErrors: error.flatten().fieldErrors,
        },
      };
    if (error instanceof FinancialDomainError)
      return { ok: false, error: { code: error.code, message: error.message } };
    return {
      ok: false,
      error: {
        code: "UNKNOWN",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível concluir a operação.",
      },
    };
  }
}
export const listFinancialStateAction = () => action(() => service.listState());
export const listFinancialReportAction = () =>
  action(async (): Promise<ReportFinancialSource> => {
    const state = await service.listState();
    return {
      accounts: accountsWithBalance(state).map((account) => ({
        id: account.id, name: account.name, currentBalanceCents: account.currentBalanceCents,
        archived: Boolean(account.archivedAt),
      })),
      transactions: state.transactions.map((transaction) => ({
        id: transaction.id, title: transaction.title, nature: transaction.nature,
        direction: transaction.direction, kind: transaction.kind, category: transaction.category,
        competenceDate: transaction.competenceDate, issueDate: transaction.issueDate,
        realizedAt: transaction.realizedAt, totalCents: transaction.totalCents,
        accountId: transaction.accountId, clientId: transaction.clientId,
        customerName: transaction.customerName, serviceOrderId: transaction.serviceOrderId,
        canceled: Boolean(transaction.canceledAt), archived: Boolean(transaction.archivedAt),
        installments: transaction.installments.map((installment) => ({
          dueDate: installment.dueDate, amountCents: installment.amountCents,
          canceled: Boolean(installment.canceledAt),
          payments: installment.payments.map((payment) => ({
            amountCents: payment.amountCents, paidAt: payment.paidAt, reversedAt: payment.reversedAt,
          })),
        })),
      })),
    };
  });
export const getFinancialTransactionAction = (id: string) =>
  action(() => service.getTransaction(id));
export const createFinancialAccountAction = (input: FinancialAccountFormValues) =>
  action(() => service.createAccount(input));
export const updateFinancialAccountAction = (
  id: string,
  input: FinancialAccountFormValues,
) => action(() => service.updateAccount(id, input));
export const setDefaultFinancialAccountAction = (id: string) =>
  action(() => service.setDefaultAccount(id));
export const archiveFinancialAccountAction = (id: string, confirmed: boolean) =>
  action(() => service.archiveAccount(id, confirmed));
export const createFinancialTransactionAction = (input: FinancialTransactionFormValues) =>
  action(() => service.createTransaction(input));
export const updateFinancialTransactionAction = (
  id: string,
  input: FinancialTransactionFormValues,
) => action(() => service.updateTransaction(id, input));
export const duplicateFinancialTransactionAction = (id: string) =>
  action(() => service.duplicateTransaction(id));
export const archiveFinancialTransactionAction = (id: string) =>
  action(() => service.archiveTransaction(id));
export const createFinancialObligationAction = (
  kind: "RECEIVABLE" | "PAYABLE",
  input: FinancialObligationFormValues,
) =>
  action(async () => {
    if (kind === "RECEIVABLE" && input.clientId) {
      const client = await financialRelationsGateway.requireClient(input.clientId);
      return service.createObligation(kind, input, {
        clientId: client.id,
        clientNameSnapshot: client.name,
        customerName: client.name,
      });
    }
    return service.createObligation(kind, input);
  });
export const addFinancialPaymentAction = (
  transactionId: string,
  installmentId: string,
  input: FinancialPaymentFormValues,
) => action(() => service.addPayment(transactionId, installmentId, input));
export const cancelFinancialTransactionAction = (
  id: string,
  input: FinancialReasonFormValues,
) => action(() => service.cancelTransaction(id, input));
export const cancelFinancialInstallmentAction = (
  transactionId: string,
  installmentId: string,
  input: FinancialReasonFormValues,
) => action(() => service.cancelInstallment(transactionId, installmentId, input));
export const reverseFinancialPaymentAction = (
  transactionId: string,
  installmentId: string,
  paymentId: string,
  input: FinancialReasonFormValues,
) => action(() => service.reversePayment(transactionId, installmentId, paymentId, input));

export const listFinancialRelationsAction = () =>
  action(async () => ({
    clients: await financialRelationsGateway.listClients(),
    orders: await financialRelationsGateway.listOrders(),
  }));
const moneyInput = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");
export const createServiceOrderReceivableAction = (
  orderId: string,
  input: FinancialObligationFormValues,
) =>
  action(async () => {
    const state = await service.listState(),
      key = `SERVICE_ORDER:${orderId}:RECEIVABLE:MAIN`,
      existing = state.transactions.find(
        (item) => item.idempotencyKey === key && !item.archivedAt,
      );
    if (existing) return { transaction: existing, existing: true };
    const order = await financialRelationsGateway.requireEligibleOrder(orderId);
    const transaction = await service.createObligation(
      "RECEIVABLE",
      {
        ...input,
        total: moneyInput(order.estimatedValueCents),
        clientId: order.client.id,
        customerName: order.client.name,
      },
      {
        source: "SERVICE_ORDER",
        sourceId: order.id,
        clientId: order.client.id,
        clientNameSnapshot: order.client.name,
        customerName: order.client.name,
        serviceOrderId: order.id,
        serviceOrderNumberSnapshot: order.number,
        serviceOrderTitleSnapshot: order.title,
        serviceOrderValueSnapshotCents: order.estimatedValueCents,
        serviceOrderUpdatedAtSnapshot: order.updatedAt,
        purpose: "MAIN",
        idempotencyKey: key,
        manuallyModified: false,
      },
    );
    return { transaction, existing: false };
  });
export const listFinancialDivergencesAction = () =>
  action(async () => {
    const state = await service.listState(),
      linked = state.transactions.filter(
        (item) => item.serviceOrderId && !item.archivedAt && item.purpose === "MAIN",
      ),
      result = [];
    for (const transaction of linked) {
      const group = state.transactions.filter(
          (item) =>
            item.serviceOrderId === transaction.serviceOrderId &&
            !item.archivedAt &&
            !item.canceledAt,
        ),
        divergence = reconcileTransaction(
          transaction,
          await financialRelationsGateway.getOrder(transaction.serviceOrderId!),
        );
      divergence.issuedCents = group.reduce((sum, item) => sum + item.totalCents, 0);
      divergence.paidCents = group.reduce(
        (sum, item) =>
          sum +
          item.installments
            .flatMap((part) => part.payments)
            .filter((payment) => !payment.reversedAt)
            .reduce((value, payment) => value + payment.amountCents, 0),
        0,
      );
      divergence.openCents = group.reduce(
        (sum, item) =>
          sum +
          item.installments
            .filter((part) => !part.canceledAt)
            .reduce(
              (value, part) =>
                value +
                Math.max(
                  0,
                  part.amountCents -
                    part.payments
                      .filter((payment) => !payment.reversedAt)
                      .reduce((paid, payment) => paid + payment.amountCents, 0),
                ),
              0,
            ),
        0,
      );
      divergence.differenceCents =
        divergence.currentOrderValueCents - divergence.issuedCents;
      if (
        ["ORDER_VALUE_INCREASED", "ORDER_VALUE_DECREASED", "MATCHED"].includes(
          divergence.status,
        )
      )
        divergence.status =
          divergence.differenceCents > 0
            ? "ORDER_VALUE_INCREASED"
            : divergence.differenceCents < 0
              ? "ORDER_VALUE_DECREASED"
              : "MATCHED";
      result.push(divergence);
    }
    return result;
  });
export const createFinancialComplementAction = (
  transactionId: string,
  input: FinancialObligationFormValues,
) =>
  action(async () => {
    const current = await service.getTransaction(transactionId);
    if (!current?.serviceOrderId) throw new Error("Recebível sem Ordem vinculada.");
    const order = await financialRelationsGateway.requireEligibleOrder(
        current.serviceOrderId,
      ),
      state = await service.listState(),
      issued = state.transactions
        .filter(
          (item) =>
            item.serviceOrderId === order.id && !item.archivedAt && !item.canceledAt,
        )
        .reduce((sum, item) => sum + item.totalCents, 0),
      difference = order.estimatedValueCents - issued;
    if (difference <= 0)
      throw new Error("Não existe diferença positiva para complementar.");
    const sequence =
        state.transactions.filter(
          (item) =>
            item.serviceOrderId === order.id && item.purpose?.startsWith("ADDITIONAL:"),
        ).length + 1,
      purpose = `ADDITIONAL:${sequence}`,
      key = `SERVICE_ORDER:${order.id}:RECEIVABLE:${purpose}`;
    const transaction = await service.createObligation(
      "RECEIVABLE",
      {
        ...input,
        total: moneyInput(difference),
        clientId: order.client.id,
        customerName: order.client.name,
      },
      {
        source: "SERVICE_ORDER",
        sourceId: order.id,
        clientId: order.client.id,
        clientNameSnapshot: order.client.name,
        customerName: order.client.name,
        serviceOrderId: order.id,
        serviceOrderNumberSnapshot: order.number,
        serviceOrderTitleSnapshot: order.title,
        serviceOrderValueSnapshotCents: order.estimatedValueCents,
        serviceOrderUpdatedAtSnapshot: order.updatedAt,
        purpose,
        idempotencyKey: key,
        manuallyModified: false,
      },
    );
    await service.reviewReconciliation(current.id);
    return transaction;
  });
export const reviewFinancialReconciliationAction = (
  id: string,
  updateSnapshot: boolean,
) =>
  action(async () => {
    const current = await service.getTransaction(id);
    if (!current?.serviceOrderId) throw new Error("Recebível sem Ordem vinculada.");
    if (!updateSnapshot) return service.reviewReconciliation(id);
    const order = await financialRelationsGateway.getOrder(current.serviceOrderId);
    if (!order) throw new Error("Ordem indisponível.");
    return service.reviewReconciliation(id, {
      serviceOrderValueSnapshotCents: order.estimatedValueCents,
      serviceOrderUpdatedAtSnapshot: order.updatedAt,
    });
  });

const equipmentFinancialKey = (input: EquipmentFinancialCreateInput) =>
  `${input.source.sourceType}:${input.source.sourceId}:${input.source.purpose === "MAINTENANCE" ? "EXPENSE" : "ACQUISITION"}${input.additionalSequence ? `:ADDITIONAL:${input.additionalSequence}` : ""}`;
const equipmentFinancialReference = async (
  id: string,
): Promise<EquipmentFinancialTransactionReference> => {
  const state = await service.listState(),
    transaction = state.transactions.find((item) => item.id === id);
  if (!transaction)
    throw new FinancialDomainError("NOT_FOUND", "Lançamento financeiro não encontrado.");
  return {
    id: transaction.id,
    number: `FIN-${String(transaction.sequence).padStart(5, "0")}`,
    nature: transaction.nature === "INVESTMENT" ? "INVESTMENT" : "EXPENSE",
    totalCents: transaction.totalCents,
    paidCents: transactionPaidCents(transaction),
    openCents: transaction.kind === "REALIZED" ? 0 : transactionOpenCents(transaction),
    status:
      transaction.kind === "REALIZED"
        ? transaction.canceledAt
          ? "CANCELED"
          : "PAID"
        : transactionStatus(transaction),
    accountId: transaction.accountId,
    accountName:
      state.accounts.find((item) => item.id === transaction.accountId)?.name ??
      "Conta indisponível",
    canceled: Boolean(transaction.canceledAt),
    archived: Boolean(transaction.archivedAt),
    manuallyModified: Boolean(transaction.manuallyModified),
    updatedAt: transaction.updatedAt,
    idempotencyKey: transaction.idempotencyKey ?? "",
  };
};
export const listEquipmentFinancialAccountsAction = () =>
  action(async () =>
    (await service.listState()).accounts
      .filter((item) => !item.archivedAt)
      .map(({ id, name }) => ({ id, name })),
  );
export const getEquipmentFinancialTransactionAction = (id: string) =>
  action(() => equipmentFinancialReference(id));
export const getEquipmentFinancialSummaryAction = (sourceId: string, purpose: string) =>
  action(async () => {
    const state = await service.listState(),
      group = state.transactions.filter(
        (item) => item.sourceId === sourceId && item.purpose === purpose,
      );
    if (!group.length) return null;
    const primary =
      group.find((item) => !item.idempotencyKey?.includes(":ADDITIONAL:")) ?? group[0];
    const reference = await equipmentFinancialReference(primary.id);
    return {
      ...reference,
      totalCents: group
        .filter((item) => !item.archivedAt && !item.canceledAt)
        .reduce((sum, item) => sum + item.totalCents, 0),
      paidCents: group.reduce((sum, item) => sum + transactionPaidCents(item), 0),
      openCents: group.reduce(
        (sum, item) => sum + (item.kind === "REALIZED" ? 0 : transactionOpenCents(item)),
        0,
      ),
      canceled: Boolean(primary.canceledAt),
      archived: Boolean(primary.archivedAt),
      manuallyModified: group.some((item) => item.manuallyModified),
    };
  });
export const findEquipmentFinancialTransactionAction = (
  sourceId: string,
  purpose: string,
) =>
  action(async () => {
    const state = await service.listState();
    const transaction = state.transactions.find(
      (item) => item.sourceId === sourceId && item.purpose === purpose,
    );
    return transaction ? equipmentFinancialReference(transaction.id) : null;
  });
export const createEquipmentFinancialTransactionAction = (
  input: EquipmentFinancialCreateInput,
) =>
  action(async () => {
    const state = await service.listState(),
      key = equipmentFinancialKey(input);
    const existing = state.transactions.find((item) => item.idempotencyKey === key);
    if (existing)
      return {
        transaction: await equipmentFinancialReference(existing.id),
        existing: true,
        blocked: Boolean(existing.canceledAt || existing.archivedAt),
      };
    const transaction = await service.createObligation(
      "PAYABLE",
      {
        title: input.title,
        description: input.description,
        category: input.category,
        accountId: input.accountId,
        total: moneyInput(input.totalCents),
        issueDate: input.issueDate,
        competenceDate: input.competenceDate,
        firstDueDate: input.firstDueDate,
        installmentCount: input.installmentCount,
        supplier: input.supplier,
        customerName: "",
        clientId: "",
        notes: input.notes,
      },
      {
        nature: input.nature,
        sourceId: input.source.sourceId,
        purpose: input.source.purpose,
        idempotencyKey: key,
        manuallyModified: false,
      },
    );
    if (input.payNow)
      for (const installment of transaction.installments)
        await service.addPayment(transaction.id, installment.id, {
          amount: moneyInput(installment.amountCents),
          paidAt: input.issueDate,
          accountId: input.accountId,
          method: input.paymentMethod || "Transferência",
          notes: "Pagamento confirmado na integração com Equipamentos.",
          reference: key,
        });
    return {
      transaction: await equipmentFinancialReference(transaction.id),
      existing: false,
      blocked: false,
    };
  });
export const cancelEquipmentFinancialOpenBalanceAction = (id: string, reason: string) =>
  action(async () => {
    let current = await service.getTransaction(id);
    if (!current)
      throw new FinancialDomainError(
        "NOT_FOUND",
        "Lançamento financeiro não encontrado.",
      );
    for (const installment of current.installments) {
      const paid = installment.payments
        .filter((item) => !item.reversedAt)
        .reduce((sum, item) => sum + item.amountCents, 0);
      if (!installment.canceledAt && installment.amountCents > paid) {
        if (paid > 0)
          throw new FinancialDomainError(
            "CONFLICT",
            "Existe parcela parcialmente paga. Use o fluxo financeiro para tratar o saldo sem apagar pagamentos.",
          );
        current = await service.cancelInstallment(id, installment.id, { reason });
      }
    }
    return equipmentFinancialReference(current.id);
  });
const stockPurchaseFinancialReference = (
  id: string,
): Promise<StockPurchaseFinancialTransactionReference> => equipmentFinancialReference(id);
const stockPurchaseKey = (input: StockPurchaseFinancialCreateInput) =>
  `STOCK_PURCHASE:${input.source.purchaseId}:PAYABLE${input.additionalSequence ? `:ADDITIONAL:${input.additionalSequence}` : ""}`;
export const listStockPurchaseFinancialAccountsAction = () =>
  listEquipmentFinancialAccountsAction();
export const getStockPurchaseFinancialTransactionAction = (id: string) =>
  action(() => stockPurchaseFinancialReference(id));
export const getStockPurchaseFinancialSummaryAction = (purchaseId: string) =>
  action(async () => {
    const state = await service.listState(),
      group = state.transactions.filter(
        (item) => item.sourceId === purchaseId && item.purpose === "PAYABLE",
      );
    if (!group.length) return null;
    const primary =
        group.find((item) => !item.idempotencyKey?.includes(":ADDITIONAL:")) ?? group[0],
      reference = await stockPurchaseFinancialReference(primary.id);
    return {
      ...reference,
      totalCents: group
        .filter((item) => !item.archivedAt && !item.canceledAt)
        .reduce((s, i) => s + i.totalCents, 0),
      paidCents: group.reduce((s, i) => s + transactionPaidCents(i), 0),
      openCents: group.reduce(
        (s, i) => s + (i.kind === "REALIZED" ? 0 : transactionOpenCents(i)),
        0,
      ),
      canceled: Boolean(primary.canceledAt),
      archived: Boolean(primary.archivedAt),
      manuallyModified: group.some((i) => i.manuallyModified),
    };
  });
export const createStockPurchaseFinancialTransactionAction = (
  input: StockPurchaseFinancialCreateInput,
) =>
  action(async () => {
    const state = await service.listState(),
      key = stockPurchaseKey(input),
      existing = state.transactions.find((item) => item.idempotencyKey === key);
    if (existing)
      return {
        transaction: await stockPurchaseFinancialReference(existing.id),
        existing: true,
        blocked: Boolean(existing.canceledAt || existing.archivedAt),
      };
    const transaction = await service.createObligation(
      "PAYABLE",
      {
        title: input.title,
        description: input.description,
        category: "Compra de estoque",
        accountId: input.accountId,
        total: moneyInput(input.totalCents),
        issueDate: input.issueDate,
        competenceDate: input.competenceDate,
        firstDueDate: input.firstDueDate,
        installmentCount: input.installmentCount,
        supplier: input.supplier,
        customerName: "",
        clientId: "",
        notes: input.notes,
      },
      {
        nature: "EXPENSE",
        sourceId: input.source.purchaseId,
        purpose: "PAYABLE",
        idempotencyKey: key,
        manuallyModified: false,
      },
    );
    return {
      transaction: await stockPurchaseFinancialReference(transaction.id),
      existing: false,
      blocked: false,
    };
  });
export const cancelStockPurchaseFinancialOpenBalanceAction = (
  id: string,
  reason: string,
) => cancelEquipmentFinancialOpenBalanceAction(id, reason);
