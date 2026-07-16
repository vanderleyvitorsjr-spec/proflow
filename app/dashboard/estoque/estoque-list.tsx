import {
  AlertTriangle,
  ArrowRight,
  Barcode,
  Boxes,
  MapPin,
  MoreHorizontal,
  Package,
  ShoppingCart,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import {
  stockCategoryLabels,
  stockStatusLabels,
  stockUnitLabels,
  type StockItem,
  type StockItemStatus,
  type StockView,
} from "./estoque-data";

type EstoqueListProps = {
  view: StockView;
  items: StockItem[];
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const statusConfig: Record<
  StockItemStatus,
  {
    variant:
      | "default"
      | "success"
      | "warning"
      | "neutral"
      | "destructive"
      | "info";
    progressClass: string;
  }
> = {
  AVAILABLE: {
    variant: "success",
    progressClass: "bg-emerald-500",
  },
  LOW_STOCK: {
    variant: "warning",
    progressClass: "bg-amber-500",
  },
  OUT_OF_STOCK: {
    variant: "destructive",
    progressClass: "bg-rose-500",
  },
  RESERVED: {
    variant: "info",
    progressClass: "bg-sky-500",
  },
  INACTIVE: {
    variant: "neutral",
    progressClass: "bg-slate-400",
  },
};

function formatQuantity(value: number, unit: StockItem["unit"]) {
  return `${numberFormatter.format(value)} ${stockUnitLabels[unit]}`;
}

function getAvailableQuantity(item: StockItem) {
  return Math.max(0, item.currentQuantity - item.reservedQuantity);
}

function getStockPercentage(item: StockItem) {
  const reference = Math.max(item.minimumQuantity * 2, 1);

  return Math.min(100, (item.currentQuantity / reference) * 100);
}

function StockCard({ item }: { item: StockItem }) {
  const status = statusConfig[item.status];
  const availableQuantity = getAvailableQuantity(item);
  const totalValue = item.currentQuantity * item.averageCost;

  return (
    <Card className="group overflow-hidden rounded-[var(--radius-card)] border-border bg-card shadow-xs transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-sm dark:hover:border-sky-500/40">
      <CardContent className="p-0">
        <div className="border-b border-border bg-muted/25 p-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#08182c] text-white">
              <Package className="h-6 w-6" aria-hidden="true" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="line-clamp-2 text-sm font-bold text-foreground">
                    {item.name}
                  </h3>

                  <p className="mt-1 text-xs font-medium text-sky-600 dark:text-sky-400">
                    {item.internalCode}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="-mr-2 -mt-2 h-8 w-8"
                  aria-label={`Abrir ações de ${item.name}`}
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant={status.variant}>
                  {stockStatusLabels[item.status]}
                </Badge>

                <Badge variant="outline">
                  {stockCategoryLabels[item.category]}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 p-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-muted/55 p-3">
              <p className="text-[0.62rem] font-medium uppercase tracking-wide text-muted-foreground">
                Atual
              </p>
              <p className="mt-1 text-sm font-bold text-foreground">
                {formatQuantity(item.currentQuantity, item.unit)}
              </p>
            </div>

            <div className="rounded-xl bg-muted/55 p-3">
              <p className="text-[0.62rem] font-medium uppercase tracking-wide text-muted-foreground">
                Reservado
              </p>
              <p className="mt-1 text-sm font-bold text-foreground">
                {formatQuantity(item.reservedQuantity, item.unit)}
              </p>
            </div>

            <div className="rounded-xl bg-muted/55 p-3">
              <p className="text-[0.62rem] font-medium uppercase tracking-wide text-muted-foreground">
                Disponível
              </p>
              <p className="mt-1 text-sm font-bold text-foreground">
                {formatQuantity(availableQuantity, item.unit)}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-muted-foreground">
                Nível de estoque
              </span>
              <span className="font-semibold text-foreground">
                Mínimo: {formatQuantity(item.minimumQuantity, item.unit)}
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full",
                  status.progressClass,
                )}
                style={{ width: `${getStockPercentage(item)}%` }}
              />
            </div>
          </div>

          <div className="space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
            <p className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {item.location}
            </p>

            <p className="flex items-center gap-2">
              <Barcode className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {item.barcode ?? "Código de barras não informado"}
            </p>

            {item.pendingPurchaseQuantity > 0 && (
              <p className="flex items-center gap-2 font-semibold text-violet-600 dark:text-violet-400">
                <ShoppingCart
                  className="h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />
                {formatQuantity(
                  item.pendingPurchaseQuantity,
                  item.unit,
                )}{" "}
                em compra
              </p>
            )}
          </div>

          <div className="flex items-end justify-between gap-3 rounded-lg bg-muted/55 p-2.5">
            <div>
              <p className="text-[0.65rem] text-muted-foreground">
                Valor armazenado
              </p>

              <p className="mt-1 text-sm font-bold text-foreground">
                {currencyFormatter.format(totalValue)}
              </p>
            </div>

            <Button type="button" variant="secondary" size="sm">
              Ver item
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function EstoqueList({ view, items }: EstoqueListProps) {
  if (view === "cards") {
    return (
      <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {items.map((item) => (
          <StockCard key={item.id} item={item} />
        ))}

        {items.length === 0 && (
          <EmptyState
            className="col-span-full"
            size="compact"
            icon={<Boxes className="h-5 w-5" aria-hidden="true" />}
            title="Nenhum item encontrado"
            description="Ajuste os termos de pesquisa ou os filtros aplicados."
          />
        )}
      </section>
    );
  }

  return (
    <Table density="compact" scrollHint className="min-w-[92rem]">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Item
              </th>

              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Categoria
              </th>

              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Quantidades
              </th>

              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Estoque mínimo
              </th>

              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Localização
              </th>

              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Custo médio
              </th>

              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Valor total
              </th>

              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Status
              </th>

              <th className="w-16 px-5 py-3.5" />
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {items.map((item) => {
              const status = statusConfig[item.status];
              const availableQuantity = getAvailableQuantity(item);
              const totalValue = item.currentQuantity * item.averageCost;

              return (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-muted/35"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#08182c] text-white">
                        <Package className="h-5 w-5" aria-hidden="true" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {item.name}
                        </p>

                        <p className="mt-1 text-xs font-medium text-sky-600 dark:text-sky-400">
                          {item.internalCode}
                        </p>

                        <p className="mt-1 max-w-56 truncate text-[0.68rem] text-muted-foreground">
                          {[item.brand, item.model]
                            .filter(Boolean)
                            .join(" · ") || "Marca e modelo não informados"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm text-foreground">
                    {stockCategoryLabels[item.category]}
                  </td>

                  <td className="px-5 py-4">
                    <div className="space-y-1 text-xs">
                      <p className="text-foreground">
                        Atual:{" "}
                        <strong>
                          {formatQuantity(item.currentQuantity, item.unit)}
                        </strong>
                      </p>

                      <p className="text-muted-foreground">
                        Reservado:{" "}
                        {formatQuantity(item.reservedQuantity, item.unit)}
                      </p>

                      <p className="text-emerald-600 dark:text-emerald-400">
                        Disponível:{" "}
                        {formatQuantity(availableQuantity, item.unit)}
                      </p>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-foreground">
                      {formatQuantity(item.minimumQuantity, item.unit)}
                    </p>

                    {item.currentQuantity <= item.minimumQuantity && (
                      <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                        <AlertTriangle
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        Reposição necessária
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-sm text-foreground">
                      {item.location}
                    </p>

                    <p className="mt-1 max-w-48 truncate text-xs text-muted-foreground">
                      {item.supplier ?? "Fornecedor não informado"}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-foreground">
                      {currencyFormatter.format(item.averageCost)}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Último: {currencyFormatter.format(item.lastCost)}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm font-bold text-foreground">
                    {currencyFormatter.format(totalValue)}
                  </td>

                  <td className="px-5 py-4">
                    <Badge variant={status.variant}>
                      {stockStatusLabels[item.status]}
                    </Badge>

                    {item.pendingPurchaseQuantity > 0 && (
                      <p className="mt-2 text-xs font-semibold text-violet-600 dark:text-violet-400">
                        {formatQuantity(
                          item.pendingPurchaseQuantity,
                          item.unit,
                        )}{" "}
                        em compra
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Abrir ações de ${item.name}`}
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

            {items.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-16 text-center">
                  <Boxes
                    className="mx-auto h-8 w-8 text-muted-foreground"
                    aria-hidden="true"
                  />

                  <p className="mt-3 text-sm font-semibold text-foreground">
                    Nenhum item encontrado
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Ajuste os termos de pesquisa ou os filtros aplicados.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
    </Table>
  );
}
