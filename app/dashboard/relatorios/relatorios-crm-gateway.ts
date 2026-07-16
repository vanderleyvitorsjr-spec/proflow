import { listCrmReportAction } from "@/features/crm/crm-actions";
import { runGateway } from "./relatorios-gateway";
export const loadCrmReport = () =>
  runGateway(
    "CRM",
    listCrmReportAction,
    (data) => data.length,
    (data) =>
      data
        .map((item) => item.updatedAt)
        .sort()
        .at(-1),
  );
