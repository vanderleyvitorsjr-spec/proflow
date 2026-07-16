import { z } from "zod";
import { initialSupplierState } from "./fornecedores-data";
import type { SupplierStorageState } from "./fornecedores-types";

const KEY = "proflow:fornecedores:v1";
const BACKUP = "proflow:fornecedores:v1:backup";
const schema = z.object({
  version: z.literal(1),
  revision: z.number().int().nonnegative(),
  nextSequence: z.number().int().positive(),
  suppliers: z.array(z.looseObject({ id: z.string(), code: z.string(), legalName: z.string(), tradeName: z.string(), history: z.array(z.looseObject({ id: z.string(), createdAt: z.string() })) })),
});

export interface SupplierStorageAdapter { read(): Promise<SupplierStorageState>; write(state: SupplierStorageState): Promise<SupplierStorageState>; }

export class LocalSupplierStorageAdapter implements SupplierStorageAdapter {
  async read(): Promise<SupplierStorageState> {
    if (typeof window === "undefined") return structuredClone(initialSupplierState);
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(initialSupplierState));
      return structuredClone(initialSupplierState);
    }
    const primary = this.parse(raw);
    if (primary) return primary;
    const backupRaw = localStorage.getItem(BACKUP);
    const backup = backupRaw ? this.parse(backupRaw) : null;
    if (backup) { localStorage.setItem(KEY, JSON.stringify(backup)); return backup; }
    throw new Error("Os dados de Fornecedores estão corrompidos e não existe backup válido. Nada foi sobrescrito.");
  }
  async write(state: SupplierStorageState): Promise<SupplierStorageState> {
    if (typeof window === "undefined") return state;
    if (!schema.safeParse(state).success) throw new Error("O estado de Fornecedores é inválido e não foi salvo.");
    const current = localStorage.getItem(KEY);
    if (current && this.parse(current)) localStorage.setItem(BACKUP, current);
    const next = { ...state, revision: state.revision + 1 };
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  }
  private parse(raw: string): SupplierStorageState | null {
    try { const parsed = schema.safeParse(JSON.parse(raw)); return parsed.success ? parsed.data as SupplierStorageState : null; } catch { return null; }
  }
}
export const supplierStorageAdapter = new LocalSupplierStorageAdapter();
