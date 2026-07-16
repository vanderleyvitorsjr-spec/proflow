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
