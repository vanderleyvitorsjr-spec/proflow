import { normalizeAddressText, normalizeEmail, normalizeProperName, normalizeUpperCode, onlyDigits } from "@/lib/br-formatters";
import { clientSchema, type ClientFormValues } from "./cliente-schema";
import type { ClientRecord } from "./clientes-data";
import { ClientsRepository, DuplicateClientError } from "./clientes-repository";


export class ClientsService {
  constructor(private readonly repository: ClientsRepository) {}

  listClients() {
    return this.repository.list();
  }

  getClient(id: string) {
    return this.repository.findById(id);
  }

  async createClient(input: ClientFormValues) {
    const value = clientSchema.parse(input);
    const duplicateMatches = await this.repository.findDuplicates(value);
    if (duplicateMatches.length) throw new DuplicateClientError(duplicateMatches);
    const now = new Date().toISOString();
    const record: ClientRecord = {
      ...value,
      name: normalizeProperName(value.name),
      street: normalizeAddressText(value.street),
      complement: normalizeAddressText(value.complement),
      district: normalizeProperName(value.district),
      city: normalizeProperName(value.city),
      id: crypto.randomUUID(),
      document: onlyDigits(value.document) || undefined,
      phone: onlyDigits(value.phone),
      whatsapp: onlyDigits(value.whatsapp) || undefined,
      email: normalizeEmail(value.email) || undefined,
      state: normalizeUpperCode(value.state),
      zipCode: onlyDigits(value.zipCode) || undefined,
      activeServiceOrders: 0,
      installedEquipment: 0,
      contracts: 0,
      lifetimeValue: 0,
      pendingAmount: 0,
      createdAt: now,
      updatedAt: now,
    };
    return this.repository.create(record);
  }

  async updateClient(id: string, input: ClientFormValues) {
    const current = await this.repository.findById(id);
    if (!current) throw new Error("Cliente não encontrado.");
    const value = clientSchema.parse(input);
    const duplicateMatches = await this.repository.findDuplicates(value, id);
    if (duplicateMatches.length) throw new DuplicateClientError(duplicateMatches);
    return this.repository.update({
      ...current,
      ...value,
      name: normalizeProperName(value.name),
      street: normalizeAddressText(value.street),
      complement: normalizeAddressText(value.complement),
      district: normalizeProperName(value.district),
      city: normalizeProperName(value.city),
      document: onlyDigits(value.document) || undefined,
      phone: onlyDigits(value.phone),
      whatsapp: onlyDigits(value.whatsapp) || undefined,
      email: normalizeEmail(value.email) || undefined,
      state: normalizeUpperCode(value.state),
      zipCode: onlyDigits(value.zipCode) || undefined,
      updatedAt: new Date().toISOString(),
    });
  }

  deleteClient(id: string) {
    return this.repository.softDelete(id);
  }
}
