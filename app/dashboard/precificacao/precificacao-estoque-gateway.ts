import {
  getStockPricingReferenceAction,
  listStockPricingReferencesAction,
} from "../estoque/estoque-actions";
import type { StockPricingReference } from "@/lib/contracts/estoque.contract";

const unwrap = <T>(
  result: { ok: true; data: T } | { ok: false; error: { message: string } },
) => {
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
};

export const pricingStockGateway = {
  async list(): Promise<StockPricingReference[]> {
    return unwrap(await listStockPricingReferencesAction());
  },
  async get(id: string): Promise<StockPricingReference | null> {
    return unwrap(await getStockPricingReferenceAction(id));
  },
};
