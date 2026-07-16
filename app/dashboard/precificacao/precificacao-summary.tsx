import {
  BadgeDollarSign,
  CircleDollarSign,
  FileCheck2,
  FileClock,
  Percent,
  ReceiptText,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PrecificacaoSummaryProps = {
  servicesCount: number;
  averageMargin: number;
  averageTicket: number;
  activeServices: number;
  reviewServices: number;
  estimatedProfit: number;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const numberFormatter = new Intl.NumberFormat("pt-BR");

const percentageFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function PrecificacaoSummary({
  servicesCount,
  averageMargin,
  averageTicket,
  activeServices,
  reviewServices,
  estimatedProfit,
}: PrecificacaoSummaryProps) {
  const cards = [
    {
      label: "Serviços cadastrados",
      value: numberFormatter.format(servicesCount),
      description: "Modelos disponíveis para orçamento",
      icon: ReceiptText,
      iconClass: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
    },
    {
      label: "Margem média",
      value: `${percentageFormatter.format(averageMargin)}%`,
      description: "Margem configurada nos serviços",
      icon: Percent,
      iconClass:
        "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    },
    {
      label: "Ticket médio",
      value: currencyFormatter.format(averageTicket),
      description: "Preço sugerido médio",
      icon: BadgeDollarSign,
      iconClass:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    },
    {
      label: "Serviços ativos",
      value: numberFormatter.format(activeServices),
      description: "Disponíveis para novas propostas",
      icon: FileCheck2,
      iconClass: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    },
    {
      label: "Em revisão",
      value: numberFormatter.format(reviewServices),
      description: "Precisam de validação de custos",
      icon: FileClock,
      iconClass: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    },
    {
      label: "Lucro estimado",
      value: currencyFormatter.format(estimatedProfit),
      description: "Estimativa sobre os preços sugeridos",
      icon: CircleDollarSign,
      iconClass: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
    },
  ];

  return (
    <section className="grid overflow-hidden rounded-[var(--radius-card)] border border-border bg-card shadow-xs sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 [&>*]:border-b [&>*]:border-r [&>*]:border-border">
      {cards.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.label} className="rounded-none border-0 bg-card shadow-none">
            <CardContent className="flex min-h-20 items-center gap-3 p-3">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  item.iconClass,
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-muted-foreground">
                  {item.label}
                </p>

                <p className="mt-0.5 truncate text-base font-bold tracking-tight text-foreground">
                  {item.value}
                </p>

                <p className="mt-0.5 truncate text-[0.65rem] text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
