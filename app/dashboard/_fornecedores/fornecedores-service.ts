import { normalizeProperName, normalizeUpperCode, onlyDigits } from "@/lib/br-formatters";
import { supplierSchema, type SupplierFormValues } from "./fornecedores-schema";
import { DuplicateSupplierError, SuppliersRepository } from "./fornecedores-repository";
import type { SupplierHistoryEntry, SupplierRecord } from "./fornecedores-types";

const history = (type: SupplierHistoryEntry["type"], description: string): SupplierHistoryEntry => ({ id: crypto.randomUUID(), type, description, createdAt: new Date().toISOString() });
const optional = (value: string) => value.trim() || undefined;

export class SuppliersService {
  constructor(private readonly repository: SuppliersRepository) {}
  list() { return this.repository.list(); }
  get(id: string) { return this.repository.findById(id); }
  async create(input: SupplierFormValues) {
    const value = supplierSchema.parse(input), duplicates = await this.repository.findDuplicates(value);
    if (duplicates.length) throw new DuplicateSupplierError(duplicates);
    const state = await this.repository.read(), now = new Date().toISOString(), sequence = state.nextSequence;
    const supplier: SupplierRecord = {
      id: crypto.randomUUID(), sequence, code: `FOR-${String(sequence).padStart(4, "0")}`,
      legalName: normalizeProperName(value.legalName), tradeName: normalizeProperName(value.tradeName),
      document: onlyDigits(value.document) || undefined, stateRegistration: optional(value.stateRegistration), municipalRegistration: optional(value.municipalRegistration),
      contactName: optional(normalizeProperName(value.contactName)), phone: onlyDigits(value.phone) || undefined, whatsapp: onlyDigits(value.whatsapp) || undefined,
      email: optional(value.email.toLocaleLowerCase("pt-BR")), website: optional(value.website), zipCode: onlyDigits(value.zipCode) || undefined,
      street: optional(normalizeProperName(value.street)), number: optional(value.number), complement: optional(normalizeProperName(value.complement)),
      district: optional(normalizeProperName(value.district)), city: optional(normalizeProperName(value.city)), state: optional(normalizeUpperCode(value.state)),
      categories: value.categories, paymentTerms: optional(value.paymentTerms), preferredPaymentMethod: optional(normalizeProperName(value.preferredPaymentMethod)),
      deliveryLeadTimeDays: value.deliveryLeadTimeDays, minimumOrderCents: value.minimumOrderCents, rating: value.rating, status: value.status,
      notes: optional(value.notes), createdAt: now, updatedAt: now, history: [history("CREATED", "Fornecedor cadastrado.")],
    };
    await this.repository.write({ ...state, nextSequence: sequence + 1, suppliers: [...state.suppliers, supplier] });
    return supplier;
  }
  async update(id: string, input: SupplierFormValues) {
    const value = supplierSchema.parse(input), state = await this.repository.read(), current = state.suppliers.find((item) => item.id === id);
    if (!current) throw new Error("Fornecedor não encontrado.");
    const duplicates = await this.repository.findDuplicates(value, id); if (duplicates.length) throw new DuplicateSupplierError(duplicates);
    const next: SupplierRecord = {
      ...current, legalName: normalizeProperName(value.legalName), tradeName: normalizeProperName(value.tradeName), document: onlyDigits(value.document) || undefined,
      stateRegistration: optional(value.stateRegistration), municipalRegistration: optional(value.municipalRegistration), contactName: optional(normalizeProperName(value.contactName)),
      phone: onlyDigits(value.phone) || undefined, whatsapp: onlyDigits(value.whatsapp) || undefined, email: optional(value.email.toLocaleLowerCase("pt-BR")), website: optional(value.website),
      zipCode: onlyDigits(value.zipCode) || undefined, street: optional(normalizeProperName(value.street)), number: optional(value.number), complement: optional(normalizeProperName(value.complement)),
      district: optional(normalizeProperName(value.district)), city: optional(normalizeProperName(value.city)), state: optional(normalizeUpperCode(value.state)), categories: value.categories,
      paymentTerms: optional(value.paymentTerms), preferredPaymentMethod: optional(normalizeProperName(value.preferredPaymentMethod)), deliveryLeadTimeDays: value.deliveryLeadTimeDays,
      minimumOrderCents: value.minimumOrderCents, rating: value.rating, status: value.status, notes: optional(value.notes), updatedAt: new Date().toISOString(),
      history: [...current.history, history(current.rating !== value.rating ? "RATING_CHANGED" : "UPDATED", current.rating !== value.rating ? "Avaliação do fornecedor atualizada." : "Cadastro do fornecedor atualizado.")],
    };
    await this.repository.write({ ...state, suppliers: state.suppliers.map((item) => item.id === id ? next : item) }); return next;
  }
  async archive(id: string) {
    const state = await this.repository.read(), current = state.suppliers.find((item) => item.id === id); if (!current) throw new Error("Fornecedor não encontrado.");
    const now = new Date().toISOString(), next = { ...current, status: "ARCHIVED" as const, archivedAt: now, updatedAt: now, history: [...current.history, history("ARCHIVED", "Fornecedor arquivado.")] };
    await this.repository.write({ ...state, suppliers: state.suppliers.map((item) => item.id === id ? next : item) }); return next;
  }
  async restore(id: string) {
    const state = await this.repository.read(), current = state.suppliers.find((item) => item.id === id); if (!current) throw new Error("Fornecedor não encontrado.");
    const now = new Date().toISOString(), next = { ...current, status: "ACTIVE" as const, archivedAt: undefined, updatedAt: now, history: [...current.history, history("RESTORED", "Fornecedor reativado.")] };
    await this.repository.write({ ...state, suppliers: state.suppliers.map((item) => item.id === id ? next : item) }); return next;
  }
}
