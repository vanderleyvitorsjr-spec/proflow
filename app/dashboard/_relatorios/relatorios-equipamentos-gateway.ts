import { listEquipmentReportAction } from "@/app/dashboard/_equipamentos/equipamentos-actions";
import { runGateway, unwrap } from "./relatorios-gateway";
export const loadEquipmentReport = () =>
  runGateway(
    "EQUIPMENT",
    async () => unwrap(await listEquipmentReportAction()),
    (data) => data.assets.length + data.maintenance.length + data.links.length,
    (data) =>
      data.assets
        .map((item) => item.updatedAt)
        .sort()
        .at(-1),
  );
