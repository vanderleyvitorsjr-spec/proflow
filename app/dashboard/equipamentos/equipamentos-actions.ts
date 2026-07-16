import { ZodError } from "zod";
import { EquipmentDomainError } from "./equipamentos-errors";
import { EquipmentRepository } from "./equipamentos-repository";
import type { EquipmentActionResult } from "./equipamentos-result";
import type { EquipmentFormValues } from "./equipamentos-schema";
import { EquipmentService } from "./equipamentos-service";
import { equipmentStorageAdapter } from "./equipamentos-storage-adapter";
const service = new EquipmentService(new EquipmentRepository(equipmentStorageAdapter));
async function action<T>(fn: () => Promise<T>): Promise<EquipmentActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof ZodError)
      return {
        ok: false,
        error: {
          code: "VALIDATION",
          message: e.issues[0]?.message ?? "Revise os campos.",
          fieldErrors: e.flatten().fieldErrors,
        },
      };
    if (e instanceof EquipmentDomainError)
      return { ok: false, error: { code: e.code, message: e.message } };
    return {
      ok: false,
      error: {
        code: "UNKNOWN",
        message: e instanceof Error ? e.message : "Não foi possível concluir a operação.",
      },
    };
  }
}
export const listEquipmentStateAction = () => action(() => service.list());
export const getEquipmentAction = (id: string) => action(() => service.get(id));
export const createEquipmentAction = (v: EquipmentFormValues) =>
  action(() => service.create(v));
export const updateEquipmentAction = (id: string, v: EquipmentFormValues) =>
  action(() => service.update(id, v));
export const archiveEquipmentAction = (id: string, reason: string) =>
  action(() => service.archive(id, reason));
