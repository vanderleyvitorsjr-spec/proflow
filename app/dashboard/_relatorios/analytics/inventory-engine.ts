import type { ReportStockSource } from "@/lib/contracts/relatorios-estoque.contract";
import type { DateRange, ReportFilter, ReportSection } from "../relatorios-types";
import { groupBy, ranking } from "./aggregation-engine";
import { inventoryTurnover } from "./formula-engine";
import { inPeriod, monthKey, monthLabel } from "./date-engine";
import { chart, metric, monthsInRange, rankingItems, toReais } from "./report-builders";
export function inventorySection(
  source: ReportStockSource | undefined,
  period: DateRange,
  previous: DateRange | undefined,
  filters: ReportFilter,
): ReportSection {
  const items = source?.items.filter(
    (item) =>
      (filters.includeArchived || !item.archivedAt) &&
      (!filters.category || item.category === filters.category),
  );
  const movements = source?.movements.filter(
      (item) => !item.canceled && inPeriod(item.date, period),
    ),
    prevMoves = previous
      ? source?.movements.filter(
          (item) => !item.canceled && inPeriod(item.date, previous),
        )
      : undefined;
  const purchases = source?.purchases.filter(
    (item) => !item.canceled && !item.archived && inPeriod(item.purchaseDate, period),
  );
  const consumption = movements?.filter((item) => item.type === "CONSUMPTION"),
    losses = movements?.filter((item) => item.type === "LOSS");
  const patrimony = items?.reduce(
    (sum, item) => sum + item.physicalQuantity * item.averageCostCents,
    0,
  );
  const months = monthsInRange(period);
  return {
    area: "INVENTORY",
    title: "Estoque",
    description: "Valor, consumo e compras sem somar unidades incompatíveis.",
    metrics: [
      metric({
        id: "stock-active",
        title: "Itens ativos",
        current: items?.filter((item) => item.active && !item.archivedAt).length,
        source: ["STOCK"],
        description: "Cadastros ativos de estoque.",
        link: "/dashboard/estoque",
      }),
      metric({
        id: "stock-value",
        title: "Valor patrimonial",
        current: patrimony === undefined ? undefined : patrimony / 100,
        format: "currency",
        source: ["STOCK"],
        description: "Quantidade física × custo médio por item.",
      }),
      metric({
        id: "stock-low",
        title: "Abaixo do mínimo",
        current: items?.filter(
          (item) =>
            item.physicalQuantity > 0 && item.physicalQuantity < item.minimumQuantity,
        ).length,
        inverse: true,
        source: ["STOCK"],
        description: "Itens com saldo positivo abaixo do mínimo.",
      }),
      metric({
        id: "stock-out",
        title: "Sem estoque",
        current: items?.filter((item) => item.physicalQuantity <= 0).length,
        inverse: true,
        source: ["STOCK"],
        description: "Itens sem quantidade física.",
      }),
      metric({
        id: "stock-reserved",
        title: "Com reservas",
        current: items?.filter((item) => item.reservedQuantity > 0).length,
        source: ["STOCK"],
        description: "Itens com reserva ativa.",
      }),
      metric({
        id: "stock-moves",
        title: "Movimentos",
        current: movements?.length,
        previous: prevMoves?.length,
        source: ["STOCK"],
        description: "Movimentos não cancelados no período.",
      }),
      metric({
        id: "stock-consumption",
        title: "Custo de consumo",
        current: toReais(
          consumption?.reduce((sum, item) => sum + item.totalCostCents, 0),
        ),
        format: "currency",
        source: ["STOCK"],
        description: "Somente consumo efetivo; reservas não entram.",
      }),
      metric({
        id: "stock-loss",
        title: "Perdas",
        current: toReais(losses?.reduce((sum, item) => sum + item.totalCostCents, 0)),
        format: "currency",
        inverse: true,
        source: ["STOCK"],
        description: "Valor dos movimentos de perda.",
      }),
      metric({
        id: "stock-purchases",
        title: "Valor comprado",
        current: toReais(purchases?.reduce((sum, item) => sum + item.totalCents, 0)),
        format: "currency",
        source: ["STOCK"],
        description: "Compras emitidas no período.",
      }),
      metric({
        id: "stock-turnover",
        title: "Giro de estoque",
        current: inventoryTurnover(
          consumption?.reduce((sum, item) => sum + item.totalCostCents, 0),
          patrimony,
        ),
        source: ["STOCK"],
        description: "Custo consumido ÷ valor atual do estoque.",
      }),
    ],
    charts: [
      chart(
        "stock-purchases-month",
        "Compras por período",
        months.map(monthLabel),
        [
          {
            name: "Compras",
            values: months.map(
              (month) =>
                purchases
                  ?.filter((item) => monthKey(item.purchaseDate) === month)
                  .reduce((sum, item) => sum + item.totalCents / 100, 0) ?? 0,
            ),
          },
        ],
        "currency",
        ["STOCK"],
        !source,
      ),
    ],
    rankings: [
      {
        id: "stock-category-value",
        title: "Valor por categoria",
        items: rankingItems(
          ranking(
            Object.fromEntries(
              [...groupBy(items ?? [], (item) => item.category)].map(([key, values]) => [
                key,
                values.reduce(
                  (sum, item) =>
                    sum + (item.physicalQuantity * item.averageCostCents) / 100,
                  0,
                ),
              ]),
            ),
          ),
          "currency",
          "/dashboard/estoque",
        ),
      },
      {
        id: "stock-consumed",
        title: "Itens mais consumidos",
        items: rankingItems(
          ranking(
            Object.fromEntries(
              [
                ...groupBy(
                  consumption ?? [],
                  (item) =>
                    items?.find((stock) => stock.id === item.itemId)?.name ?? item.itemId,
                ),
              ].map(([key, values]) => [
                key,
                values.reduce((sum, item) => sum + item.totalCostCents / 100, 0),
              ]),
            ),
          ),
          "currency",
          "/dashboard/estoque",
        ),
      },
      {
        id: "stock-critical",
        title: "Itens críticos",
        items: rankingItems(
          items
            ?.filter((item) => item.physicalQuantity <= item.minimumQuantity)
            .map((item) => [item.name, item.physicalQuantity] as [string, number]) ?? [],
          "number",
          "/dashboard/estoque",
        ),
      },
    ],
  };
}
