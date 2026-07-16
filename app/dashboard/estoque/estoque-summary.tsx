import {
  AlertTriangle,
  CircleDollarSign,
  PackageCheck,
  PackageOpen,
  ShoppingCart,
  Tags,
} from "lucide-react";

import { MetricItem, MetricStrip } from "@/components/ui/metric-strip";

type EstoqueSummaryProps = {
  totalItems: number;
  lowStockItems: number;
  reservedItems: number;
  pendingPurchases: number;
  totalStockValue: number;
  availableQuantity: number;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const numberFormatter = new Intl.NumberFormat("pt-BR");

export function EstoqueSummary({
  totalItems,
  lowStockItems,
  reservedItems,
  pendingPurchases,
  totalStockValue,
  availableQuantity,
}: EstoqueSummaryProps) {
  const cards = [
    {
      label: "Itens cadastrados",
      value: numberFormatter.format(totalItems),
      description: "Produtos ativos no estoque",
      icon: PackageCheck,
      tone: "info" as const,
    },
    {
      label: "Estoque baixo",
      value: numberFormatter.format(lowStockItems),
      description: "Itens abaixo do mínimo",
      icon: AlertTriangle,
      tone: "danger" as const,
    },
    {
      label: "Quantidade reservada",
      value: numberFormatter.format(reservedItems),
      description: "Separada para Ordens de Serviço",
      icon: Tags,
      tone: "warning" as const,
    },
    {
      label: "Compras pendentes",
      value: numberFormatter.format(pendingPurchases),
      description: "Unidades aguardando entrada",
      icon: ShoppingCart,
      tone: "violet" as const,
    },
    {
      label: "Valor armazenado",
      value: currencyFormatter.format(totalStockValue),
      description: "Custo médio do estoque atual",
      icon: CircleDollarSign,
      tone: "success" as const,
    },
    {
      label: "Quantidade disponível",
      value: numberFormatter.format(availableQuantity),
      description: "Saldo livre para utilização",
      icon: PackageOpen,
      tone: "info" as const,
    },
  ];

  return (
    <MetricStrip className="sm:min-w-0 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-2 xl:grid-cols-6">
      {cards.map((item) => {
        const Icon = item.icon;

        return (
          <MetricItem
            key={item.label}
            label={item.label}
            value={item.value}
            description={item.description}
            tone={item.tone}
            icon={<Icon className="h-4 w-4" aria-hidden="true" />}
          />
        );
      })}
    </MetricStrip>
  );
}
