import {
  AlertTriangle,
  Boxes,
  CircleDollarSign,
  PackageCheck,
  PackageX,
  Tags,
} from "lucide-react";
import { MetricItem, MetricStrip } from "@/components/ui/metric-strip";
import type { StockPurchase, StockSnapshot } from "./estoque-types";
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
  number = new Intl.NumberFormat("pt-BR");
export function EstoqueSummary({
  items,
  purchases = [],
}: {
  items: StockSnapshot[];
  purchases?: StockPurchase[];
}) {
  const active = items.filter((s) => !s.item.archivedAt),
    period = new Date();
  period.setDate(period.getDate() - 30);
  const cards = [
    {
      label: "Itens ativos",
      value: active.length,
      icon: PackageCheck,
      tone: "info" as const,
    },
    {
      label: "Estoque baixo",
      value: active.filter((s) => s.status === "LOW_STOCK").length,
      icon: AlertTriangle,
      tone: "warning" as const,
    },
    {
      label: "Sem estoque",
      value: active.filter((s) => s.status === "OUT_OF_STOCK").length,
      icon: PackageX,
      tone: "danger" as const,
    },
    {
      label: "Movimentados em 30 dias",
      value: active.filter((s) =>
        s.movements.some((m) => !m.canceledAt && new Date(m.date) >= period),
      ).length,
      icon: Boxes,
      tone: "violet" as const,
    },
    {
      label: "Valor patrimonial",
      value: money.format(active.reduce((sum, s) => sum + s.totalValueCents, 0) / 100),
      icon: CircleDollarSign,
      tone: "success" as const,
    },
    {
      label: "Compras pendentes",
      value: purchases.filter((purchase) =>
        ["ORDERED", "PARTIALLY_RECEIVED"].includes(purchase.status),
      ).length,
      icon: Tags,
      tone: "info" as const,
    },
  ];
  return (
    <MetricStrip className="sm:min-w-0 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <MetricItem
            key={card.label}
            label={card.label}
            value={
              typeof card.value === "number" ? number.format(card.value) : card.value
            }
            tone={card.tone}
            icon={<Icon className="h-4 w-4" />}
          />
        );
      })}
    </MetricStrip>
  );
}
