import { z } from "zod";
import { stockSeeds, stockUnitScales } from "./estoque-data";
import { StockStorageError } from "./estoque-errors";
import type {
  StockItem,
  StockMovement,
  StockPreferences,
  StockStorageState,
} from "./estoque-types";

const KEY = "proflow:estoque:v1",
  BACKUP = "proflow:estoque:v1:backup";
const historySchema = z.object({
  id: z.string(),
  type: z.string(),
  description: z.string(),
  createdAt: z.string().datetime(),
});
const itemSchema = z.object({
  id: z.string(),
  sequence: z.number().int().positive(),
  internalCode: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  category: z.string(),
  unit: z.string(),
  unitScale: z.number().int().positive(),
  barcode: z.string().optional(),
  manufacturer: z.string().optional(),
  supplierReference: z.string().optional(),
  minimumQuantity: z.number().int().nonnegative(),
  location: z.object({
    name: z.string().min(1),
    room: z.string().optional(),
    container: z.string().optional(),
    description: z.string().optional(),
  }),
  notes: z.string().optional(),
  active: z.boolean(),
  archivedAt: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  history: z.array(historySchema),
});
const movementSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  type: z.string(),
  quantity: z.number().int().positive(),
  unitCostCents: z.number().int().nonnegative(),
  totalCostCents: z.number().int().nonnegative(),
  date: z.string().date(),
  source: z.string(),
  sourceId: z.string().optional(),
  reason: z.string().min(1),
  notes: z.string().optional(),
  originalMovementId: z.string().optional(),
  serviceOrderId: z.string().optional(),
  reservationId: z.string().optional(),
  purchaseId: z.string().optional(),
  purchaseItemId: z.string().optional(),
  createdAt: z.string().datetime(),
  canceledAt: z.string().optional(),
  history: z.array(
    z.object({
      id: z.string(),
      description: z.string(),
      createdAt: z.string().datetime(),
    }),
  ),
});
const preferencesSchema = z.object({
  view: z.enum(["list", "cards"]),
  searchTerm: z.string(),
  statusFilter: z.string(),
  categoryFilter: z.string(),
  unitFilter: z.string(),
  locationFilter: z.string(),
  stockFilter: z.string(),
  includeArchived: z.boolean(),
});
const v1Schema = z.object({
  version: z.literal(1),
  revision: z.number().int().nonnegative(),
  nextItemSequence: z.number().int().positive(),
  items: z.array(itemSchema),
  movements: z.array(movementSchema),
  reservations: z.tuple([]),
  purchases: z.tuple([]),
  preferences: preferencesSchema,
});
const reservationSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  serviceOrderId: z.string(),
  serviceOrderNumberSnapshot: z.string(),
  serviceOrderTitleSnapshot: z.string(),
  serviceOrderUpdatedAtSnapshot: z.string(),
  purpose: z.string(),
  quantity: z.number().int().positive(),
  consumedQuantity: z.number().int().nonnegative(),
  releasedQuantity: z.number().int().nonnegative(),
  status: z.string(),
  idempotencyKey: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  archivedAt: z.string().optional(),
  reviewedAt: z.string().optional(),
  reviewNotes: z.string().optional(),
  history: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      description: z.string(),
      createdAt: z.string().datetime(),
    }),
  ),
});
const v2Schema = z.object({
  version: z.literal(2),
  revision: z.number().int().nonnegative(),
  nextItemSequence: z.number().int().positive(),
  items: z.array(itemSchema),
  movements: z.array(movementSchema),
  reservations: z.array(reservationSchema),
  purchases: z.tuple([]),
  preferences: preferencesSchema,
});
const purchaseHistorySchema = z.object({
  id: z.string(),
  type: z.string(),
  description: z.string(),
  createdAt: z.string().datetime(),
});
const purchaseSchema = z.object({
  id: z.string(),
  sequence: z.number().int().positive(),
  supplier: z.object({
    name: z.string().min(1),
    document: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    notes: z.string().optional(),
  }),
  documentNumber: z.string().optional(),
  purchaseDate: z.string().date(),
  expectedDate: z.string().date().optional(),
  notes: z.string().optional(),
  status: z.string(),
  items: z.array(
    z.object({
      id: z.string(),
      stockItemId: z.string(),
      internalCodeSnapshot: z.string(),
      nameSnapshot: z.string(),
      unitSnapshot: z.string(),
      unitScaleSnapshot: z.number().int().positive(),
      orderedQuantity: z.number().int().positive(),
      receivedQuantity: z.number().int().nonnegative(),
      unitCostCents: z.number().int().nonnegative(),
      totalCents: z.number().int().nonnegative(),
      notes: z.string().optional(),
    }),
  ),
  totalCents: z.number().int().nonnegative(),
  receivedTotalCents: z.number().int().nonnegative(),
  financialTransactionId: z.string().optional(),
  financialPurpose: z.literal("PAYABLE").optional(),
  financialSnapshot: z
    .object({
      transactionId: z.string(),
      number: z.string(),
      totalCents: z.number().int().nonnegative(),
      paidCents: z.number().int().nonnegative(),
      openCents: z.number().int().nonnegative(),
      accountId: z.string(),
      accountName: z.string(),
      status: z.string(),
      canceled: z.boolean(),
      archived: z.boolean(),
      manuallyModified: z.boolean(),
      updatedAt: z.string().datetime(),
    })
    .optional(),
  reconciliationReviewedAt: z.string().optional(),
  reconciliationNotes: z.string().optional(),
  manuallyModified: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  canceledAt: z.string().optional(),
  archivedAt: z.string().optional(),
  history: z.array(purchaseHistorySchema),
});
const stateSchema = z.object({
  version: z.literal(3),
  revision: z.number().int().nonnegative(),
  nextItemSequence: z.number().int().positive(),
  nextPurchaseSequence: z.number().int().positive(),
  items: z.array(itemSchema),
  movements: z.array(movementSchema),
  reservations: z.array(reservationSchema),
  purchases: z.array(purchaseSchema),
  preferences: preferencesSchema,
});

