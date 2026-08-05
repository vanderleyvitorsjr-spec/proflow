export type PurchaseUnit = "UNIT" | "METER" | "KILOGRAM" | "LITER" | "BOX" | "ROLL" | "PAIR" | "SET" | "OTHER";
export type QuotationStatus = "DRAFT" | "OPEN" | "WAITING_RESPONSES" | "ANALYSIS" | "APPROVED" | "CANCELED" | "CLOSED";
export type PurchaseOrderStatus = "DRAFT" | "WAITING_APPROVAL" | "APPROVED" | "SENT" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELED";

export interface QuotationItem {
  id: string; materialId?: string; description: string; quantity: number; unit: PurchaseUnit;
  specification?: string; neededAt?: string; notes?: string;
}
export interface SupplierQuotationResponse {
  id: string; supplierId: string; supplierName: string; itemId: string;
  unitPriceCents: number; totalCents: number; freightCents: number; deliveryDays: number;
  paymentTerms: string; validUntil?: string; warranty?: string; notes?: string;
  markers: Array<"BEST_PRICE" | "BEST_DEADLINE" | "BEST_CONDITION" | "PREFERRED" | "SELECTED">;
  selectionReason?: string;
}
export interface PurchaseQuotation {
  id: string; number: string; title: string; responsible?: string; openedAt: string;
  responseDeadline?: string; status: QuotationStatus; items: QuotationItem[];
  invitedSupplierIds: string[]; responses: SupplierQuotationResponse[]; notes?: string;
  quoteId?: string; serviceOrderId?: string; createdAt: string; updatedAt: string;
}
export interface PurchaseOrderItem {
  id: string; materialId?: string; description: string; orderedQuantity: number;
  receivedQuantity: number; refusedQuantity: number; unit: PurchaseUnit; unitPriceCents: number; totalCents: number;
}
export interface PurchaseReceipt {
  id: string; orderId: string; itemId: string; receivedQuantity: number; refusedQuantity: number;
  condition: "ACCEPTED" | "DIVERGENT" | "REFUSED"; divergence?: string; notes?: string;
  responsible: string; receivedAt: string; stockMovementConfirmed: boolean; idempotencyKey: string;
}
export interface PurchaseOrder {
  id: string; number: string; supplierId: string; supplierName: string; responsible?: string;
  date: string; expectedDeliveryAt?: string; status: PurchaseOrderStatus; items: PurchaseOrderItem[];
  subtotalCents: number; freightCents: number; discountCents: number; totalCents: number;
  paymentTerms?: string; deliveryAddress?: string; notes?: string; serviceOrderId?: string;
  quoteId?: string; quotationId?: string; documents: string[]; receipts: PurchaseReceipt[];
  sentManuallyAt?: string; createdAt: string; updatedAt: string;
}
export interface PurchasesEnvelope {
  version: 1; nextQuotationSequence: number; nextOrderSequence: number;
  quotations: PurchaseQuotation[]; orders: PurchaseOrder[];
}
export const emptyPurchases = (): PurchasesEnvelope => ({ version: 1, nextQuotationSequence: 1, nextOrderSequence: 1, quotations: [], orders: [] });
export const quotationNumber = (sequence: number, year = new Date().getFullYear()) => `COT-${year}-${String(sequence).padStart(5, "0")}`;
export const purchaseOrderNumber = (sequence: number, year = new Date().getFullYear()) => `PC-${year}-${String(sequence).padStart(5, "0")}`;

export function compareQuotation(responses: SupplierQuotationResponse[]) {
  const valid = responses.filter((item) => item.totalCents >= 0);
  const minimumPrice = valid.length ? Math.min(...valid.map((item) => item.totalCents + item.freightCents)) : 0;
  const minimumDeadline = valid.length ? Math.min(...valid.map((item) => item.deliveryDays)) : 0;
  return valid.map((item) => ({ ...item, isLowestPrice: item.totalCents + item.freightCents === minimumPrice, isFastest: item.deliveryDays === minimumDeadline }));
}

export function selectQuotationResponse(responses: SupplierQuotationResponse[], responseId: string, reason?: string) {
  const comparison = compareQuotation(responses), selected = comparison.find((item) => item.id === responseId);
  if (!selected) throw new Error("Resposta do fornecedor não encontrada.");
  if (!selected.isLowestPrice && !reason?.trim()) throw new Error("Informe a justificativa para escolher uma proposta que não possui o menor preço.");
  return responses.map((item) => ({ ...item, markers: item.id === responseId ? [...new Set([...item.markers.filter((marker) => marker !== "SELECTED"), "SELECTED" as const])] : item.markers.filter((marker) => marker !== "SELECTED"), selectionReason: item.id === responseId ? reason : item.selectionReason }));
}
