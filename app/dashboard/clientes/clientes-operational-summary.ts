"use client";

import { equipmentStorageAdapter } from "@/app/dashboard/_equipamentos/equipamentos-storage-adapter";
import { ordensStorageAdapter } from "@/app/dashboard/_ordens/ordens-storage-adapter";
import { financialStorageAdapter } from "@/app/dashboard/financeiro/financeiro-storage-adapter";
import { transactionOpenCents } from "@/app/dashboard/financeiro/financeiro-status";

import type { ClientRecord } from "./clientes-data";

function receivedFromClient(
  state: Awaited<ReturnType<typeof financialStorageAdapter.read>>,
  clientId: string,
) {
  return state.transactions.reduce((total, transaction) => {
    if (
      transaction.archivedAt ||
      transaction.canceledAt ||
      transaction.direction !== "INCOME" ||
      transaction.clientId !== clientId
    ) return total;

    if (transaction.kind === "REALIZED") return total + transaction.totalCents;

    return total + transaction.installments.reduce(
      (installmentsTotal, installment) =>
        installment.canceledAt
          ? installmentsTotal
          : installmentsTotal + installment.payments.reduce(
              (paymentsTotal, payment) =>
                paymentsTotal + (payment.reversedAt ? 0 : payment.amountCents),
              0,
            ),
      0,
    );
  }, 0);
}

function openReceivablesForClient(
  state: Awaited<ReturnType<typeof financialStorageAdapter.read>>,
  clientId: string,
) {
  return state.transactions.reduce(
    (total, transaction) =>
      !transaction.archivedAt &&
      !transaction.canceledAt &&
      transaction.kind === "RECEIVABLE" &&
      transaction.clientId === clientId
        ? total + transactionOpenCents(transaction)
        : total,
    0,
  );
}

export async function enrichClientsWithOperationalData(records: ClientRecord[]) {
  const [financial, orders, equipment] = await Promise.all([
    financialStorageAdapter.read(),
    ordensStorageAdapter.list(),
    equipmentStorageAdapter.read(),
  ]);

  return records.map((client) => {
    const activeOrders = orders.filter(
      (order) =>
        order.clientId === client.id &&
        !order.archivedAt &&
        !order.canceledAt &&
        !["COMPLETED", "CANCELED"].includes(order.status),
    ).length;
    const installedEquipment = equipment.assets.filter(
      (asset) =>
        asset.clientId === client.id &&
        asset.ownership === "CUSTOMER" &&
        !asset.archivedAt,
    ).length;
    const receivedCents = receivedFromClient(financial, client.id);
    const pendingCents = openReceivablesForClient(financial, client.id);

    return {
      ...client,
      activeServiceOrders: activeOrders,
      installedEquipment,
      lifetimeValue: receivedCents / 100,
      pendingAmount: pendingCents / 100,
    } satisfies ClientRecord;
  });
}

export async function enrichClientWithOperationalData(record: ClientRecord) {
  const [enriched] = await enrichClientsWithOperationalData([record]);
  return enriched;
}
