import {
  calculateQuote, normalizeQuote, quoteMatchesSearch, quoteNumber, validateQuoteItem,
  type ProfessionalQuote, type QuoteItem, type QuoteStatus,
} from "./orcamentos-domain";
import { quotesRepository } from "./orcamentos-repository";

const history = (type: string, description: string) => ({
  id: crypto.randomUUID(), type, description, createdAt: new Date().toISOString(),
});
const validateItems = (items: readonly QuoteItem[]) => {
  const errors = items.flatMap(validateQuoteItem);
  if (errors.length) throw new Error(errors[0]);
};

export const quotesService = {
  async list(filters?: { search?: string; status?: QuoteStatus; archived?: boolean }) {
    return (await quotesRepository.read()).quotes
      .filter((quote) => filters?.archived ? Boolean(quote.archivedAt) : !quote.archivedAt)
      .filter((quote) => !filters?.status || quote.status === filters.status)
      .filter((quote) => !filters?.search || quoteMatchesSearch(quote, filters.search))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async get(id: string) {
    const quote = await quotesRepository.find(id);
    if (!quote) throw new Error("Orçamento não encontrado.");
    return quote;
  },
  async create(input: Pick<ProfessionalQuote, "clientId" | "clientName" | "title"> & Partial<ProfessionalQuote>) {
    const envelope = await quotesRepository.read();
    const now = new Date().toISOString();
    const number = quoteNumber(envelope.nextSequence);
    if (envelope.quotes.some((quote) => quote.number === number))
      throw new Error("Já existe um orçamento com esta numeração.");
    const calculations = calculateQuote(
      input.items ?? [], input.discountCents ?? 0, input.surchargeCents ?? 0, input.taxCents ?? 0,
    );
    validateItems(input.items ?? []);
    const quote = normalizeQuote({
      ...input,
      id: crypto.randomUUID(), number, version: 1, status: "DRAFT", origin: input.origin ?? "MANUAL",
      clientId: input.clientId, clientName: input.clientName, title: input.title,
      items: input.items ?? [],
      ...calculations,
      paymentTerms: input.paymentTerms ?? { type: "CASH", dueDates: [], method: "PIX" },
      createdAt: now, updatedAt: now, history: [history("CREATED", "Orçamento criado.")],
    });
    await quotesRepository.save({ ...envelope, nextSequence: envelope.nextSequence + 1, quotes: [quote, ...envelope.quotes] });
    return quote;
  },
  async update(id: string, changes: Partial<ProfessionalQuote>) {
    const current = await quotesRepository.find(id);
    if (!current) throw new Error("Orçamento não encontrado.");
    const items = changes.items ?? current.items;
    validateItems(items);
    if (current.status !== "DRAFT" && changes.items && JSON.stringify(changes.items) !== JSON.stringify(current.items))
      throw new Error("Crie uma nova versão para alterar os itens de um orçamento já emitido.");
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
    await quotesRepository.upsert(updated);
    return updated;
  },
  async addItem(id: string, item: QuoteItem) {
    const current = await quotesRepository.find(id);
    return this.update(id, { items: [...(current?.items ?? []), item] });
  },
  async duplicateItem(id: string, itemId: string) {
    const quote = await this.get(id), source = quote.items.find((item) => item.id === itemId);
    if (!source) throw new Error("Item não encontrado.");
    const items = [...quote.items, { ...structuredClone(source), id: crypto.randomUUID(), order: quote.items.length }];
    return this.update(id, { items });
  },
  async removeItem(id: string, itemId: string) {
    const quote = await this.get(id);
    return this.update(id, { items: quote.items.filter((item) => item.id !== itemId).map((item, order) => ({ ...item, order })) });
  },
  async reorderItem(id: string, itemId: string, direction: -1 | 1) {
    const quote = await this.get(id), index = quote.items.findIndex((item) => item.id === itemId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= quote.items.length) return quote;
    const items = [...quote.items], [moved] = items.splice(index, 1); items.splice(target, 0, moved!);
    return this.update(id, { items: items.map((item, order) => ({ ...item, order })) });
  },
  async duplicate(id: string) {
    const source = await quotesRepository.find(id);
    if (!source) throw new Error("Orçamento não encontrado.");
    return this.create({ ...source, title: `${source.title} — Cópia`, items: structuredClone(source.items) });
  },
  async newVersion(id: string) {
    const source = await quotesRepository.find(id);
    if (!source) throw new Error("Orçamento não encontrado.");
    const now = new Date().toISOString();
    const version: ProfessionalQuote = {
      ...structuredClone(source), id: crypto.randomUUID(), parentId: source.parentId ?? source.id,
      version: source.version + 1, status: "DRAFT", serviceOrderId: undefined,
      serviceOrderNumber: undefined, approvedAt: undefined, rejectedAt: undefined,
      createdAt: now, updatedAt: now,
      history: [...source.history, history("VERSION_CREATED", `Versão ${source.version + 1} criada.`)],
    };
    await quotesRepository.upsert(version);
    return version;
  },
  async transition(id: string, status: QuoteStatus, details?: string) {
    const current = await quotesRepository.find(id);
    if (!current) throw new Error("Orçamento não encontrado.");
    if (status === "CONVERTED" && current.serviceOrderId)
      throw new Error("Este orçamento já foi convertido em Ordem.");
    const allowed: Record<QuoteStatus, readonly QuoteStatus[]> = {
      DRAFT: ["REVIEW", "WAITING_SEND", "CANCELED"], REVIEW: ["DRAFT", "WAITING_SEND", "CANCELED"],
      WAITING_SEND: ["SENT", "DRAFT", "CANCELED"], SENT: ["VIEWED", "APPROVED", "REJECTED", "EXPIRED", "CANCELED"],
      VIEWED: ["APPROVED", "REJECTED", "EXPIRED", "CANCELED"], APPROVED: ["CONVERTED", "CANCELED"],
      REJECTED: ["DRAFT"], EXPIRED: ["DRAFT"], CANCELED: ["DRAFT"], CONVERTED: [],
    };
    if (status !== current.status && !allowed[current.status].includes(status))
      throw new Error("Transição de situação não permitida.");
    const now = new Date().toISOString();
    return this.update(id, {
      status,
      approvedAt: status === "APPROVED" ? now : current.approvedAt,
      rejectedAt: status === "REJECTED" ? now : current.rejectedAt,
      rejectionReason: status === "REJECTED" ? details : current.rejectionReason,
    });
  },
  async linkOrder(id: string, serviceOrderId: string, serviceOrderNumber: string) {
    const current = await quotesRepository.find(id);
    if (!current) throw new Error("Orçamento não encontrado.");
    if (current.serviceOrderId) throw new Error("Este orçamento já possui uma Ordem vinculada.");
    return this.update(id, { status: "CONVERTED", serviceOrderId, serviceOrderNumber });
  },
  archive(id: string) { return this.update(id, { archivedAt: new Date().toISOString() }); },
  restore(id: string) { return this.update(id, { archivedAt: undefined }); },
};
