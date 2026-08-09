import { requirePermission } from "@/lib/auth/context";
import { EquipmentDetail } from "../../_equipamentos/[id]/equipamento-detail";

export default async function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("EQUIPMENT_VIEW");
  const { id } = await params;
  return <EquipmentDetail id={id} />;
}
