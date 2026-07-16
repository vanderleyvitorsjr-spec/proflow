import {
  ArrowDownToLine,
  ArrowUpFromLine,
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
import { stockCategoryLabels, stockUnitLabels } from "./estoque-data";
import type { StockPreferences } from "./estoque-types";
export function EstoqueFilters({
  preferences,
  locations,
  onChange,
  onNew,
  onMovement,
}: {
  preferences: StockPreferences;
  locations: string[];
  onChange: (next: StockPreferences) => void;
  onNew: () => void;
  onMovement: (type: "ENTRY" | "EXIT") => void;
}) {
  const set = <K extends keyof StockPreferences>(key: K, value: StockPreferences[K]) =>
    onChange({ ...preferences, [key]: value });
  return (
    <PageHeader>
      <PageHeaderContent>
        <PageHeaderIdentity>
          <PageHeaderIcon>
            <Warehouse className="h-5 w-5" />
          </PageHeaderIcon>
          <PageHeaderHeading
            title="Estoque"
            description="Materiais, insumos, movimentos e custos derivados."
          />
        </PageHeaderIdentity>
        <PageHeaderActions>
          <Button variant="secondary" size="sm" onClick={() => onMovement("EXIT")}>
            <ArrowUpFromLine className="h-4 w-4" />
            Registrar saída
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onMovement("ENTRY")}>
            <ArrowDownToLine className="h-4 w-4" />
            Registrar entrada
          </Button>
          <div className="flex rounded-lg border p-0.5">
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-8", preferences.view === "list" && "bg-card shadow-sm")}
              onClick={() => set("view", "list")}
              aria-pressed={preferences.view === "list"}
            >
              <List className="h-4 w-4" />
              Lista
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-8", preferences.view === "cards" && "bg-card shadow-sm")}
              onClick={() => set("view", "cards")}
              aria-pressed={preferences.view === "cards"}
            >
              <LayoutGrid className="h-4 w-4" />
              Cartões
            </Button>
          </div>
          <Button size="sm" onClick={onNew}>
            <Plus className="h-4 w-4" />
            Novo item
          </Button>
        </PageHeaderActions>
      </PageHeaderContent>
      <PageHeaderToolbar className="grid gap-2 lg:grid-cols-3 2xl:grid-cols-[minmax(14rem,1fr)_10rem_10rem_10rem_12rem_10rem]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={preferences.searchTerm}
            onChange={(e) => set("searchTerm", e.target.value)}
            placeholder="Buscar item, código, fabricante ou local..."
            className="pl-9"
            aria-label="Pesquisar estoque"
          />
        </div>
        <Select
          value={preferences.statusFilter}
          onChange={(e) => set("statusFilter", e.target.value)}
          aria-label="Status"
        >
          <option value="ALL">Todos os status</option>
          <option value="AVAILABLE">Disponível</option>
          <option value="LOW_STOCK">Estoque baixo</option>
          <option value="OUT_OF_STOCK">Sem estoque</option>
          <option value="ARCHIVED">Arquivado</option>
        </Select>
        <Select
          value={preferences.categoryFilter}
          onChange={(e) => set("categoryFilter", e.target.value)}
          aria-label="Categoria"
        >
          <option value="ALL">Categorias</option>
          {Object.entries(stockCategoryLabels).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          value={preferences.unitFilter}
          onChange={(e) => set("unitFilter", e.target.value)}
          aria-label="Unidade"
        >
          <option value="ALL">Unidades</option>
          {Object.entries(stockUnitLabels).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          value={preferences.locationFilter}
          onChange={(e) => set("locationFilter", e.target.value)}
          aria-label="Localização"
        >
          <option value="ALL">Localizações</option>
          {locations.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </Select>
        <Select
          value={preferences.stockFilter}
          onChange={(e) => set("stockFilter", e.target.value)}
          aria-label="Saldo"
        >
          <option value="ALL">Qualquer saldo</option>
          <option value="WITH_STOCK">Com estoque</option>
          <option value="WITHOUT_STOCK">Sem estoque</option>
          <option value="BELOW_MINIMUM">Abaixo do mínimo</option>
        </Select>
        <label className="flex items-center gap-2 text-xs font-medium">
          <input
            type="checkbox"
            checked={preferences.includeArchived}
            onChange={(e) => set("includeArchived", e.target.checked)}
          />
          Exibir arquivados
        </label>
      </PageHeaderToolbar>
    </PageHeader>
  );
}
