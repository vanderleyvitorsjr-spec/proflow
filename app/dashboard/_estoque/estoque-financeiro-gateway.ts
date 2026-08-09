import type { StockPurchaseFinancialCreateInput } from "@/lib/contracts/financeiro.contract";
import {
  cancelStockPurchaseFinancialOpenBalanceAction,
  createStockPurchaseFinancialTransactionAction,
  getStockPurchaseFinancialSummaryAction,
  listStockPurchaseFinancialAccountsAction,
} from "../financeiro/financeiro-actions";
const unwrap = <T>(
  result: { ok: true; data: T } | { ok: false; error: { message: string } },
): T => {
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
};
export const stockFinanceGateway = {
  async accounts() {
    return unwrap(await listStockPurchaseFinancialAccountsAction());
  },
  async create(input: StockPurchaseFinancialCreateInput) {
    return unwrap(await createStockPurchaseFinancialTransactionAction(input));
  },
  async summary(purchaseId: string) {
    return unwrap(await getStockPurchaseFinancialSummaryAction(purchaseId));
  },
  async cancelOpen(id: string, reason: string) {
    return unwrap(await cancelStockPurchaseFinancialOpenBalanceAction(id, reason));
  },
};
