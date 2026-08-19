import { createClientAction, deleteClientAction } from "@/app/dashboard/clientes/actions";
import { normalizeAddressText, normalizeEmail, normalizeProperName, normalizeUpperCode, onlyDigits } from "@/lib/br-formatters";
import type { ClientFormValues } from "@/app/dashboard/clientes/cliente-schema";
import { crmLeadSchema, type CrmLeadFormValues } from "./crm-schema";
import { CrmRepository, DuplicateLeadError } from "./crm-repository";
import type { CrmHistoryEvent, CrmLeadRecord, CrmStageId } from "./crm-types";

const event = (type: CrmHistoryEvent["type"], description: string): CrmHistoryEvent => ({ id: crypto.randomUUID(), type, description, createdAt: new Date().toISOString() });

const clientSegmentFromInterest = (interest: string): ClientFormValues["segment"] => {
  const value = interest.toLocaleLowerCase("pt-BR");
  if (/(t\.i\.|inform[aá]tica|computador|notebook|servidor|rede|wi-?fi|roteador|switch|backup|impressora|windows|software|oct)/i.test(value)) return "IT";
  if (/(el[eé]tric|disjuntor|tomada|quadro|circuito|aterramento|dps|dr\b|cabeamento el[eé]trico)/i.test(value)) return "ELECTRICAL";
  if (/(ar[- ]?condicionado|climatiza|refrigera|split|higieniza|g[aá]s|pmoc|compressor|evaporadora|condensadora)/i.test(value)) return "CLIMATIZATION";
  return "MULTI";
};

const clientInputFromLead = (lead: CrmLeadRecord): ClientFormValues => ({
  name: lead.name,
  document: lead.document,
  phone: lead.phone,
  whatsapp: lead.whatsapp,
  email: lead.email,
  type: lead.type === "COMPANY" ? "COMPANY" : "RESIDENTIAL",
  segment: clientSegmentFromInterest(lead.serviceInterest),
  status: "ACTIVE",
  street: lead.address,
  number: "",
  complement: "",
  district: "",
  city: lead.city,
  state: lead.state,
  zipCode: lead.zipCode,
  notes: `Convertido automaticamente do CRM ao fechar a oportunidade. Interesse: ${lead.serviceInterest}.${lead.notes ? ` ${lead.notes}` : ""}`,
});

export class CrmService {
  constructor(private readonly repository: CrmRepository) {}

  private async ensureClientForApprovedLead(current: CrmLeadRecord) {
    if (current.stageId !== "approved" || current.convertedClientId) return current;
    const client = await createClientAction(clientInputFromLead(current));
    try {
      const now = new Date().toISOString();
      return await this.repository.save({
        ...current,
        convertedClientId: client.id,
        convertedAt: now,
        updatedAt: now,
        history: [...current.history, event("CONVERTED", "Oportunidade fechada e cliente cadastrado automaticamente.")],
      });
    } catch {
      await deleteClientAction(client.id);
      throw new Error("A oportunidade foi aprovada, mas não foi possível concluir o cadastro automático do cliente. A criação foi revertida com segurança.");
    }
  }
  listLeads() { return this.repository.list(); }
  getLead(id: string) { return this.repository.findById(id); }
  async createLead(input: CrmLeadFormValues) {
    const value = crmLeadSchema.parse(input); const duplicates = await this.repository.findDuplicates(value); if (duplicates.length) throw new DuplicateLeadError(duplicates);
    const now = new Date().toISOString();
    const saved = await this.repository.save({ ...value, id: crypto.randomUUID(), name: normalizeProperName(value.name), document: onlyDigits(value.document), phone: onlyDigits(value.phone), whatsapp: onlyDigits(value.whatsapp), email: normalizeEmail(value.email), address: normalizeAddressText(value.address), city: normalizeProperName(value.city), state: normalizeUpperCode(value.state), zipCode: onlyDigits(value.zipCode), source: normalizeProperName(value.source), serviceInterest: normalizeProperName(value.serviceInterest), salesOwner: normalizeProperName(value.salesOwner), createdAt: now, updatedAt: now, history: [event("CREATED", "Lead criado.")] });
    return this.ensureClientForApprovedLead(saved);
  }
  async updateLead(id: string, input: CrmLeadFormValues) {
    const current = await this.repository.findById(id);
    if (!current) throw new Error("Lead não encontrado.");
    const value = crmLeadSchema.parse(input);
    const duplicates = await this.repository.findDuplicates(value, id);
    if (duplicates.length) throw new DuplicateLeadError(duplicates);
    const history = [...current.history, event("UPDATED", "Dados do lead atualizados.")];
    if (current.stageId !== value.stageId) history.push(event("STAGE_CHANGED", `Etapa alterada para ${value.stageId}.`));
    const saved = await this.repository.save({
      ...current, ...value,
      name: normalizeProperName(value.name), document: onlyDigits(value.document), phone: onlyDigits(value.phone), whatsapp: onlyDigits(value.whatsapp),
      email: normalizeEmail(value.email), address: normalizeAddressText(value.address), city: normalizeProperName(value.city), state: normalizeUpperCode(value.state),
      zipCode: onlyDigits(value.zipCode), source: normalizeProperName(value.source), serviceInterest: normalizeProperName(value.serviceInterest),
      salesOwner: normalizeProperName(value.salesOwner), updatedAt: new Date().toISOString(), history,
    });
    return this.ensureClientForApprovedLead(saved);
  }
  async moveLead(id: string, stageId: CrmStageId) {
    const current = await this.repository.findById(id);
    if (!current) throw new Error("Lead não encontrado.");
    if (current.stageId === stageId) return this.ensureClientForApprovedLead(current);
    const saved = await this.repository.save({
      ...current, stageId, updatedAt: new Date().toISOString(),
      history: [...current.history, event("STAGE_CHANGED", `Etapa alterada para ${stageId}.`)],
    });
    return this.ensureClientForApprovedLead(saved);
  }
  async archiveLead(id: string) { const current = await this.repository.findById(id); if (!current) throw new Error("Lead não encontrado."); const now = new Date().toISOString(); return this.repository.save({ ...current, archivedAt: now, updatedAt: now, history: [...current.history, event("ARCHIVED", "Lead arquivado.")] }); }
  async convertLead(id: string, clientInput: ClientFormValues) {
    const current = await this.repository.findById(id); if (!current) throw new Error("Lead não encontrado."); if (current.convertedClientId) throw new Error("Este lead já foi convertido em cliente.");
    const client = await createClientAction(clientInput);
    try { const now = new Date().toISOString(); return await this.repository.save({ ...current, convertedClientId: client.id, convertedAt: now, updatedAt: now, history: [...current.history, event("CONVERTED", "Lead convertido em cliente.")] }); }
    catch { await deleteClientAction(client.id); throw new Error("Não foi possível concluir a conversão. A criação do cliente foi revertida com segurança."); }
  }
}
