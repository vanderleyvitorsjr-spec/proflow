import {
  cancelEquipmentFinancialOpenBalanceAction,
  createEquipmentFinancialTransactionAction,
  getEquipmentFinancialTransactionAction,
  getEquipmentFinancialSummaryAction,
  listEquipmentFinancialAccountsAction,
} from "../financeiro/financeiro-actions";
import type {
  EquipmentFinancialCreateInput,
  EquipmentFinancialTransactionReference,
} from "@/lib/contracts/financeiro.contract";

function unwrap<T>(result: { ok: true; data: T } | { ok: false; error: { message: string } }): T {
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}
export const equipmentFinanceiroGateway = {
  async listAccounts() { return unwrap(await listEquipmentFinancialAccountsAction()); },
  async getTransaction(id: string) { return unwrap(await getEquipmentFinancialTransactionAction(id)); },
  async getSummary(sourceId: string, purpose: string) { return unwrap(await getEquipmentFinancialSummaryAction(sourceId, purpose)); },
  async create(input: EquipmentFinancialCreateInput) { return unwrap(await createEquipmentFinancialTransactionAction(input)); },
  async cancelOpenBalance(id: string, reason: string) { return unwrap(await cancelEquipmentFinancialOpenBalanceAction(id, reason)); },
};
export type EquipmentFinanceiroTransaction = EquipmentFinancialTransactionReference;
