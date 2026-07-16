import { listAgendaReportAction } from "@/app/dashboard/agenda/agenda-actions";
import { runGateway } from "./relatorios-gateway";
export const loadAgendaReport = () =>
  runGateway(
    "AGENDA",
    listAgendaReportAction,
    (data) => data.length,
    (data) =>
      data
        .map((item) => item.startAt)
        .sort()
        .at(-1),
  );
