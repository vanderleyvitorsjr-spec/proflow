import { normalizeProperName } from "../../../lib/br-formatters";

export const quoteStatuses = [
  "DRAFT", "REVIEW", "WAITING_SEND", "SENT", "VIEWED", "APPROVED",
  "REJECTED", "EXPIRED", "CANCELED", "CONVERTED",
] as const;
export type QuoteStatus = (typeof quoteStatuses)[number];
export type QuoteItemCategory =
  | "SERVICE" | "MATERIAL" | "LABOR" | "TRAVEL" | "FEE" | "EXPENSE" | "DISCOUNT" | "FREE";
export type QuoteUnit =
  | "UNIT" | "HOUR" | "DAY" | "METER" | "SQUARE_METER" | "KILOGRAM"
  | "LITER" | "BOX" | "ROLL" | "SET" | "SERVICE" | "OTHER";

export interface QuoteItem {
  id: string;
  sourceId?: string;
  sourceSnapshot?: { code: string; name: string; capturedAt: string };
  description: string;
  category: QuoteItemCategory;
  quantity: number;
  unit: QuoteUnit;
  unitPriceCents: number;
  estimatedCostCents: number;
  marginBasisPoints: number;
  discountCents: number;
  totalCents: number;
  notes?: string;
  order: number;
}

export interface QuotePaymentTerms {
  type: "CASH" | "ENTRY_BALANCE" | "INSTALLMENTS" | "MILESTONES" | "CUSTOM";
  installmentCount?: number;
  entryAmountCents?: number;
  entryRateBasisPoints?: number;
  dueDates: string[];
  method: "PIX" | "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "BOLETO" | "BANK_TRANSFER" | "OTHER";
  notes?: string;
  firstDueDate?: string;
  intervalDays?: number;
  balanceDueDate?: string;
  milestones?: Array<{ id: string; description: string; amountCents: number; percentageBasisPoints: number; dueDate?: string }>;
}

export interface QuoteHistory {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

export interface ProfessionalQuote {
  id: string;
  number: string;
  version: number;
  parentId?: string;
  clientId: string;
  clientName: string;
  clientDocument?: string;
  clientPhone?: string;
  responsible?: string;
  companyName?: string;
  address?: string;
  city?: string;
  state?: string;
  serviceType?: "CLIMATIZATION" | "ELECTRICAL" | "PREVENTIVE" | "CORRECTIVE" | "INSTALLATION";
  equipmentDescription?: string;
  title: string;
  description?: string;
  issuedAt?: string;
  validUntil?: string;
  status: QuoteStatus;
  origin: string;
  internalNotes?: string;
  customerNotes?: string;
  items: QuoteItem[];
  subtotalCents: number;
  discountCents: number;
  surchargeCents: number;
  taxCents: number;
  totalCents: number;
  paymentTerms: QuotePaymentTerms;
  executionDeadline?: string;
  warranty?: string;
  terms?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  serviceOrderId?: string;
  serviceOrderNumber?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
  history: QuoteHistory[];
}

export interface QuotesEnvelope {
  version: 1;
  nextSequence: number;
  quotes: ProfessionalQuote[];
}

export function emptyQuotesEnvelope(): QuotesEnvelope {
  return { version: 1, nextSequence: 1, quotes: [] };
}

export function quoteNumber(sequence: number, year = new Date().getFullYear()) {
  return `ORC-${year}-${String(sequence).padStart(6, "0")}`;
}

export function calculateQuoteItem(
  input: Omit<QuoteItem, "totalCents">,
  confirmExcessiveDiscount = false,
): QuoteItem {
  if (!Number.isFinite(input.quantity) || input.quantity < 0)
    throw new Error("Informe uma quantidade válida e não negativa.");
  if (!Number.isInteger(input.unitPriceCents) || input.unitPriceCents < 0)
    throw new Error("Informe um valor unitário válido.");
  const gross = Math.round(input.quantity * input.unitPriceCents);
  if (input.discountCents > gross && !confirmExcessiveDiscount)
    throw new Error("Confirme o desconto maior que o valor do item.");
  return { ...input, totalCents: Math.max(0, gross - input.discountCents) };
}

export function calculateQuote(
  items: readonly QuoteItem[],
  discountCents = 0,
  surchargeCents = 0,
  taxCents = 0,
) {
  const subtotalCents = items.reduce((total, item) => total + item.totalCents, 0);
  const totalCents = Math.max(0, subtotalCents - discountCents + surchargeCents + taxCents);
  const estimatedCostCents = items.reduce((total, item) => total + item.estimatedCostCents, 0);
  return { subtotalCents, discountCents, surchargeCents, taxCents, totalCents, estimatedCostCents };
}

export function normalizeQuote(input: ProfessionalQuote): ProfessionalQuote {
  return {
    ...input,
    clientName: normalizeProperName(input.clientName),
    responsible: input.responsible ? normalizeProperName(input.responsible) : undefined,
    title: normalizeProperName(input.title),
  };
}

export function quoteMatchesSearch(quote: ProfessionalQuote, search: string) {
  const term = search.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/\D/g, "");
  const text = [quote.number, quote.clientName, quote.clientDocument, quote.clientPhone, quote.title, quote.description]
    .join(" ").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  return text.includes(search.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase())
    || Boolean(term && text.replace(/\D/g, "").includes(term));
}