export const defaultStockPreferences: StockPreferences = {
  view: "list",
  searchTerm: "",
  statusFilter: "ALL",
  categoryFilter: "ALL",
  unitFilter: "ALL",
  locationFilter: "ALL",
  stockFilter: "ALL",
  includeArchived: false,
};
function initialState(): StockStorageState {
  const createdAt = "2026-07-01T12:00:00.000Z";
  const items: StockItem[] = stockSeeds.map(
    ([id, internalCode, name, category, unit, , minimum, , location], index) => ({
      id,
      sequence: index + 1,
      internalCode,
      name,
      description: "Item demonstrativo migrado da carga inicial.",
      category,
      unit,
      unitScale: stockUnitScales[unit],
      barcode: `78900000000${String(index + 11).slice(-2)}`,
      manufacturer: "Marca de exemplo",
      supplierReference: "Fornecedor demonstrativo",
      minimumQuantity: Math.round(minimum * stockUnitScales[unit]),
      location: { name: location },
      active: true,
      createdAt,
      updatedAt: createdAt,
      history: [
        {
          id: `history-import-${id}`,
          type: "CREATED",
          description: "Item importado da carga inicial.",
          createdAt,
        },
      ],
    }),
  );
  const movements: StockMovement[] = stockSeeds.flatMap(
    ([id, , , , unit, quantity, , cost], index) =>
      quantity <= 0
        ? []
        : [
            {
              id: `opening-${id}`,
              itemId: id,
              type: "ENTRY" as const,
              quantity: Math.round(quantity * stockUnitScales[unit]),
              unitCostCents: cost,
              totalCostCents: Math.round(quantity * cost),
              date: "2026-07-01",
              source: "IMPORT" as const,
              sourceId: "INITIAL_STOCK",
              reason: "Saldo inicial importado",
              notes:
                "Movimento de abertura criado pela migração dos dados demonstrativos.",
              createdAt: new Date(Date.parse(createdAt) + index).toISOString(),
              history: [
                {
                  id: `movement-history-${id}`,
                  description: "Entrada de abertura importada.",
                  createdAt,
                },
              ],
            },
          ],
  );
  return {
    version: 3,
    revision: 0,
    nextItemSequence: 11,
    nextPurchaseSequence: 1,
    items,
    movements,
    reservations: [],
    purchases: [],
    preferences: { ...defaultStockPreferences },
  };
}
export interface StockStorageAdapter {
  read(): Promise<StockStorageState>;
  write(state: StockStorageState): Promise<StockStorageState>;
  recoverBackup(): Promise<StockStorageState>;
}
export class LocalStockStorageAdapter implements StockStorageAdapter {
  async read() {
    if (typeof window === "undefined") return initialState();
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const state = initialState();
      localStorage.setItem(KEY, JSON.stringify(state));
      return structuredClone(state);
    }
    const parsed = this.parse(raw);
    if (parsed) {
      if (parsed.migrated) {
        localStorage.setItem(BACKUP, raw);
        localStorage.setItem(KEY, JSON.stringify(parsed.state));
      }
      return parsed.state;
    }
    const backup = localStorage.getItem(BACKUP),
      recovered = backup && this.parse(backup);
    if (recovered) {
      localStorage.setItem(KEY, JSON.stringify(recovered.state));
      return recovered.state;
    }
    throw new StockStorageError(
      "Os dados do Estoque e o backup estão corrompidos. Nada foi sobrescrito.",
    );
  }
  async write(state: StockStorageState) {
    if (typeof window === "undefined") return state;
    const valid = stateSchema.safeParse(state);
    if (!valid.success)
      throw new StockStorageError("O estado do Estoque é inválido e não foi salvo.");
    const raw = localStorage.getItem(KEY),
      current = raw && this.parse(raw);
    if (current && current.state.revision !== state.revision)
      throw new StockStorageError(
        "O Estoque foi alterado em outra aba. Recarregue antes de salvar.",
      );
    if (raw && current) localStorage.setItem(BACKUP, raw);
    const next = { ...state, revision: state.revision + 1 };
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  }
  async recoverBackup() {
    if (typeof window === "undefined") return initialState();
    const raw = localStorage.getItem(BACKUP),
      parsed = raw && this.parse(raw);
    if (!parsed)
      throw new StockStorageError("Não existe backup válido para recuperação.");
    localStorage.setItem(KEY, JSON.stringify(parsed.state));
    return parsed.state;
  }
  private parse(raw: string): { state: StockStorageState; migrated: boolean } | null {
    try {
      const value: unknown = JSON.parse(raw),
        current = stateSchema.safeParse(value);
      if (current.success)
        return { state: current.data as StockStorageState, migrated: false };
      const previous = v2Schema.safeParse(value);
      if (previous.success)
        return {
          state: {
            ...previous.data,
            version: 3,
            nextPurchaseSequence: 1,
            purchases: [],
          } as StockStorageState,
          migrated: true,
        };
      const legacy = v1Schema.safeParse(value);
      if (!legacy.success) return null;
      return {
        state: {
          ...(legacy.data as unknown as Omit<
            StockStorageState,
            "version" | "reservations" | "nextPurchaseSequence"
          >),
          version: 3 as const,
          nextPurchaseSequence: 1,
          reservations: [],
          purchases: [],
        } as StockStorageState,
        migrated: true,
      };
    } catch {
      return null;
    }
  }
}
export const stockStorageAdapter = new LocalStockStorageAdapter();
