import {
  ArrowRight,
  Clock3,
  MoreHorizontal,
  ReceiptText,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  pricingCategoryLabels,
  pricingStatusLabels,
  type PricingListView,
  type PricingService,
  type PricingStatus,
} from "./precificacao-data";

type PrecificacaoListProps = {
  view: PricingListView;
  services: PricingService[];
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const statusConfig: Record<
  PricingStatus,
  {
    variant:
      | "default"
      | "success"
      | "warning"
      | "neutral"
      | "destructive"
      | "info";
  }
> = {
  DRAFT: {
    variant: "neutral",
  },
  ACTIVE: {
    variant: "success",
  },
  REVIEW: {
    variant: "warning",
  },
  INACTIVE: {
    variant: "destructive",
  },
};

function getTotalCost(service: PricingService) {
  return (
    service.materialCost +
    service.laborCost +
    service.equipmentCost +
    service.displacementCost +
    service.thirdPartyCost
  );
}

function getMarginClass(margin: number) {
  if (margin < 30) {
    return "text-rose-600 dark:text-rose-400";
  }

  if (margin <= 40) {
    return "text-amber-600 dark:text-amber-400";
  }

  return "text-emerald-600 dark:text-emerald-400";
}

function ServiceCard({ service }: { service: PricingService }) {
  const totalCost = getTotalCost(service);
  const status = statusConfig[service.status];

  return (
    <Card className="group overflow-hidden rounded-[var(--radius-card)] border-border bg-card shadow-xs transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-sm dark:hover:border-sky-500/40">
      <CardContent className="p-0">
        <div className="border-b border-border bg-muted/25 p-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#08182c] text-white">
              <ReceiptText className="h-6 w-6" aria-hidden="true" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="line-clamp-2 text-sm font-bold text-foreground">
                    {service.name}
                  </h3>

                  <p className="mt-1 text-xs font-semibold text-sky-600 dark:text-sky-400">
                    {service.code}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="-mr-2 -mt-2 h-8 w-8"
                  aria-label={`Abrir ações de ${service.name}`}
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant={status.variant}>
                  {pricingStatusLabels[service.status]}
                </Badge>

                <Badge variant="outline">
                  {pricingCategoryLabels[service.category]}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 p-3">
          <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
            {service.description}
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-muted/55 p-3">
              <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                Custo total
              </p>
              <p className="mt-1 text-sm font-bold text-foreground">
                {currencyFormatter.format(totalCost)}
              </p>
            </div>

            <div className="rounded-xl bg-muted/55 p-3">
              <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                Margem
              </p>
              <p
                className={cn(
                  "mt-1 text-sm font-bold",
                  getMarginClass(service.marginRate),
                )}
              >
                {numberFormatter.format(service.marginRate)}%
              </p>
            </div>
          </div>

          <div className="space-y-1.5 border-t border-border pt-2.5 text-xs text-muted-foreground">
            <p className="flex items-center gap-2">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              Duração média:{" "}
              {numberFormatter.format(service.averageDurationHours)} h
            </p>

            <p className="flex items-center gap-2">
              <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />
              {service.techniciansRequired} técnico(s)
            </p>
          </div>

          <div className="rounded-lg border border-sky-100 bg-sky-50/60 p-2.5 dark:border-sky-500/20 dark:bg-sky-500/5">
            <p className="text-[0.65rem] font-medium text-sky-700 dark:text-sky-400">
              Preço sugerido
            </p>

            <p className="mt-0.5 text-lg font-bold text-sky-900 dark:text-sky-200">
              {currencyFormatter.format(service.suggestedPrice)}
            </p>

            <div className="mt-3 flex justify-between text-xs text-sky-700 dark:text-sky-400">
              <span>
                Mínimo: {currencyFormatter.format(service.minimumPrice)}
              </span>

              <span>
                Premium: {currencyFormatter.format(service.premiumPrice)}
              </span>
            </div>
          </div>

          <Button type="button" variant="secondary" className="w-full">
            Usar na calculadora
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function PrecificacaoList({
  view,
  services,
}: PrecificacaoListProps) {
  if (view === "cards") {
    return (
      <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}

        {services.length === 0 && (
          <div className="col-span-full flex min-h-48 flex-col items-center justify-center rounded-[var(--radius-card)] border-2 border-dashed border-border bg-card px-6 text-center">
            <ReceiptText
              className="h-8 w-8 text-muted-foreground"
              aria-hidden="true"
            />

            <p className="mt-4 text-sm font-semibold text-foreground">
              Nenhum serviço encontrado
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Ajuste os termos de pesquisa ou os filtros aplicados.
            </p>
          </div>
        )}
      </section>
    );
  }

  return (
    <Card className="overflow-hidden rounded-[var(--radius-card)] border-border bg-card shadow-xs">
      <div className="proflow-scrollbar overflow-x-auto">
        <table className="w-full min-w-[92rem] border-collapse [&_td]:!px-3 [&_td]:!py-2.5 [&_th]:!px-3 [&_th]:!py-2.5">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Serviço
              </th>

              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Categoria
              </th>

              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Operação
              </th>

              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Custo
              </th>

              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Preços
              </th>

              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Margem
              </th>

              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Vendas
              </th>

              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Status
              </th>

              <th className="w-16 px-5 py-3.5" />
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {services.map((service) => {
              const totalCost = getTotalCost(service);
              const status = statusConfig[service.status];

              return (
                <tr
                  key={service.id}
                  className="transition-colors hover:bg-muted/35"
                >
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-foreground">
                      {service.name}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-sky-600 dark:text-sky-400">
                      {service.code}
                    </p>

                    <p className="mt-1 max-w-72 truncate text-xs text-muted-foreground">
                      {service.description}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm text-foreground">
                    {pricingCategoryLabels[service.category]}
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-sm text-foreground">
                      {numberFormatter.format(
                        service.averageDurationHours,
                      )}{" "}
                      h
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {service.techniciansRequired} técnico(s)
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm font-bold text-foreground">
                    {currencyFormatter.format(totalCost)}
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-sm font-bold text-foreground">
                      {currencyFormatter.format(
                        service.suggestedPrice,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {currencyFormatter.format(service.minimumPrice)} a{" "}
                      {currencyFormatter.format(service.premiumPrice)}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "text-sm font-bold",
                        getMarginClass(service.marginRate),
                      )}
                    >
                      {numberFormatter.format(service.marginRate)}%
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm font-semibold text-foreground">
                    {service.timesSold}
                  </td>

                  <td className="px-5 py-4">
                    <Badge variant={status.variant}>
                      {pricingStatusLabels[service.status]}
                    </Badge>

                    <p className="mt-2 text-xs text-muted-foreground">
                      {dateFormatter.format(
                        new Date(service.updatedAt),
                      )}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Abrir ações de ${service.name}`}
                    >
                      <MoreHorizontal
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                    </Button>
                  </td>
                </tr>
              );
            })}

            {services.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-16 text-center">
                  <ReceiptText
                    className="mx-auto h-8 w-8 text-muted-foreground"
                    aria-hidden="true"
                  />

                  <p className="mt-3 text-sm font-semibold text-foreground">
                    Nenhum serviço encontrado
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Ajuste os termos de pesquisa ou os filtros aplicados.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
