"use client";

import { quotesService } from "./orcamentos-service";
import { createOrdemAction } from "@/app/dashboard/ordens/ordens-actions";
import { validateQuoteConversion } from "./orcamentos-domain";
export const listQuotesAction = (filters?: Parameters<typeof quotesService.list>[0]) => Promise.resolve(quotesService.list(filters));
export const getQuoteAction = (id: string) => Promise.resolve(quotesService.get(id));
export const createQuoteAction = (input: Parameters<typeof quotesService.create>[0]) => Promise.resolve(quotesService.create(input));
export const updateQuoteAction = (id: string, changes: Parameters<typeof quotesService.update>[1]) => Promise.resolve(quotesService.update(id, changes));
export const duplicateQuoteAction = (id: string) => Promise.resolve(quotesService.duplicate(id));
export const newQuoteVersionAction = (id: string) => Promise.resolve(quotesService.newVersion(id));
export const transitionQuoteAction = (id: string, status: Parameters<typeof quotesService.transition>[1], details?: string) => Promise.resolve(quotesService.transition(id, status, details));
export const duplicateQuoteItemAction = (id: string, itemId: string) => Promise.resolve(quotesService.duplicateItem(id, itemId));
export const removeQuoteItemAction = (id: string, itemId: string) => Promise.resolve(quotesService.removeItem(id, itemId));
export const reorderQuoteItemAction = (id: string, itemId: string, direction: -1 | 1) => Promise.resolve(quotesService.reorderItem(id, itemId, direction));

export const convertQuoteToOrderAction = async (
  quoteId: string,
  input: {
    priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    scheduledDate: string;
    scheduledTime: string;
    estimatedDurationMinutes: number;
    checklistText: string;
  },
) => {
  const quote = quotesService.get(quoteId);
  const missing = validateQuoteConversion(quote);
  if (missing.length) throw new Error(`Preencha os seguintes dados antes de converter: ${missing.join(", ")}.`);
  const order = await createOrdemAction({
    clientId: quote.clientId, crmLeadId: "", title: quote.title,
    description: quote.description || quote.customerNotes || quote.title,
    category: quote.serviceType!, priority: input.priority, status: "OPEN",
    technician: quote.responsible!, address: quote.address!, city: quote.city || "Não Informada",
    state: quote.state || "BA", scheduledDate: input.scheduledDate,
    scheduledTime: input.scheduledTime, estimatedDurationMinutes: input.estimatedDurationMinutes,
    estimatedValue: quote.totalCents / 100, notes: `Origem: ${quote.number}. ${quote.internalNotes ?? ""}`.trim(),
    checklistText: input.checklistText || "Confirmar execução do serviço",
    equipmentText: quote.equipmentDescription ?? "",
    materialsText: quote.items.filter((item) => item.category === "MATERIAL").map((item) => item.description).join("\n"),
  });
  quotesService.linkOrder(quoteId, order.id, order.orderNumber);
  return { quote: quotesService.get(quoteId), order };
};
