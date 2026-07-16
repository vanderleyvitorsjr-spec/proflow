"use client";
import { calculatePricing } from "./precificacao-selectors";
import type { PricingSimulation } from "./precificacao-types";
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export function PricingComparison({ simulations }: { simulations: PricingSimulation[] }) {
  if (simulations.length < 2)
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Crie ao menos dois cenários no mesmo grupo para comparar.
      </div>
    );
  return (
    <div className="proflow-scrollbar overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[48rem] text-sm">
        <thead>
          <tr className="bg-muted/40">
            <th className="p-3 text-left">Indicador</th>
            {simulations.slice(0, 3).map((item) => (
              <th key={item.id} className="p-3 text-right">
                {item.scenarioLabel}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            ["Custo total", "totalCostCents"],
            ["Materiais", "material"],
            ["Mão de obra", "labor"],
            ["Equipamentos", "equipment"],
            ["Deslocamento", "travel"],
            ["Overhead", "overheadCents"],
            ["Preço mínimo", "minimumPriceCents"],
            ["Recomendado", "recommendedPriceCents"],
            ["Premium", "premiumPriceCents"],
            ["Final", "promotionalPriceCents"],
            ["Lucro", "profitCents"],
            ["Materiais reais", "realMaterial"],
            ["Equipamentos reais", "realEquipment"],
            ["Snapshots externos", "snapshots"],
            ["Modificados manualmente", "manualCount"],
          ].map(([label, key]) => (
            <tr key={key} className="border-t">
              <td className="p-3">{label}</td>
              {simulations.slice(0, 3).map((item) => {
                const result = calculatePricing(
                  item.costComponents,
                  item.commercialRules,
                );
                const countKey = ["snapshots", "manualCount"].includes(key),
                  value =
                    key in result
                      ? Number(result[key as keyof typeof result])
                      : key === "realMaterial"
                        ? item.costComponents
                            .filter((c) => c.stockItemId)
                            .reduce((s, c) => s + c.totalCostCents, 0)
                        : key === "realEquipment"
                          ? item.costComponents
                              .filter((c) => c.equipmentId)
                              .reduce((s, c) => s + c.totalCostCents, 0)
                          : key === "snapshots"
                            ? item.costComponents.filter((c) => c.sourceSnapshot).length
                            : key === "manualCount"
                              ? item.costComponents.filter((c) => c.manuallyModified)
                                  .length
                              : item.costComponents
                                  .filter((c) => c.type === String(key).toUpperCase())
                                  .reduce((s, c) => s + c.totalCostCents, 0);
                return (
                  <td key={item.id} className="p-3 text-right tabular-nums">
                    {countKey ? value.toLocaleString("pt-BR") : money.format(value / 100)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
