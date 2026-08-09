import type { SupplierFormValues } from "./fornecedores-schema";
import type { SupplierStorageState } from "./fornecedores-types";
import type { SupplierStorageAdapter } from "./fornecedores-storage-adapter";
import { onlyDigits } from "@/lib/br-formatters";

export class DuplicateSupplierError extends Error { constructor(public readonly fields: string[]) { super("Já existe um fornecedor com dados iguais."); } }

export class SuppliersRepository {
  constructor(private readonly adapter: SupplierStorageAdapter) {}
  read() { return this.adapter.read(); }
  write(state: SupplierStorageState) { return this.adapter.write(state); }
  async list() { return (await this.read()).suppliers; }
  async findById(id: string) { return (await this.list()).find((item) => item.id === id) ?? null; }
  async findDuplicates(input: SupplierFormValues, ignoreId?: string) {
    const document = onlyDigits(input.document), email = input.email.trim().toLocaleLowerCase("pt-BR"), phone = onlyDigits(input.phone || input.whatsapp);
    const fields = new Set<string>();
    for (const supplier of await this.list()) {
      if (supplier.id === ignoreId) continue;
      if (document && onlyDigits(supplier.document) === document) fields.add("document");
      if (email && supplier.email?.toLocaleLowerCase("pt-BR") === email) fields.add("email");
      if (phone && [supplier.phone, supplier.whatsapp].some((value) => onlyDigits(value) === phone)) fields.add("phone");
    }
    return [...fields];
  }
}
