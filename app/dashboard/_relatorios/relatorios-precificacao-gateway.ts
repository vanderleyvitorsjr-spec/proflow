import { listPricingReportAction } from "@/app/dashboard/precificacao/precificacao-actions";
import { runGateway, unwrap } from "./relatorios-gateway";
export const loadPricingReport = () =>
  runGateway(
    "PRICING",
    async () => unwrap(await listPricingReportAction()),
    (data) => data.simulations.length,
    (data) =>
      data.simulations
        .map((item) => item.updatedAt)
        .sort()
        .at(-1),
  );
