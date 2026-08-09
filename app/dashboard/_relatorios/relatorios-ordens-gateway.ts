import { listServiceOrdersReportAction } from "@/app/dashboard/_ordens/ordens-actions";
import { runGateway } from "./relatorios-gateway";
export const loadOrdersReport = () =>
  runGateway(
    "ORDERS",
    listServiceOrdersReportAction,
    (data) => data.length,
    (data) =>
      data
        .map((item) => item.updatedAt)
        .sort()
        .at(-1),
  );