export function quotePaymentSchedule(totalCents: number, terms: QuotePaymentTerms) {
  if (terms.type === "CASH") return [{ label: "À Vista", amountCents: totalCents, dueDate: terms.firstDueDate }];
  if (terms.type === "ENTRY_BALANCE") {
    const entry = terms.entryAmountCents ?? Math.round(totalCents * (terms.entryRateBasisPoints ?? 0) / 10_000);
    return [
      { label: "Entrada", amountCents: entry, dueDate: terms.firstDueDate },
      { label: "Saldo", amountCents: totalCents - entry, dueDate: terms.balanceDueDate },
    ];
  }
  if (terms.type === "INSTALLMENTS") {
    const count = Math.max(1, terms.installmentCount ?? 1);
    const base = Math.floor(totalCents / count), remainder = totalCents - base * count;
    const first = terms.firstDueDate ? new Date(`${terms.firstDueDate}T12:00:00`) : undefined;
    return Array.from({ length: count }, (_, index) => {
      const due = first ? new Date(first) : undefined;
      due?.setDate(due.getDate() + index * (terms.intervalDays ?? 30));
      return { label: `Parcela ${index + 1}`, amountCents: base + (index === count - 1 ? remainder : 0), dueDate: due?.toISOString().slice(0, 10) };
    });
  }
  if (terms.type === "MILESTONES") {
    const milestones = terms.milestones ?? [];
    if (milestones.reduce((sum, item) => sum + item.amountCents, 0) !== totalCents)
      throw new Error("A soma das etapas deve corresponder ao total do orçamento.");
    return milestones.map((item) => ({ label: item.description, amountCents: item.amountCents, dueDate: item.dueDate }));
  }
  return [{ label: "Condição Personalizada", amountCents: totalCents, dueDate: terms.firstDueDate }];
}

export function quoteFinancialSummary(quote: ProfessionalQuote) {
  const costCents = quote.items.reduce((sum, item) => sum + item.estimatedCostCents, 0);
  const profitCents = quote.totalCents - costCents;
  const marginBasisPoints = quote.totalCents > 0 ? Math.round(profitCents / quote.totalCents * 10_000) : 0;
  const alerts: string[] = [];
  if (quote.items.some((item) => item.quantity <= 0)) alerts.push("Item sem quantidade");
  if (quote.items.some((item) => item.unitPriceCents <= 0)) alerts.push("Item sem valor");
  if (quote.totalCents < costCents) alerts.push("Preço abaixo do custo");
  if (marginBasisPoints < 0) alerts.push("Margem negativa");
  if (quote.discountCents > quote.subtotalCents * 0.15) alerts.push("Desconto elevado");
  if (!quote.items.length) alerts.push("Dados insuficientes");
  return { costCents, profitCents, marginBasisPoints, alerts };
}

export function validateQuoteConversion(quote: ProfessionalQuote) {
  const missing: string[] = [];
  if (!quote.clientId) missing.push("Cliente");
  if (!quote.title.trim()) missing.push("Título");
  if (!quote.items.some((item) => item.quantity > 0 && item.unitPriceCents >= 0)) missing.push("Pelo menos um item válido");
  if (!quote.address?.trim()) missing.push("Endereço do Atendimento");
  if (!quote.serviceType) missing.push("Tipo de Serviço");
  if (!quote.responsible?.trim()) missing.push("Responsável");
  if (!["APPROVED", "SENT", "VIEWED"].includes(quote.status)) missing.push("Situação compatível");
  if (quote.serviceOrderId) missing.push("Orçamento ainda não convertido");
  return missing;
}

export function compareQuoteVersions(previous: ProfessionalQuote, current: ProfessionalQuote) {
  const previousById = new Map(previous.items.map((item) => [item.id, item]));
  const currentById = new Map(current.items.map((item) => [item.id, item]));
  return {
    added: current.items.filter((item) => !previousById.has(item.id)),
    removed: previous.items.filter((item) => !currentById.has(item.id)),
    changed: current.items.filter((item) => {
      const old = previousById.get(item.id);
      return old && (old.quantity !== item.quantity || old.unitPriceCents !== item.unitPriceCents || old.discountCents !== item.discountCents);
    }),
    previousTotalCents: previous.totalCents,
    currentTotalCents: current.totalCents,
    paymentChanged: JSON.stringify(previous.paymentTerms) !== JSON.stringify(current.paymentTerms),
    deadlineChanged: previous.executionDeadline !== current.executionDeadline,
  };
}
