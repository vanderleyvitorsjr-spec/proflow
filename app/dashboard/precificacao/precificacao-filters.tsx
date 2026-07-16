import { Calculator, Filter, LayoutGrid, List, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
  pricingCategoryLabels,
  pricingStatusLabels,
  type PricingListView,
  type PricingView,
} from "./precificacao-data";

type PrecificacaoFiltersProps = {
  view: PricingView;
  listView: PricingListView;
  searchTerm: string;
  categoryFilter: string;
  statusFilter: string;
  marginFilter: string;
  onViewChange: (value: PricingView) => void;
  onListViewChange: (value: PricingListView) => void;
  onSearchChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onMarginFilterChange: (value: string) => void;
};

export function PrecificacaoFilters({
  view,
  listView,
  searchTerm,
  categoryFilter,
  statusFilter,
  marginFilter,
  onViewChange,
  onListViewChange,
  onSearchChange,
  onCategoryFilterChange,
  onStatusFilterChange,
  onMarginFilterChange,
}: PrecificacaoFiltersProps) {
  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-card px-4 py-3 shadow-xs">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Precificação
          </h2>

          <p className="mt-0.5 text-xs text-muted-foreground">
            Calcule custos, margens e preços sustentáveis para cada serviço.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm">
            <Filter className="h-4 w-4" aria-hidden="true" />
            Mais filtros
          </Button>

          <Button
            type="button"
            variant={view === "calculator" ? "default" : "secondary"}
            size="sm"
            onClick={() => onViewChange("calculator")}
          >
            <Calculator className="h-4 w-4" aria-hidden="true" />
            Calculadora
          </Button>

          <Button
            type="button"
            variant={view === "services" ? "default" : "secondary"}
            size="sm"
            onClick={() => onViewChange("services")}
          >
            Serviços
          </Button>

          <Button type="button" size="sm">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nova precificação
          </Button>
        </div>
      </div>

      {view === "services" && (
        <>
          <div className="mt-3 grid gap-2 border-t border-border pt-3 xl:grid-cols-[minmax(0,1fr)_11rem_11rem_11rem]">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />

              <Input
                value={searchTerm}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Pesquisar serviço, código, categoria ou descrição..."
                className="h-9 rounded-[var(--radius-control)] pl-10"
                aria-label="Pesquisar serviços precificados"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(event) => onCategoryFilterChange(event.target.value)}
              className="h-9 rounded-[var(--radius-control)] border border-input bg-background px-3 text-sm font-medium text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              aria-label="Filtrar por categoria"
            >
              <option value="ALL">Todas as categorias</option>

              {Object.entries(pricingCategoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => onStatusFilterChange(event.target.value)}
              className="h-9 rounded-[var(--radius-control)] border border-input bg-background px-3 text-sm font-medium text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              aria-label="Filtrar por status"
            >
              <option value="ALL">Todos os status</option>

              {Object.entries(pricingStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={marginFilter}
              onChange={(event) => onMarginFilterChange(event.target.value)}
              className="h-9 rounded-[var(--radius-control)] border border-input bg-background px-3 text-sm font-medium text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              aria-label="Filtrar por margem"
            >
              <option value="ALL">Todas as margens</option>
              <option value="LOW">Abaixo de 30%</option>
              <option value="HEALTHY">De 30% a 40%</option>
              <option value="HIGH">Acima de 40%</option>
            </select>
          </div>

          <div className="mt-2 flex justify-end">
            <div className="flex rounded-xl border border-border bg-background p-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-2.5",
                  listView === "list" &&
                    "bg-card text-foreground shadow-sm hover:bg-card",
                )}
                onClick={() => onListViewChange("list")}
                aria-pressed={listView === "list"}
              >
                <List className="h-4 w-4" aria-hidden="true" />
                Lista
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-2.5",
                  listView === "cards" &&
                    "bg-card text-foreground shadow-sm hover:bg-card",
                )}
                onClick={() => onListViewChange("cards")}
                aria-pressed={listView === "cards"}
              >
                <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                Cartões
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
