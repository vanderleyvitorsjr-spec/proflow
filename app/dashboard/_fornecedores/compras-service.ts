"use client";
import { compareQuotation, purchaseOrderNumber, quotationNumber, selectQuotationResponse, type PurchaseOrder, type PurchaseQuotation, type QuotationItem, type SupplierQuotationResponse } from "./compras-domain";
import { purchasesRepository } from "./compras-repository";
export const purchasesService = {
  list: () => purchasesRepository.read(),
  getQuotation(id: string) {
    const value = purchasesRepository.read().quotations.find((item) => item.id === id);
    if (!value) throw new Error("Cotação não encontrada.");
    return value;
  },
  getOrder(id: string) {
    const value = purchasesRepository.read().orders.find((item) => item.id === id);
    if (!value) throw new Error("Pedido de Compra não encontrado.");
    return value;
  },
  updateQuotation(id: string, changes: Partial<PurchaseQuotation>) {
    const state = purchasesRepository.read(), current = state.quotations.find((item) => item.id === id);
    if (!current) throw new Error("Cotação não encontrada.");
    const updated = { ...current, ...changes, id, number: current.number, updatedAt: new Date().toISOString() };
    purchasesRepository.saveQuotation(updated, state); return updated;
  },
  createQuotation(input: { title: string; responsible?: string; responseDeadline?: string; items?: QuotationItem[]; quoteId?: string; serviceOrderId?: string }) {
    const state = purchasesRepository.read(), now = new Date().toISOString();
    const quotation: PurchaseQuotation = { id: crypto.randomUUID(), number: quotationNumber(state.nextQuotationSequence), title: input.title.trim(), responsible: input.responsible, openedAt: now, responseDeadline: input.responseDeadline, status: "DRAFT", items: input.items ?? [], invitedSupplierIds: [], responses: [], quoteId: input.quoteId, serviceOrderId: input.serviceOrderId, createdAt: now, updatedAt: now };
    purchasesRepository.save({ ...state, nextQuotationSequence: state.nextQuotationSequence + 1, quotations: [quotation, ...state.quotations] });
    return quotation;
  },
  addSupplier(quotationId: string, supplierId: string) {
    const state = purchasesRepository.read(), current = state.quotations.find((item) => item.id === quotationId);
    if (!current) throw new Error("Cotação não encontrada.");
    const updated = { ...current, invitedSupplierIds: [...new Set([...current.invitedSupplierIds, supplierId])], updatedAt: new Date().toISOString() };
    purchasesRepository.saveQuotation(updated, state); return updated;
  },
  addResponse(quotationId: string, response: Omit<SupplierQuotationResponse, "id" | "markers">) {
    const state = purchasesRepository.read(), current = state.quotations.find((item) => item.id === quotationId);
    if (!current) throw new Error("Cotação não encontrada.");
    const updated = { ...current, status: "ANALYSIS" as const, responses: [...current.responses, { ...response, id: crypto.randomUUID(), markers: [] }], updatedAt: new Date().toISOString() };
    purchasesRepository.saveQuotation(updated, state); return updated;
  },
  compare(quotationId: string) {
    const quotation = purchasesRepository.read().quotations.find((item) => item.id === quotationId);
    if (!quotation) throw new Error("Cotação não encontrada.");
    return compareQuotation(quotation.responses);
  },
  select(quotationId: string, responseId: string, reason?: string) {
    const state = purchasesRepository.read(), current = state.quotations.find((item) => item.id === quotationId);
    if (!current) throw new Error("Cotação não encontrada.");
    const updated = { ...current, responses: selectQuotationResponse(current.responses, responseId, reason), status: "APPROVED" as const, updatedAt: new Date().toISOString() };
    purchasesRepository.saveQuotation(updated, state); return updated;
  },
  createOrder(input: { supplierId: string; supplierName: string; items: PurchaseOrder["items"]; freightCents?: number; discountCents?: number; quotationId?: string; serviceOrderId?: string; quoteId?: string }) {
    const state = purchasesRepository.read(), now = new Date().toISOString();
    const subtotalCents = input.items.reduce((sum, item) => sum + item.totalCents, 0), freightCents = input.freightCents ?? 0, discountCents = input.discountCents ?? 0;
    const order: PurchaseOrder = { id: crypto.randomUUID(), number: purchaseOrderNumber(state.nextOrderSequence), supplierId: input.supplierId, supplierName: input.supplierName, date: now, status: "DRAFT", items: input.items, subtotalCents, freightCents, discountCents, totalCents: Math.max(0, subtotalCents + freightCents - discountCents), serviceOrderId: input.serviceOrderId, quoteId: input.quoteId, quotationId: input.quotationId, documents: [], receipts: [], createdAt: now, updatedAt: now };
    purchasesRepository.save({ ...state, nextOrderSequence: state.nextOrderSequence + 1, orders: [order, ...state.orders] }); return order;
  },
  createOrdersFromQuotation(quotationId: string) {
    const quotation = this.getQuotation(quotationId);
    const selected = quotation.responses.filter((item) => item.markers.includes("SELECTED"));
    if (!selected.length) throw new Error("Selecione ao menos uma proposta antes de gerar Pedidos.");
    const bySupplier = new Map<string, SupplierQuotationResponse[]>();
    for (const response of selected) bySupplier.set(response.supplierId, [...(bySupplier.get(response.supplierId) ?? []), response]);
    return [...bySupplier.entries()].map(([supplierId, responses]) => this.createOrder({
      supplierId, supplierName: responses[0]!.supplierName, quotationId,
      serviceOrderId: quotation.serviceOrderId, quoteId: quotation.quoteId,
      items: responses.map((response) => {
        const source = quotation.items.find((item) => item.id === response.itemId);
        return { id: crypto.randomUUID(), materialId: source?.materialId, description: source?.description ?? "Item da Cotação", orderedQuantity: source?.quantity ?? 1, receivedQuantity: 0, refusedQuantity: 0, unit: source?.unit ?? "UNIT", unitPriceCents: response.unitPriceCents, totalCents: response.totalCents };
      }),
      freightCents: responses.reduce((sum, item) => sum + item.freightCents, 0),
    }));
  },
  markOrderSent(id: string) {
    const state = purchasesRepository.read(), current = state.orders.find((item) => item.id === id);
    if (!current) throw new Error("Pedido de Compra não encontrado.");
    const now = new Date().toISOString(), updated = { ...current, status: "SENT" as const, sentManuallyAt: now, updatedAt: now };
    purchasesRepository.saveOrder(updated, state); return updated;
  },
  receive(orderId: string, input: Omit<PurchaseOrder["receipts"][number], "id" | "orderId" | "receivedAt" | "stockMovementConfirmed">, confirmStockMovement = false) {
    const state = purchasesRepository.read(), current = state.orders.find((item) => item.id === orderId);
    if (!current) throw new Error("Pedido de Compra não encontrado.");
    if (current.receipts.some((item) => item.idempotencyKey === input.idempotencyKey)) throw new Error("Este recebimento já foi registrado.");
    const receipt = { ...input, id: crypto.randomUUID(), orderId, receivedAt: new Date().toISOString(), stockMovementConfirmed: confirmStockMovement };
    const items = current.items.map((item) => item.id === input.itemId ? { ...item, receivedQuantity: item.receivedQuantity + input.receivedQuantity, refusedQuantity: item.refusedQuantity + input.refusedQuantity } : item);
    const complete = items.every((item) => item.receivedQuantity >= item.orderedQuantity);
    const updated: PurchaseOrder = { ...current, items, receipts: [...current.receipts, receipt], status: complete ? "RECEIVED" : "PARTIALLY_RECEIVED", updatedAt: receipt.receivedAt };
    purchasesRepository.saveOrder(updated, state);
    return { order: updated, stockMovementPrepared: confirmStockMovement, stockMovementExecuted: false };
  },
};
