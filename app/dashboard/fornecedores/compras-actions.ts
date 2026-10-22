"use client";
import { purchasesService } from "./compras-service";
import { purchasesStorageAdapter } from "./compras-storage-adapter";

// Carrega os dados do servidor antes e aguarda a gravação depois de cada ação.
async function run<T>(operation: () => T): Promise<T> {
  await purchasesStorageAdapter.ready();
  const result = operation();
  await purchasesStorageAdapter.flush();
  return result;
}
export const listPurchasesAction = () => run(() => purchasesService.list());
export const getQuotationAction = (id: string) => run(() => purchasesService.getQuotation(id));
export const getPurchaseOrderAction = (id: string) => run(() => purchasesService.getOrder(id));
export const updateQuotationAction = (id: string, changes: Parameters<typeof purchasesService.updateQuotation>[1]) => run(() => purchasesService.updateQuotation(id, changes));
export const createQuotationAction = (input: Parameters<typeof purchasesService.createQuotation>[0]) => run(() => purchasesService.createQuotation(input));
export const addQuotationSupplierAction = (quotationId: string, supplierId: string) => run(() => purchasesService.addSupplier(quotationId, supplierId));
export const addQuotationResponseAction = (quotationId: string, response: Parameters<typeof purchasesService.addResponse>[1]) => run(() => purchasesService.addResponse(quotationId, response));
export const selectQuotationResponseAction = (quotationId: string, responseId: string, reason?: string) => run(() => purchasesService.select(quotationId, responseId, reason));
export const createPurchaseOrderAction = (input: Parameters<typeof purchasesService.createOrder>[0]) => run(() => purchasesService.createOrder(input));
export const receivePurchaseOrderAction = (orderId: string, input: Parameters<typeof purchasesService.receive>[1], confirmStockMovement = false) => run(() => purchasesService.receive(orderId, input, confirmStockMovement));
export const createOrdersFromQuotationAction = (quotationId: string) => run(() => purchasesService.createOrdersFromQuotation(quotationId));
export const markPurchaseOrderSentAction = (id: string) => run(() => purchasesService.markOrderSent(id));
