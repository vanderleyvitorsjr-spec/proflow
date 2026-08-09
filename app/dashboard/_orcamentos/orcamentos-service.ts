"use client";

import {
  calculateQuote, normalizeQuote, quoteMatchesSearch, quoteNumber,
  type ProfessionalQuote, type QuoteItem, type QuoteStatus,
} from "./orcamentos-domain";
import { quotesRepository } from "./orcamentos-repository";

const history = (type: string, description: string) => ({
  id: crypto.randomUUID(), type, description, createdAt: new Date().toISOString(),
});

export const quotesService = {
  list(filters?: { search?: string; status?: QuoteStatus; archived?: boolean }) {
    return quotesRepository.read().quotes
      .filter((quote) => filters?.archived ? Boolean(quote.archivedAt) : !quote.archivedAt)
      .filter((quote) => !filters?.status || quote.status === filters.status)
      .filter((quote) => !filters?.search || quoteMatchesSearch(quote, filters.search))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  get(id: string) {
    const quote = quotesRepository.find(id);
    if (!quote) throw new Error("Orçamento não encontrado.");
    return quote;
  },
  create(input: Pick<ProfessionalQuote, "clientId" | "clientName" | "title"> & Partial<ProfessionalQuote>) {
    const envelope = quotesRepository.read();
    const now = new Date().toISOString();
    const number = quoteNumber(envelope.nextSequence);
    if (envelope.quotes.some((quote) => quote.number === number))
      throw new Error("Já existe um orçamento com esta numeração.");
    const calculations = calculateQuote(input.items ?? []);
    const quote = normalizeQuote({
      id: crypto.randomUUID(), number, version: 1, status: "DRAFT", origin: input.origin ?? "MANUAL",
      clientId: input.clientId, clientName: input.clientName, title: input.title,
      description: input.description, responsible: input.responsible, items: input.items ?? [],
      ...calculations,
      paymentTerms: input.paymentTerms ?? { type: "CASH", dueDates: [], method: "PIX" },
      createdAt: now, updatedAt: now, history: [history("CREATED", "Orçamento criado.")],
    });
    quotesRepository.save({ ...envelope, nextSequence: envelope.nextSequence + 1, quotes: [quote, ...envelope.quotes] });
    return quote;
  },
  update(id: string, changes: Partial<ProfessionalQuote>) {
    const current = quotesRepository.find(id);
    if (!current) throw new Error("Orçamento não encontrado.");
    const items = changes.items ?? current.items;
    const calculations = calculateQuote(
      items,
      changes.discountCents ?? current.discountCents,
      changes.surchargeCents ?? current.surchargeCents,
      changes.taxCents ?? current.taxCents,
    );
    const updated = normalizeQuote({
      ...current, ...changes, items, ...calculations, number: current.number, version: current.version,
      updatedAt: new Date().toISOString(),
      history: [...current.history, history("UPDATED", "Orçamento atualizado.")],
    });
    quotesRepository.upsert(updated);
    return updated;
  },
  addItem(id: string, item: QuoteItem) {
    return this.update(id, { items: [...(quotesRepository.find(id)?.items ?? []), item] });
  },
  duplicateItem(id: string, itemId: string) {
    const quote = this.get(id), source = quote.items.find((item) => item.id === itemId);
    if (!source) throw new Error("Item não encontrado.");
    const items = [...quote.items, { ...structuredClone(source), id: crypto.randomUUID(), order: quote.items.length }];
    return this.update(id, { items });
  },
  removeItem(id: string, itemId: string) {
    const quote = this.get(id);
    return this.update(id, { items: quote.items.filter((item) => item.id !== itemId).map((item, order) => ({ ...item, order })) });
  },
  reorderItem(id: string, itemId: string, direction: -1 | 1) {
    const quote = this.get(id), index = quote.items.findIndex((item) => item.id === itemId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= quote.items.length) return quote;
    const items = [...quote.items], [moved] = items.splice(index, 1); items.splice(target, 0, moved!);
    return this.update(id, { items: items.map((item, order) => ({ ...item, order })) });
  },
  duplicate(id: string) {
    const source = quotesRepository.find(id);
    if (!source) throw new Error("Orçamento não encontrado.");
    return this.create({ ...source, title: `${source.title} — Cópia`, items: structuredClone(source.items) });
  },
  newVersion(id: string) {
    const source = quotesRepository.find(id);
    if (!source) throw new Error("Orçamento não encontrado.");
    const now = new Date().toISOString();
    const version: ProfessionalQuote = {
      ...structuredClone(source), id: crypto.randomUUID(), parentId: source.parentId ?? source.id,
      version: source.version + 1, status: "DRAFT", serviceOrderId: undefined,
      serviceOrderNumber: undefined, approvedAt: undefined, rejectedAt: undefined,
      createdAt: now, updatedAt: now,
      history: [...source.history, history("VERSION_CREATED", `Versão ${source.version + 1} criada.`)],
    };
    quotesRepository.upsert(version);
    return version;
  },
  transition(id: string, status: QuoteStatus, details?: string) {
    const current = quotesRepository.find(id);
    if (!current) throw new Error("Orçamento não encontrado.");
    if (status === "CONVERTED" && current.serviceOrderId)
      throw new Error("Este orçamento já foi convertido em Ordem.");
    const now = new Date().toISOString();
    return this.update(id, {
      status,
      approvedAt: status === "APPROVED" ? now : current.approvedAt,
      rejectedAt: status === "REJECTED" ? now : current.rejectedAt,
      rejectionReason: status === "REJECTED" ? details : current.rejectionReason,
    });
  },
  linkOrder(id: string, serviceOrderId: string, serviceOrderNumber: string) {
    const current = quotesRepository.find(id);
    if (!current) throw new Error("Orçamento não encontrado.");
    if (current.serviceOrderId) throw new Error("Este orçamento já possui uma Ordem vinculada.");
    return this.update(id, { status: "CONVERTED", serviceOrderId, serviceOrderNumber });
  },
  archive(id: string) { return this.update(id, { archivedAt: new Date().toISOString() }); },
  restore(id: string) { return this.update(id, { archivedAt: undefined }); },
};
