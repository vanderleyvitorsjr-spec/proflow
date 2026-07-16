import { z } from "zod";
import { initialEquipmentState } from "./equipamentos-data";
import { EquipmentStorageError } from "./equipamentos-errors";
import type { EquipmentStorageState } from "./equipamentos-types";

const assetSchema = z.looseObject({
  id: z.string().min(1),
  internalCode: z.string().min(1),
  history: z.array(z.looseObject({ id: z.string(), createdAt: z.string() })),
});
const maintenanceSchema = z.looseObject({
  id: z.string().min(1),
  assetId: z.string().min(1),
  history: z.array(z.looseObject({ id: z.string(), createdAt: z.string() })),
});
const linkSchema = z.looseObject({
  id: z.string().min(1),
  assetId: z.string().min(1),
  serviceOrderId: z.string().min(1),
});
const v1Schema = z.object({
  version: z.literal(1),
  revision: z.number().int().nonnegative(),
  nextSequence: z.number().int().positive(),
  assets: z.array(assetSchema),
});
const v2Schema = z.object({
  version: z.literal(2),
  revision: z.number().int().nonnegative(),
  nextSequence: z.number().int().positive(),
  assets: z.array(assetSchema),
  maintenanceRecords: z.array(maintenanceSchema),
  serviceOrderLinks: z.array(linkSchema),
});
const v3Schema = z.object({
  version: z.literal(3),
  revision: z.number().int().nonnegative(),
  nextSequence: z.number().int().positive(),
  assets: z.array(assetSchema),
  maintenanceRecords: z.array(maintenanceSchema),
  serviceOrderLinks: z.array(linkSchema),
});
const KEY = "proflow:equipamentos:v1";
const BACKUP = "proflow:equipamentos:backup:v1";

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
    if (primary) {
      if (primary.migrated) {
        localStorage.setItem(BACKUP, raw);
        localStorage.setItem(KEY, JSON.stringify(primary.state));
      }
      return primary.state;
    }
    const backupRaw = localStorage.getItem(BACKUP);
    const recovered = backupRaw ? this.parse(backupRaw) : null;
    if (recovered) {
      localStorage.setItem(KEY, JSON.stringify(recovered.state));
      return recovered.state;
    }
    throw new EquipmentStorageError(
      "Os dados de Equipamentos estão corrompidos e não existe backup válido. Nada foi sobrescrito.",
    );
  }

  async write(state: EquipmentStorageState) {
    if (typeof window === "undefined") return state;
    if (!v3Schema.safeParse(state).success)
      throw new EquipmentStorageError("O estado de Equipamentos é inválido e não foi salvo.");
    const current = localStorage.getItem(KEY);
    if (current && this.parse(current)) localStorage.setItem(BACKUP, current);
    const next = { ...state, revision: state.revision + 1 };
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  }

  private parse(raw: string): { state: EquipmentStorageState; migrated: boolean } | null {
    try {
      const value: unknown = JSON.parse(raw);
      const current = v3Schema.safeParse(value);
      if (current.success)
        return { state: current.data as EquipmentStorageState, migrated: false };
      const previous = v2Schema.safeParse(value);
      if (previous.success)
        return { migrated: true, state: { ...(previous.data as unknown as Omit<EquipmentStorageState, "version">), version: 3 } };
      const legacy = v1Schema.safeParse(value);
      if (!legacy.success) return null;
      return {
        migrated: true,
        state: {
          ...(legacy.data as unknown as Omit<EquipmentStorageState, "version" | "maintenanceRecords" | "serviceOrderLinks">),
          version: 3,
          maintenanceRecords: [],
          serviceOrderLinks: [],
        },
      };
    } catch {
      return null;
    }
  }
}
export const equipmentStorageAdapter = new LocalEquipmentStorageAdapter();
