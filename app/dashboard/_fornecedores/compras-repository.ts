"use client";
import { purchasesStorageAdapter } from "./compras-storage-adapter";
import type { PurchaseOrder, PurchaseQuotation, PurchasesEnvelope } from "./compras-domain";
export const purchasesRepository = {
  read: () => purchasesStorageAdapter.load(),
  save(value: PurchasesEnvelope) { purchasesStorageAdapter.save(value); return value; },
  saveQuotation(quotation: PurchaseQuotation, state: PurchasesEnvelope = purchasesStorageAdapter.load()) {
    const next = { ...state, quotations: state.quotations.some((item) => item.id === quotation.id) ? state.quotations.map((item) => item.id === quotation.id ? quotation : item) : [quotation, ...state.quotations] };
    purchasesStorageAdapter.save(next);
    return next;
  },
  saveOrder(order: PurchaseOrder, state: PurchasesEnvelope = purchasesStorageAdapter.load()) {
    const next = { ...state, orders: state.orders.some((item) => item.id === order.id) ? state.orders.map((item) => item.id === order.id ? order : item) : [order, ...state.orders] };
    purchasesStorageAdapter.save(next);
    return next;
  },
};
