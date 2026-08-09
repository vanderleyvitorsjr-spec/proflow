import type { ReportFilter } from "./relatorios-types";
import { generateReport } from "./relatorios-service";
export async function generateReportAction(filters: ReportFilter) {
  try {
    return { ok: true as const, data: await generateReport(filters) };
  } catch (cause) {
    return {
      ok: false as const,
      error:
        cause instanceof Error ? cause.message : "Não foi possível gerar o relatório.",
    };
  }
}
