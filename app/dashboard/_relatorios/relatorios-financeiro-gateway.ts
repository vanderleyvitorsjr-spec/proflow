import { listFinancialReportAction } from "@/app/dashboard/financeiro/financeiro-actions";
import { runGateway, unwrap } from "./relatorios-gateway";
export const loadFinancialReport = () =>
  runGateway(
    "FINANCIAL",
    async () => unwrap(await listFinancialReportAction()),
    (data) => data.transactions.length,
    (data) =>
      data.transactions
        .map((item) => item.issueDate)
        .sort()
        .at(-1),
  );
