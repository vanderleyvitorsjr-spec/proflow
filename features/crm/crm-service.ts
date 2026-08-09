import { createClientAction, deleteClientAction } from "@/app/dashboard/clientes/actions";
import { normalizeAddressText, normalizeEmail, normalizeProperName, normalizeUpperCode, onlyDigits } from "@/lib/br-formatters";
import type { ClientFormValues } from "@/app/dashboard/clientes/cliente-schema";
import { crmLeadSchema, type CrmLeadFormValues } from "./crm-schema";
import { CrmRepository, DuplicateLeadError } from "./crm-repository";
import type { CrmHistoryEvent, CrmStageId } from "./crm-types";
import { syncPricingAfterCrmConversion } from "@/lib/integrations/crm-pricing-bridge";

const event = (type: CrmHistoryEvent["type"], description: string): CrmHistoryEvent => ({ id: crypto.randomUUID(), type, description, createdAt: new Date().toISOString() });

function inferClientSegment(serviceInterest: string): ClientFormValues["segment"] {
  const normalized = serviceInterest.toLocaleLowerCase("pt-BR");
  const electrical = /(el[eé]tric|quadro|circuit|disjunt|tomada|ilumina)/.test(normalized);
  const climatization = /(ar[- ]?condicionado|climat|refrig|split|vrf|hvac|g[aá]s)/.test(normalized);
  return electrical && climatization ? "BOTH" : electrical ? "ELECTRICAL" : "CLIMATIZATION";
}

function clientInputFromLead(lead: {
  name: string; type: "INDIVIDUAL" | "COMPANY"; document: string; phone: string; whatsapp: string; email: string;
  address: string; city: string; state: string; zipCode: string; serviceInterest: string; notes: string;
}): ClientFormValues {
  return {
    name: lead.name, document: lead.document, phone: lead.phone, whatsapp: lead.whatsapp, email: lead.email,
    type: lead.type === "COMPANY" ? "COMPANY" : "RESIDENTIAL",
    segment: inferClientSegment(lead.serviceInterest), status: "ACTIVE", street: lead.address, number: "", complement: "", district: "",
    city: lead.city, state: lead.state, zipCode: lead.zipCode,
    notes: [lead.notes, `Origem CRM · Interesse: ${lead.serviceInterest}`].filter(Boolean).join("\n"),
  };
}

export class CrmService {
  constructor(private readonly repository: CrmRepository) {}
  listLeads() { return this.repository.list(); }
  getLead(id: string) { return this.repository.findById(id); }
  async createLead(input: CrmLeadFormValues) {
    const value = crmLeadSchema.parse(input); const duplicates = await this.repository.findDuplicates(value); if (duplicates.length) throw new DuplicateLeadError(duplicates);
    const now = new Date().toISOString();
    return this.repository.save({ ...value, id: crypto.randomUUID(), name: normalizeProperName(value.name), document: onlyDigits(value.document), phone: onlyDigits(value.phone), whatsapp: onlyDigits(value.whatsapp), email: normalizeEmail(value.email), address: normalizeAddressText(value.address), city: normalizeProperName(value.city), state: normalizeUpperCode(value.state), zipCode: onlyDigits(value.zipCode), source: normalizeProperName(value.source), serviceInterest: normalizeProperName(value.serviceInterest), salesOwner: normalizeProperName(value.salesOwner), createdAt: now, updatedAt: now, history: [event("CREATED", "Lead criado.")] });
  }
  async updateLead(id: string, input: CrmLeadFormValues) {
    const current = await this.repository.findById(id); if (!current) throw new Error("Lead não encontrado."); const value = crmLeadSchema.parse(input); const duplicates = await this.repository.findDuplicates(value, id); if (duplicates.length) throw new DuplicateLeadError(duplicates);
    const history = [...current.history, event("UPDATED", "Dados do lead atualizados.")];
    if (current.stageId !== value.stageId) history.push(event("STAGE_CHANGED", `Etapa alterada para ${value.stageId}.`));
    const updated = await this.repository.save({ ...current, ...value, name: normalizeProperName(value.name), document: onlyDigits(value.document), phone: onlyDigits(value.phone), whatsapp: onlyDigits(value.whatsapp), email: normalizeEmail(value.email), address: normalizeAddressText(value.address), city: normalizeProperName(value.city), state: normalizeUpperCode(value.state), zipCode: onlyDigits(value.zipCode), source: normalizeProperName(value.source), serviceInterest: normalizeProperName(value.serviceInterest), salesOwner: normalizeProperName(value.salesOwner), updatedAt: new Date().toISOString(), history });
    if (updated.stageId === "approved" && !updated.convertedClientId) {
      try { return await this.convertLead(id, clientInputFromLead(updated)); }
      catch (error) {
        await this.repository.save({
          ...current,
          updatedAt: new Date().toISOString(),
          history: [...current.history, event("UPDATED", "A aprovação foi revertida porque a conversão para cliente não pôde ser concluída.")],
        });
        throw error;
      }
    }
    return updated;
  }
  async moveLead(id: string, stageId: CrmStageId) {
    const current = await this.repository.findById(id);
    if (!current) throw new Error("Lead não encontrado.");
    if (current.stageId === stageId) return current;
    const moved = await this.repository.save({
      ...current, stageId, updatedAt: new Date().toISOString(),
      history: [...current.history, event("STAGE_CHANGED", `Etapa alterada para ${stageId}.`)],
    });
    if (stageId === "approved" && !moved.convertedClientId) {
      try { return await this.convertLead(id, clientInputFromLead(moved)); }
      catch (error) {
        await this.repository.save({
          ...current,
          updatedAt: new Date().toISOString(),
          history: [...current.history, event("UPDATED", "A aprovação foi revertida porque a conversão para cliente não pôde ser concluída.")],
        });
        throw error;
      }
    }
    return moved;
  }
  async archiveLead(id: string) { const current = await this.repository.findById(id); if (!current) throw new Error("Lead não encontrado."); const now = new Date().toISOString(); return this.repository.save({ ...current, archivedAt: now, updatedAt: now, history: [...current.history, event("ARCHIVED", "Lead arquivado.")] }); }
  async convertLead(id: string, clientInput: ClientFormValues) {
    const current = await this.repository.findById(id); if (!current) throw new Error("Lead não encontrado."); if (current.convertedClientId) throw new Error("Este lead já foi convertido em cliente.");
    const client = await createClientAction(clientInput);
    try {
      const now = new Date().toISOString();
      const converted = await this.repository.save({
        ...current,
        convertedClientId: client.id,
        convertedAt: now,
        updatedAt: now,
        history: [...current.history, event("CONVERTED", "Lead convertido em cliente.")],
      });
      await syncPricingAfterCrmConversion({
        crmLeadId: current.id,
        clientId: client.id,
        clientName: client.name,
        clientUpdatedAt: client.updatedAt ?? new Date().toISOString(),
      }).catch(() => undefined);
      return converted;
    } catch {
      await deleteClientAction(client.id);
      throw new Error("Não foi possível concluir a conversão. A criação do cliente foi revertida com segurança.");
    }
  }
}
