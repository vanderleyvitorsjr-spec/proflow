import { readRemoteModuleState, writeRemoteModuleState } from "@/lib/storage/remote-module-state";
import { copyLegacyBrowserDataToCompany, scopedBrowserBackupKey, scopedBrowserStorageKey } from "@/lib/storage/company-storage-key";
import { z } from "zod";
import { initialFinancialState } from "./financeiro-data";
import { FinancialStorageError } from "./financeiro-errors";
import type { FinancialStorageState } from "./financeiro-types";
const historySchema = z.object({
  id: z.string(),
  type: z.enum([
    "CREATED",
    "UPDATED",
    "DUPLICATED",
    "ARCHIVED",
    "DEFAULT_CHANGED",
    "PAYMENT",
    "CANCELED",
    "REVERSED",
    "RECONCILIATION",
  ]),
  description: z.string(),
  createdAt: z.string(),
});
const accountSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["CASH", "CHECKING", "SAVINGS", "DIGITAL_WALLET", "INVESTMENT", "OTHER"]),
  openingBalanceCents: z.number().int().safe(),
  isDefault: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  archivedAt: z.string().optional(),
  history: z.array(historySchema).default([]),
});
const allocationSchema = z.object({
  salaryCents: z.number().int().nonnegative(),
  companyCents: z.number().int().nonnegative(),
  reserveCents: z.number().int().nonnegative(),
  salaryBasisPoints: z.number().int().nonnegative(),
  companyBasisPoints: z.number().int().nonnegative(),
  reserveBasisPoints: z.number().int().nonnegative(),
});
const distributionSchema = z.object({
  salaryBasisPoints: z.number().int().nonnegative(),
  companyBasisPoints: z.number().int().nonnegative(),
  reserveBasisPoints: z.number().int().nonnegative(),
});
const paymentSchema = z.object({
  id: z.string(),
  amountCents: z.number().int().positive(),
  paidAt: z.string(),
  accountId: z.string(),
  method: z.string(),
  notes: z.string(),
  reference: z.string(),
  createdAt: z.string(),
  reversedAt: z.string().optional(),
  reversalReason: z.string().optional(),
  history: z.array(historySchema),
  allocation: allocationSchema.optional(),
  fundingBucket: z.enum(["SALARY", "COMPANY", "RESERVE"]).optional(),
});
const installmentSchema = z.object({
  id: z.string(),
  number: z.number().int().positive(),
  total: z.number().int().positive(),
  amountCents: z.number().int().positive(),
  dueDate: z.string(),
  description: z.string().optional(),
  payments: z.array(paymentSchema),
  canceledAt: z.string().optional(),
  cancellationReason: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  history: z.array(historySchema),
});
const transactionBase = z.object({
  id: z.string(),
  sequence: z.number().int().positive(),
  title: z.string(),
  description: z.string(),
  nature: z.enum(["REVENUE", "EXPENSE", "INVESTMENT"]),
  direction: z.enum(["INCOME", "EXPENSE"]),
  category: z.string(),
  accountId: z.string(),
  competenceDate: z.string(),
  issueDate: z.string(),
  realizedAt: z.string(),
  totalCents: z.number().int().safe().nonnegative(),
  supplier: z.string(),
  notes: z.string(),
  source: z.enum(["MANUAL", "SERVICE_ORDER"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  archivedAt: z.string().optional(),
  history: z.array(historySchema),
});
const transactionV2 = transactionBase.extend({
  kind: z.enum(["REALIZED", "RECEIVABLE", "PAYABLE"]),
  customerName: z.string().optional(),
  installments: z.array(installmentSchema),
  canceledAt: z.string().optional(),
  cancellationReason: z.string().optional(),
});
const transactionV3 = transactionV2.extend({
  clientId: z.string().optional(),
  clientNameSnapshot: z.string().optional(),
  serviceOrderId: z.string().optional(),
  serviceOrderNumberSnapshot: z.string().optional(),
  serviceOrderTitleSnapshot: z.string().optional(),
  serviceOrderValueSnapshotCents: z.number().int().nonnegative().optional(),
  serviceOrderUpdatedAtSnapshot: z.string().optional(),
  sourceId: z.string().optional(),
  purpose: z.string().optional(),
  idempotencyKey: z.string().optional(),
  manuallyModified: z.boolean().optional(),
  reconciliationReviewedAt: z.string().optional(),
  allocation: allocationSchema.optional(),
  fundingBucket: z.enum(["SALARY", "COMPANY", "RESERVE"]).optional(),
});
const stateV1 = z.object({
  version: z.literal(1),
  revision: z.number().int().nonnegative(),
  nextSequence: z.number().int().positive(),
  distribution: distributionSchema.default({ salaryBasisPoints: 4000, companyBasisPoints: 4000, reserveBasisPoints: 2000 }),
  accounts: z.array(accountSchema),
  transactions: z.array(transactionBase),
});
const stateV2 = z.object({
  version: z.literal(2),
  revision: z.number().int().nonnegative(),
  nextSequence: z.number().int().positive(),
  distribution: distributionSchema.default({ salaryBasisPoints: 4000, companyBasisPoints: 4000, reserveBasisPoints: 2000 }),
  accounts: z.array(accountSchema),
  transactions: z.array(transactionV2),
});
const stateV3 = z.object({
  version: z.literal(3),
  revision: z.number().int().nonnegative(),
  nextSequence: z.number().int().positive(),
  distribution: distributionSchema.default({ salaryBasisPoints: 4000, companyBasisPoints: 4000, reserveBasisPoints: 2000 }),
  accounts: z.array(accountSchema),
  transactions: z.array(transactionV3),
});
const KEY = () => scopedBrowserStorageKey("financeiro");
const BACKUP = () => scopedBrowserBackupKey("financeiro");
export interface FinancialStorageAdapter {
  read(): Promise<FinancialStorageState>;
  write(state: FinancialStorageState): Promise<FinancialStorageState>;
}
export class LocalFinancialStorageAdapter implements FinancialStorageAdapter {
  async read() {
    if (typeof window === "undefined") return structuredClone(initialFinancialState);
    copyLegacyBrowserDataToCompany("financeiro");
    const raw = window.localStorage.getItem(KEY());
    if (!raw) {
      window.localStorage.setItem(KEY(), JSON.stringify(initialFinancialState));
      return structuredClone(initialFinancialState);
    }
    const primary = this.parseV3(raw);
    if (primary) return primary;
    const migrated = this.migrateV2(raw) ?? this.migrateV1(raw);
    if (migrated) {
      window.localStorage.setItem(BACKUP(), raw);
      window.localStorage.setItem(KEY(), JSON.stringify(migrated));
      return migrated;
    }
    const backupRaw = window.localStorage.getItem(BACKUP());
    if (backupRaw) {
      const backup =
        this.parseV3(backupRaw) ?? this.migrateV2(backupRaw) ?? this.migrateV1(backupRaw);
      if (backup) {
        window.localStorage.setItem(KEY(), JSON.stringify(backup));
        return backup;
      }
    }
    throw new FinancialStorageError(
      "Os dados financeiros estão corrompidos e não existe backup válido. Nenhum dado foi sobrescrito.",
    );
  }
  async write(state: FinancialStorageState) {
    if (typeof window === "undefined") return state;
    const parsed = stateV3.safeParse(state);
    if (!parsed.success)
      throw new FinancialStorageError(
        "O estado financeiro não é válido e não foi salvo.",
      );
    try {
      const current = window.localStorage.getItem(KEY());
      if (
        current &&
        (this.parseV3(current) || this.migrateV2(current) || this.migrateV1(current))
      )
        window.localStorage.setItem(BACKUP(), current);
      const next = {
        ...parsed.data,
        revision: parsed.data.revision + 1,
      } satisfies FinancialStorageState;
      window.localStorage.setItem(KEY(), JSON.stringify(next));
      return next;
    } catch (error) {
      if (error instanceof FinancialStorageError) throw error;
      throw new FinancialStorageError(
        "Não foi possível salvar os dados financeiros neste dispositivo.",
      );
    }
  }
  private parseV3(raw: string) {
    try {
      const result = stateV3.safeParse(JSON.parse(raw) as unknown);
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  }
  private migrateV2(raw: string): FinancialStorageState | null {
    try {
      const result = stateV2.safeParse(JSON.parse(raw) as unknown);
      if (!result.success) return null;
      return { ...result.data, version: 3, revision: result.data.revision + 1 };
    } catch {
      return null;
    }
  }
  private migrateV1(raw: string): FinancialStorageState | null {
    try {
      const result = stateV1.safeParse(JSON.parse(raw) as unknown);
      if (!result.success) return null;
      return {
        ...result.data,
        version: 3,
        revision: result.data.revision + 1,
        transactions: result.data.transactions.map((item) => ({
          ...item,
          kind: "REALIZED" as const,
          installments: [],
        })),
      };
    } catch {
      return null;
    }
  }
}
class SyncedFinancialStorageAdapter implements FinancialStorageAdapter {
  private readonly local = new LocalFinancialStorageAdapter();
  async read(): Promise<FinancialStorageState> {
    try {
      const remote = await readRemoteModuleState<FinancialStorageState>("financeiro");
      if (remote.data) {
        const parsed = stateV3.safeParse(remote.data);
        if (parsed.success) {
          const normalized = parsed.data as FinancialStorageState;
          if (typeof window !== "undefined") window.localStorage.setItem(KEY(), JSON.stringify(normalized));
          return normalized;
        }
      }
    } catch { /* usa espelho local */ }
    const local = await this.local.read();
    try { await writeRemoteModuleState("financeiro", local); } catch { /* mantém espelho */ }
    return local;
  }
  async write(state: FinancialStorageState): Promise<FinancialStorageState> {
    if (!stateV3.safeParse(state).success) throw new FinancialStorageError("O estado financeiro não é válido e não foi salvo.");
    const next = { ...state, revision: state.revision + 1 } satisfies FinancialStorageState;
    await writeRemoteModuleState("financeiro", next);
    if (typeof window !== "undefined") {
      const current = window.localStorage.getItem(KEY());
      if (current) window.localStorage.setItem(BACKUP(), current);
      window.localStorage.setItem(KEY(), JSON.stringify(next));
    }
    return next;
  }
}
export const financialStorageAdapter: FinancialStorageAdapter = new SyncedFinancialStorageAdapter();
