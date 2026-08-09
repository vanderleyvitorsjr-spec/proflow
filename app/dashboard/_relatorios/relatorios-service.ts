import { loadAgendaReport } from "./relatorios-agenda-gateway";
import { loadClientsReport } from "./relatorios-clientes-gateway";
import { loadCrmReport } from "./relatorios-crm-gateway";
import { loadEquipmentReport } from "./relatorios-equipamentos-gateway";
import { loadFinancialReport } from "./relatorios-financeiro-gateway";
import { loadOrdersReport } from "./relatorios-ordens-gateway";
import { loadPricingReport } from "./relatorios-precificacao-gateway";
import { loadStockReport } from "./relatorios-estoque-gateway";
import { comparisonRange, rangeForPreset } from "./analytics/date-engine";
import { commercialSection } from "./analytics/commercial-engine";
import { operationalSection } from "./analytics/operational-engine";
import { financialSection } from "./analytics/financial-engine";
import { inventorySection } from "./analytics/inventory-engine";
import { assetsSection } from "./analytics/assets-engine";
import { pricingSection } from "./analytics/pricing-engine";
import type { GatewayResult, ReportDataset, ReportFilter } from "./relatorios-types";
import { projectCashFlow } from "./analytics/cash-projection-engine";
export async function generateReport(
  filters: ReportFilter,
  referenceDate = new Date(),
): Promise<ReportDataset> {
  const started = performance.now(),
    period = rangeForPreset(filters.preset, referenceDate, {
      start: filters.startDate,
      end: filters.endDate,
    }),
    comparisonPeriod = comparisonRange(filters, period);
  const settled = await Promise.allSettled([
    loadCrmReport(),
    loadClientsReport(),
    loadOrdersReport(),
    loadAgendaReport(),
    loadFinancialReport(),
    loadStockReport(),
    loadEquipmentReport(),
    loadPricingReport(),
  ]);
  const values = settled.map((item) =>
    item.status === "fulfilled" ? item.value : undefined,
  );
  const [crm, clients, orders, agenda, financial, stock, equipment, pricing] = values as [
    GatewayResult<Awaited<ReturnType<typeof loadCrmReport>>["data"]> | undefined,
    GatewayResult<Awaited<ReturnType<typeof loadClientsReport>>["data"]> | undefined,
    GatewayResult<Awaited<ReturnType<typeof loadOrdersReport>>["data"]> | undefined,
    GatewayResult<Awaited<ReturnType<typeof loadAgendaReport>>["data"]> | undefined,
    GatewayResult<Awaited<ReturnType<typeof loadFinancialReport>>["data"]> | undefined,
    GatewayResult<Awaited<ReturnType<typeof loadStockReport>>["data"]> | undefined,
    GatewayResult<Awaited<ReturnType<typeof loadEquipmentReport>>["data"]> | undefined,
    GatewayResult<Awaited<ReturnType<typeof loadPricingReport>>["data"]> | undefined,
  ];
  const sourceStatus = values.flatMap((item) => (item?.status ? [item.status] : []));
  const sections = [
    commercialSection(crm?.data, clients?.data, period, comparisonPeriod, filters),
    operationalSection(orders?.data, agenda?.data, period, comparisonPeriod, filters),
    financialSection(financial?.data, period, comparisonPeriod, filters),
    inventorySection(stock?.data, period, comparisonPeriod, filters),
    assetsSection(equipment?.data, period, comparisonPeriod, filters),
    pricingSection(pricing?.data, period, comparisonPeriod, filters),
  ].filter((section) => filters.area === "ALL" || section.area === filters.area);
  return {
    generatedAt: new Date().toISOString(),
    executionTimeMs: Math.round(performance.now() - started),
    period,
    comparisonPeriod,
    filters,
    sourceStatus,
    sections,
    cashProjection: projectCashFlow(financial?.data, referenceDate),
  };
}
