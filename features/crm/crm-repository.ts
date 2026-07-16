import type { CrmStorageAdapter } from "./crm-storage-adapter";
import type { CrmLeadRecord } from "./crm-types";

export class DuplicateLeadError extends Error { constructor(public readonly matches: CrmLeadRecord[]) { super("Já existe um lead com os mesmos dados principais."); } }
const normalize = (value: string) => value.trim().toLocaleLowerCase("pt-BR");
const digits = (value: string) => value.replace(/\D/g, "");

export class CrmRepository {
  constructor(private readonly storage: CrmStorageAdapter) {}
  async list() { return (await this.storage.list()).filter((lead) => !lead.archivedAt); }
  async findById(id: string) { return (await this.storage.list()).find((lead) => lead.id === id && !lead.archivedAt) ?? null; }
  async findDuplicates(candidate: Pick<CrmLeadRecord, "document" | "email" | "phone">, ignoreId?: string) {
    const document = digits(candidate.document), email = normalize(candidate.email), phone = digits(candidate.phone);
    return (await this.list()).filter((lead) => lead.id !== ignoreId && ((document && digits(lead.document) === document) || (email && normalize(lead.email) === email) || (phone && digits(lead.phone) === phone)));
  }
  async save(record: CrmLeadRecord) { const records = await this.storage.list(); const exists = records.some((item) => item.id === record.id); await this.storage.replace(exists ? records.map((item) => item.id === record.id ? record : item) : [record, ...records]); return record; }
}
