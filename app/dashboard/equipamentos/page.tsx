import { requirePermission } from "@/lib/auth/context";
import EquipamentosPageContent from "../_equipamentos/equipamentos-page";

export default async function EquipamentosPage() {
  await requirePermission("EQUIPMENT_VIEW");
  return <EquipamentosPageContent />;
}
