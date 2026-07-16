import { listStockReportAction } from "@/app/dashboard/estoque/estoque-actions";
import { runGateway, unwrap } from "./relatorios-gateway";
export const loadStockReport = () =>
  runGateway(
    "STOCK",
    async () => unwrap(await listStockReportAction()),
    (data) => data.items.length + data.movements.length + data.purchases.length,
    (data) =>
      data.items
        .map((item) => item.updatedAt)
        .sort()
        .at(-1),
  );
