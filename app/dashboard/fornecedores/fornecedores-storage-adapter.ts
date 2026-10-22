import { readRemoteModuleState, writeRemoteModuleState } from "@/lib/module-state/remote-module-state";
import { z } from "zod";
import { initialSupplierState } from "./fornecedores-data";
import type { SupplierStorageState } from "./fornecedores-types";

const schema = z.object({
  version: z.literal(1),
  revision: z.number().int().nonnegative(),
  nextSequence: z.number().int().positive(),
  suppliers: z.array(z.looseObject({ id: z.string(), code: z.string(), legalName: z.string(), tradeName: z.string(), history: z.array(z.looseObject({ id: z.string(), createdAt: z.string() })) })),
});

export interface SupplierStorageAdapter { read(): Promise<SupplierStorageState>; write(state: SupplierStorageState): Promise<SupplierStorageState>; }

const MODULE = "fornecedores";
// Empresa nova começa sem fornecedores fictícios.
const emptySupplierState = (): SupplierStorageState => ({ ...structuredClone(initialSupplierState), nextSequence: 1, suppliers: [] });

const seedSupplierIds = new Set(initialSupplierState.suppliers.map((item) => item.id));
// Acrescenta fornecedores que só existem neste navegador. Nunca remove nada do servidor.
function mergeLocalSuppliers(remoteRaw: unknown, localRaw: unknown): unknown {
  const remote = schema.safeParse(remoteRaw), local = schema.safeParse(localRaw);
  if (!remote.success || !local.success) return null;
  const known = new Set(remote.data.suppliers.map((item) => item.id));
  const added = local.data.suppliers.filter((item) => !known.has(item.id) && !seedSupplierIds.has(item.id));
  if (!added.length) return null;
  return {
    ...remote.data,
    suppliers: [...remote.data.suppliers, ...added],
    nextSequence: Math.max(remote.data.nextSequence, local.data.nextSequence),
  };
}

/**
 * Fornecedores ficam no servidor, por empresa (antes ficavam só no navegador).
 * Na primeira leitura, os dados já salvos neste navegador são importados.
 */
export class RemoteSupplierStorageAdapter implements SupplierStorageAdapter {
  async read(): Promise<SupplierStorageState> {
    if (typeof window === "undefined") return emptySupplierState();
    const value = await readRemoteModuleState<unknown>(MODULE, emptySupplierState(), { mergeLegacy: mergeLocalSuppliers });
    const parsed = schema.safeParse(value);
    if (parsed.success) return parsed.data as SupplierStorageState;
    throw new Error("Os dados de Fornecedores no servidor estão em formato inválido. Nada foi sobrescrito.");
  }
  async write(state: SupplierStorageState): Promise<SupplierStorageState> {
    if (typeof window === "undefined") return state;
    if (!schema.safeParse(state).success) throw new Error("O estado de Fornecedores é inválido e não foi salvo.");
    const next = { ...state, revision: state.revision + 1 };
    return writeRemoteModuleState(MODULE, next);
  }
}
export const supplierStorageAdapter = new RemoteSupplierStorageAdapter();
