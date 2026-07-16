import { z } from "zod";
import { initialEquipmentState } from "./equipamentos-data";
import { EquipmentStorageError } from "./equipamentos-errors";
import type { EquipmentStorageState } from "./equipamentos-types";
const schema = z
  .object({
    version: z.literal(1),
    revision: z.number().int().nonnegative(),
    nextSequence: z.number().int().positive(),
    assets: z.array(z.any()),
  })
  .superRefine((v, c) => {
    for (const a of v.assets) {
      if (!a?.id || !a?.internalCode || !Array.isArray(a?.history))
        c.addIssue({ code: "custom", message: "Ativo inválido." });
    }
  });
const KEY = "proflow:equipamentos:v1",
  BACKUP = "proflow:equipamentos:backup:v1";
export interface EquipmentStorageAdapter {
  read(): Promise<EquipmentStorageState>;
  write(state: EquipmentStorageState): Promise<EquipmentStorageState>;
}
export class LocalEquipmentStorageAdapter implements EquipmentStorageAdapter {
  async read() {
    if (typeof window === "undefined") return structuredClone(initialEquipmentState);
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(initialEquipmentState));
      return structuredClone(initialEquipmentState);
    }
    const primary = this.parse(raw);
    if (primary) return primary;
    const backup = localStorage.getItem(BACKUP),
      recovered = backup && this.parse(backup);
    if (recovered) {
      localStorage.setItem(KEY, JSON.stringify(recovered));
      return recovered;
    }
    throw new EquipmentStorageError(
      "Os dados de Equipamentos estão corrompidos e não existe backup válido. Nada foi sobrescrito.",
    );
  }
  async write(state: EquipmentStorageState) {
    if (typeof window === "undefined") return state;
    const parsed = schema.safeParse(state);
    if (!parsed.success)
      throw new EquipmentStorageError(
        "O estado de Equipamentos é inválido e não foi salvo.",
      );
    const current = localStorage.getItem(KEY);
    if (current && this.parse(current)) localStorage.setItem(BACKUP, current);
    const next = { ...state, revision: state.revision + 1 };
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  }
  private parse(raw: string) {
    try {
      const result = schema.safeParse(JSON.parse(raw));
      return result.success ? (result.data as EquipmentStorageState) : null;
    } catch {
      return null;
    }
  }
}
export const equipmentStorageAdapter = new LocalEquipmentStorageAdapter();
