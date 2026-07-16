import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Filter,
  LayoutGrid,
  List,
  Plus,
  Search,
  Warehouse,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderHeading,
  PageHeaderIcon,
  PageHeaderIdentity,
  PageHeaderToolbar,
} from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  stockCategoryLabels,
  stockStatusLabels,
  type StockView,
} from "./estoque-data";

type EstoqueFiltersProps = {
  view: StockView;
  searchTerm: string;
  statusFilter: string;
  categoryFilter: string;
  locationFilter: string;
  onViewChange: (view: StockView) => void;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onLocationFilterChange: (value: string) => void;
};

const locations = [
  "Prateleira A1",
  "Prateleira B2",
  "Gaveta B4",
  "Gaveta B5",
  "Gaveta C1",
  "Área controlada D1",
  "Prateleira E2",
  "Armário de segurança",
  "Prateleira F1",
];

export function EstoqueFilters({
  view,
  searchTerm,
  statusFilter,
  categoryFilter,
  locationFilter,
  onViewChange,
  onSearchChange,
  onStatusFilterChange,
  onCategoryFilterChange,
  onLocationFilterChange,
}: EstoqueFiltersProps) {
  return (
    <PageHeader>
      <PageHeaderContent>
        <PageHeaderIdentity>
          <PageHeaderIcon>
            <Warehouse className="h-5 w-5" aria-hidden="true" />
          </PageHeaderIcon>
          <PageHeaderHeading
            title="Estoque"
            description="Controle materiais, reservas, entradas, saídas e custos."
          />
        </PageHeaderIdentity>

        <PageHeaderActions>
          <Button type="button" variant="secondary" size="sm">
            <ArrowUpFromLine className="h-4 w-4" aria-hidden="true" />
            Registrar saída
          </Button>

          <Button type="button" variant="secondary" size="sm">
            <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
            Registrar entrada
          </Button>

          <Button type="button" variant="secondary" size="sm">
            <Filter className="h-4 w-4" aria-hidden="true" />
            Mais filtros
          </Button>

          <div className="flex rounded-lg border border-border bg-background p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-2.5",
                view === "list" &&
                  "bg-card text-foreground shadow-sm hover:bg-card",
              )}
              onClick={() => onViewChange("list")}
              aria-pressed={view === "list"}
            >
              <List className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Lista</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-2.5",
                view === "cards" &&
                  "bg-card text-foreground shadow-sm hover:bg-card",
              )}
              onClick={() => onViewChange("cards")}
              aria-pressed={view === "cards"}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Cartões</span>
            </Button>
          </div>

          <Button type="button" size="sm">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo item
          </Button>
        </PageHeaderActions>
      </PageHeaderContent>

      <PageHeaderToolbar className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_11rem_11rem_12rem]">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />

          <Input
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Pesquisar item, código, marca, modelo, fornecedor ou localização..."
            className="h-9 rounded-[var(--radius-control)] pl-10"
            aria-label="Pesquisar estoque"
          />
        </div>

        <Select
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value)}
          className="h-9 text-sm font-medium"
          aria-label="Filtrar por status"
        >
          <option value="ALL">Todos os status</option>

          {Object.entries(stockStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>

        <Select
          value={categoryFilter}
          onChange={(event) =>
            onCategoryFilterChange(event.target.value)
          }
          className="h-9 text-sm font-medium"
          aria-label="Filtrar por categoria"
        >
          <option value="ALL">Todas as categorias</option>

          {Object.entries(stockCategoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>

        <Select
          value={locationFilter}
          onChange={(event) =>
            onLocationFilterChange(event.target.value)
          }
          className="h-9 text-sm font-medium"
          aria-label="Filtrar por localização"
        >
          <option value="ALL">Todas as localizações</option>

          {locations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </Select>
      </PageHeaderToolbar>
    </PageHeader>
  );
}
