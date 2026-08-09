import type { ReportEquipmentSource } from "@/lib/contracts/relatorios-equipamentos.contract";
import type { DateRange, ReportFilter, ReportSection } from "../relatorios-types";
import { countBy, ranking } from "./aggregation-engine";
import { inPeriod, monthKey, monthLabel } from "./date-engine";
import { chart, metric, monthsInRange, rankingItems, toReais } from "./report-builders";
export function assetsSection(
  source: ReportEquipmentSource | undefined,
  period: DateRange,
  previous: DateRange | undefined,
  filters: ReportFilter,
): ReportSection {
  const assets = source?.assets.filter(
    (item) =>
      (filters.includeArchived || !item.archivedAt) &&
      (!filters.assetOwnership || item.ownership === filters.assetOwnership) &&
      (!filters.category || item.category === filters.category) &&
      (!filters.status || item.status === filters.status),
  );
  const maintenance = source?.maintenance.filter(
      (item) => !item.canceledAt && inPeriod(item.scheduledAt, period),
    ),
    prevMaintenance = previous
      ? source?.maintenance.filter(
          (item) => !item.canceledAt && inPeriod(item.scheduledAt, previous),
        )
      : undefined;
  const own = assets?.filter((item) => item.ownership === "COMPANY"),
    today = new Date().toISOString().slice(0, 10),
    in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    months = monthsInRange(period);
  return {
    area: "ASSETS",
    title: "Equipamentos",
    description: "Patrimônio próprio separado de ativos de clientes e terceiros.",
    metrics: [
      metric({
        id: "assets-own",
        title: "Ativos próprios",
        current: own?.length,
        source: ["EQUIPMENT"],
        description: "Ativos pertencentes à empresa.",
        link: "/dashboard/equipamentos",
      }),
      metric({
        id: "assets-client",
        title: "Ativos de clientes",
        current: assets?.filter((item) => item.ownership === "CUSTOMER").length,
        source: ["EQUIPMENT"],
        description: "Ativos sob responsabilidade do cliente.",
      }),
      metric({
        id: "assets-third",
        title: "Ativos de terceiros",
        current: assets?.filter((item) => item.ownership === "THIRD_PARTY").length,
        source: ["EQUIPMENT"],
        description: "Ativos de terceiros.",
      }),
      metric({
        id: "assets-acquisition",
        title: "Valor de aquisição próprio",
        current: toReais(
          own?.reduce((sum, item) => sum + item.acquisitionValueCents, 0),
        ),
        format: "currency",
        source: ["EQUIPMENT"],
        description: "Aquisição apenas dos ativos próprios.",
      }),
      metric({
        id: "assets-current",
        title: "Patrimônio atual",
        current: toReais(own?.reduce((sum, item) => sum + item.currentValueCents, 0)),
        format: "currency",
        source: ["EQUIPMENT"],
        description: "Valor atual apenas dos ativos próprios.",
      }),
      metric({
        id: "assets-depreciation",
        title: "Depreciação acumulada",
        current: toReais(
          own?.reduce((sum, item) => sum + item.accumulatedDepreciationCents, 0),
        ),
        format: "currency",
        source: ["EQUIPMENT"],
        description: "Variação patrimonial; não é saída de caixa.",
      }),
      metric({
        id: "assets-maintenance",
        title: "Em manutenção",
        current: assets?.filter((item) => item.status === "UNDER_MAINTENANCE").length,
        inverse: true,
        source: ["EQUIPMENT"],
        description: "Ativos atualmente em manutenção.",
      }),
      metric({
        id: "assets-warranty",
        title: "Garantias vencendo",
        current: assets?.filter(
          (item) =>
            item.warrantyEndDate &&
            item.warrantyEndDate >= today &&
            item.warrantyEndDate <= in30,
        ).length,
        source: ["EQUIPMENT"],
        description: "Garantias com vencimento em até 30 dias.",
      }),
      metric({
        id: "maintenance-cost",
        title: "Custo técnico de manutenção",
        current: toReais(maintenance?.reduce((sum, item) => sum + item.costCents, 0)),
        previous: toReais(
          prevMaintenance?.reduce((sum, item) => sum + item.costCents, 0),
        ),
        format: "currency",
        source: ["EQUIPMENT"],
        description:
          "Custo técnico registrado; vínculo financeiro é identificado separadamente.",
      }),
      metric({
        id: "asset-use",
        title: "Uso por OS",
        current: source?.links.filter(
          (item) => !item.unlinkedAt && inPeriod(item.linkedAt, period),
        ).length,
        source: ["EQUIPMENT", "ORDERS"],
        description: "Vínculos ativos criados no período.",
      }),
    ],
    charts: [
      chart(
        "maintenance-month",
        "Manutenções por período",
        months.map(monthLabel),
        [
          {
            name: "Manutenções",
            values: months.map(
              (month) =>
                maintenance?.filter((item) => monthKey(item.scheduledAt) === month)
                  .length ?? 0,
            ),
          },
        ],
        "number",
        ["EQUIPMENT"],
        !source,
      ),
    ],
    rankings: [
      {
        id: "assets-status",
        title: "Status dos ativos",
        items: rankingItems(
          ranking(countBy(assets ?? [], (item) => item.status)),
          "number",
          "/dashboard/equipamentos",
        ),
      },
      {
        id: "assets-condition",
        title: "Condição",
        items: rankingItems(
          ranking(countBy(assets ?? [], (item) => item.condition)),
          "number",
          "/dashboard/equipamentos",
        ),
      },
      {
        id: "asset-usage",
        title: "Ativos mais utilizados",
        items: rankingItems(
          ranking(
            countBy(
              source?.links.filter((item) => !item.unlinkedAt) ?? [],
              (item) => item.assetId,
            ),
          ),
          "number",
          "/dashboard/equipamentos",
        ),
      },
    ],
  };
}
