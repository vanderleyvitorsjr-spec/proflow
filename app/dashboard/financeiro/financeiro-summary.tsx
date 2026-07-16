import {
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { MetricItem, MetricStrip } from "@/components/ui/metric-strip";
import { formatMoneyCents } from "./financeiro-money";
export function FinanceiroSummary({
  totalBalanceCents,
  incomeCents,
  expenseCents,
  investmentCents,
  resultCents,
  receivableOpenCents = 0,
  payableOpenCents = 0,
}: {
  totalBalanceCents: number;
  incomeCents: number;
  expenseCents: number;
  investmentCents: number;
  resultCents: number;
  receivableOpenCents?: number;
  payableOpenCents?: number;
}) {
  const metrics = [
    {
      label: "Saldo consolidado",
      value: formatMoneyCents(totalBalanceCents),
      icon: WalletCards,
      tone: "info" as const,
    },
    {
      label: "Receitas realizadas",
      value: formatMoneyCents(incomeCents),
      icon: ArrowUpRight,
      tone: "success" as const,
    },
    {
      label: "Despesas realizadas",
      value: formatMoneyCents(expenseCents),
      icon: ArrowDownRight,
      tone: "danger" as const,
    },
    {
      label: "Investimentos",
      value: formatMoneyCents(investmentCents),
      icon: TrendingUp,
      tone: "violet" as const,
    },
    {
      label: "Resultado líquido",
      value: formatMoneyCents(resultCents),
      icon: CircleDollarSign,
      tone: resultCents >= 0 ? ("success" as const) : ("danger" as const),
    },
    {
      label: "A receber",
      value: formatMoneyCents(receivableOpenCents),
      icon: ArrowUpRight,
      tone: "warning" as const,
    },
    {
      label: "A pagar",
      value: formatMoneyCents(payableOpenCents),
      icon: ArrowDownRight,
      tone: "warning" as const,
    },
  ];
  return (
    <MetricStrip
      className="sm:min-w-0 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-2 xl:grid-cols-7"
      aria-label="Indicadores financeiros"
    >
      {metrics.map((item) => {
        const Icon = item.icon;
        return (
          <MetricItem
            key={item.label}
            label={item.label}
            value={item.value}
            tone={item.tone}
            icon={<Icon className="h-4 w-4" aria-hidden="true" />}
          />
        );
      })}
    </MetricStrip>
  );
}
