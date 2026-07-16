"use client";
import { StockRepository } from "./estoque-repository";
import type {
  StockItemFormValues,
  StockMovementFormValues,
  StockReservationFormValues,
  StockReservationOperationValues,
  StockPurchaseFinancialFormValues,
  StockPurchaseFormValues,
  StockPurchaseReceiptValues,
} from "./estoque-schema";
import { StockService, stockError } from "./estoque-service";
import { stockStorageAdapter } from "./estoque-storage-adapter";
import type { StockActionResult } from "./estoque-result";
import type { StockPreferences } from "./estoque-types";
const service = new StockService(new StockRepository(stockStorageAdapter));
async function action<T>(work: () => Promise<T>): Promise<StockActionResult<T>> {
  try {
    return { ok: true, data: await work() };
  } catch (cause) {
    const error = stockError(cause);
    const fieldErrors =
      "fieldErrors" in error
        ? (error.fieldErrors as Record<string, string[]> | undefined)
        : undefined;
    return {
      ok: false,
      error: {
        code: "code" in error ? String(error.code) : "UNKNOWN",
        message: error.message,
        fieldErrors,
      },
    };
  }
}
export const listStockAction = () => action(() => service.list());
export const getStockItemAction = (id: string) => action(() => service.get(id));
export const createStockItemAction = (input: StockItemFormValues) =>
  action(() => service.create(input));
export const updateStockItemAction = (id: string, input: StockItemFormValues) =>
  action(() => service.update(id, input));
export const archiveStockItemAction = (id: string, reason: string) =>
  action(() => service.archive(id, reason));
export const createStockMovementAction = (input: StockMovementFormValues) =>
  action(() => service.createMovement(input));
export const cancelStockMovementAction = (id: string, reason: string) =>
  action(() => service.cancelMovement(id, reason));
export const getStockPreferencesAction = () =>
  action(async () => (await service.state()).preferences);
export const saveStockPreferencesAction = (preferences: StockPreferences) =>
  action(() => service.savePreferences(preferences));
export const recoverStockBackupAction = () => action(() => service.recoverBackup());
export const listStockOrdersAction = () => action(() => service.listOrders());
export const createStockReservationAction = (input: StockReservationFormValues) =>
  action(() => service.createReservation(input));
export const consumeStockReservationAction = (input: StockReservationOperationValues) =>
  action(() => service.consumeReservation(input));
export const releaseStockReservationAction = (input: StockReservationOperationValues) =>
  action(() => service.releaseReservation(input));
export const returnStockConsumptionAction = (
  movementId: string,
  quantity: number,
  reason: string,
) => action(() => service.returnConsumption(movementId, quantity, reason));
export const getStockReservationDivergenceAction = (id: string) =>
  action(async () => {
    const state = await service.state(),
      reservation = state.reservations.find((item) => item.id === id);
    return reservation ? service.reservationDivergence(reservation) : null;
  });
export const reviewStockReservationAction = (
  id: string,
  notes: string,
  updateSnapshot: boolean,
) => action(() => service.reviewReservation(id, notes, updateSnapshot));
export const listStockPurchasesAction = () => action(() => service.listPurchases());
export const getStockPurchaseAction = (id: string) =>
  action(() => service.getPurchase(id));
export const createStockPurchaseAction = (input: StockPurchaseFormValues) =>
  action(() => service.createPurchase(input));
export const updateStockPurchaseAction = (id: string, input: StockPurchaseFormValues) =>
  action(() => service.updatePurchase(id, input));
export const confirmStockPurchaseAction = (id: string) =>
  action(() => service.confirmPurchase(id));
export const receiveStockPurchaseAction = (input: StockPurchaseReceiptValues) =>
  action(() => service.receivePurchase(input));
export const returnStockPurchaseReceiptAction = (
  movementId: string,
  quantity: number,
  reason: string,
) => action(() => service.returnPurchaseReceipt(movementId, quantity, reason));
export const cancelStockPurchaseAction = (id: string, reason: string) =>
  action(() => service.cancelPurchase(id, reason));
export const archiveStockPurchaseAction = (id: string, reason: string) =>
  action(() => service.archivePurchase(id, reason));
export const listStockPurchaseFinancialAccountsAction = () =>
  action(() => service.listPurchaseFinancialAccounts());
export const createStockPurchaseFinancialAction = (
  id: string,
  input: StockPurchaseFinancialFormValues,
  additionalSequence?: number,
) => action(() => service.createPurchaseFinancial(id, input, additionalSequence));
export const getStockPurchaseReconciliationAction = (id: string) =>
  action(() => service.purchaseReconciliation(id));
export const reviewStockPurchaseReconciliationAction = (id: string, notes: string) =>
  action(() => service.reviewPurchaseReconciliation(id, notes));
export const cancelStockPurchaseOpenFinancialAction = (id: string, reason: string) =>
  action(() => service.cancelPurchaseOpenFinancial(id, reason));
