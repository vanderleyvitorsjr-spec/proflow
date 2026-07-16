import type { ClientRecord } from "./clientes-data";
import type { ClientsStorageAdapter } from "./clientes-storage-adapter";

export class DuplicateClientError extends Error {
  constructor(public readonly matches: ClientRecord[]) {
    super("Já existe um cliente com os mesmos dados principais.");
  }
}

const normalize = (value?: string) => value?.trim().toLocaleLowerCase("pt-BR") ?? "";
const digits = (value?: string) => value?.replace(/\D/g, "") ?? "";

export class ClientsRepository {
  constructor(private readonly storage: ClientsStorageAdapter) {}

  async list() {
    return (await this.storage.list()).filter((client) => !client.deletedAt);
  }

  async findById(id: string) {
    return (await this.storage.list()).find((client) => client.id === id && !client.deletedAt) ?? null;
  }

  async findDuplicates(candidate: Pick<ClientRecord, "document" | "email" | "phone">, ignoreId?: string) {
    const document = digits(candidate.document);
    const email = normalize(candidate.email);
    const phone = digits(candidate.phone);
    return (await this.list()).filter(
      (client) =>
        client.id !== ignoreId &&
        ((document && digits(client.document) === document) ||
          (email && normalize(client.email) === email) ||
          (phone && digits(client.phone) === phone)),
    );
  }

  async create(client: ClientRecord) {
    const records = await this.storage.list();
    await this.storage.replace([client, ...records]);
    return client;
  }

  async update(client: ClientRecord) {
    const records = await this.storage.list();
    await this.storage.replace(records.map((item) => (item.id === client.id ? client : item)));
    return client;
  }

  async softDelete(id: string) {
    const records = await this.storage.list();
    const existing = records.find((client) => client.id === id && !client.deletedAt);
    if (!existing) throw new Error("Cliente não encontrado.");
    const deleted = { ...existing, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await this.storage.replace(records.map((item) => (item.id === id ? deleted : item)));
    return deleted;
  }
}
