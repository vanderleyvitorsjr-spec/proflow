import { listClientsReportAction } from "@/app/dashboard/clientes/actions";
import { runGateway } from "./relatorios-gateway";
export const loadClientsReport = () =>
  runGateway(
    "CLIENTS",
    listClientsReportAction,
    (data) => data.length,
    (data) =>
      data
        .map((item) => item.updatedAt ?? item.createdAt)
        .sort()
        .at(-1),
  );
