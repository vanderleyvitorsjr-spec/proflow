import { ZodError } from "zod";
import { supplierStorageAdapter } from "./fornecedores-storage-adapter";
import { SuppliersRepository, DuplicateSupplierError } from "./fornecedores-repository";
import { SuppliersService } from "./fornecedores-service";
import type { SupplierFormValues } from "./fornecedores-schema";

const service = new SuppliersService(new SuppliersRepository(supplierStorageAdapter));
export type SupplierActionResult<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string; fields?: string[] } };
async function action<T>(fn: () => Promise<T>): Promise<SupplierActionResult<T>> {
  try { return { ok: true, data: await fn() }; }
  catch (error) {
    if (error instanceof DuplicateSupplierError) return { ok: false, error: { code: "DUPLICATE", message: "Já existe um fornecedor com documento, telefone ou e-mail igual.", fields: error.fields } };
    if (error instanceof ZodError) return { ok: false, error: { code: "VALIDATION", message: error.issues[0]?.message ?? "Revise os campos." } };
    return { ok: false, error: { code: "UNKNOWN", message: error instanceof Error ? error.message : "Não foi possível concluir a operação." } };
  }
}
export const listSuppliersAction = () => action(() => service.list());
export const getSupplierAction = (id: string) => action(() => service.get(id));
export const createSupplierAction = (input: SupplierFormValues) => action(() => service.create(input));
export const updateSupplierAction = (id: string, input: SupplierFormValues) => action(() => service.update(id, input));
export const archiveSupplierAction = (id: string) => action(() => service.archive(id));
export const restoreSupplierAction = (id: string) => action(() => service.restore(id));
export const listSupplierPublicReferencesAction = () => action(async () => (await service.list()).map((item) => ({ id: item.id, code: item.code, name: item.tradeName, legalName: item.legalName, document: item.document, categories: item.categories, status: item.status, archived: Boolean(item.archivedAt), updatedAt: item.updatedAt })));
