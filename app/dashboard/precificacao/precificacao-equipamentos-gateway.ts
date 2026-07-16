import {
  getEquipmentPricingReferenceAction,
  listEquipmentPricingReferencesAction,
} from "../equipamentos/equipamentos-actions";
import type { EquipmentPricingReference } from "@/lib/contracts/equipamentos.contract";

const unwrap = <T>(
  result: { ok: true; data: T } | { ok: false; error: { message: string } },
) => {
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
};

export const pricingEquipmentGateway = {
  async list(): Promise<EquipmentPricingReference[]> {
    return unwrap(await listEquipmentPricingReferencesAction());
  },
  async get(id: string): Promise<EquipmentPricingReference | null> {
    return unwrap(await getEquipmentPricingReferenceAction(id));
  },
};
