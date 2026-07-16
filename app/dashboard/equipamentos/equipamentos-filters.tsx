import { LayoutGrid, List, Plus, Search, Wrench } from "lucide-react";
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
import {
  assetTypeLabels,
  conditionLabels,
  ownershipLabels,
  statusLabels,
} from "./equipamentos-data";
import type { EquipmentView } from "./equipamentos-types";
export type EquipmentFilters = {
  search: string;
  type: string;
  category: string;
  ownership: string;
  status: string;
  condition: string;
  depreciation: string;
  maintenance: string;
  warranty: string;
  critical: string;
};
export function EquipamentosFilters({
  view,
  filters,
  categories,
  onViewChange,
  onChange,
  onNew,
}: {
  view: EquipmentView;
  filters: EquipmentFilters;
  categories: string[];
  onViewChange: (v: EquipmentView) => void;
  onChange: (v: EquipmentFilters) => void;
  onNew: () => void;
}) {
  const select = (
    key: keyof EquipmentFilters,
    options: Record<string, string>,
    all: string,
  ) => (
    <Select
      aria-label={`Filtrar por ${key}`}
      value={filters[key]}
      onChange={(e) => onChange({ ...filters, [key]: e.target.value })}
    >
      <option value="ALL">{all}</option>
      {Object.entries(options).map(([k, v]) => (
        <option key={k} value={k}>
          {v}
        </option>
      ))}
    </Select>
  );
  return (
    <PageHeader>
      <PageHeaderContent>
        <PageHeaderIdentity>
          <PageHeaderIcon>
            <Wrench className="h-5 w-5" />
          </PageHeaderIcon>
          <PageHeaderHeading
            title="Equipamentos"
            description="Ativos e patrimônios duráveis da operação."
          />
        </PageHeaderIdentity>
        <PageHeaderActions>
          <div className="flex rounded-lg border p-0.5">
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={view === "list"}
              onClick={() => onViewChange("list")}
            >
              <List className="h-4 w-4" />
              Lista
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={view === "cards"}
              onClick={() => onViewChange("cards")}
            >
              <LayoutGrid className="h-4 w-4" />
              Cartões
            </Button>
          </div>
          <Button size="sm" onClick={onNew}>
            <Plus className="h-4 w-4" />
            Novo equipamento
          </Button>
        </PageHeaderActions>
      </PageHeaderContent>
      <PageHeaderToolbar className="grid gap-2 lg:grid-cols-5 2xl:grid-cols-10">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label="Pesquisar equipamentos"
            className="pl-9"
            placeholder="Buscar ativos..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
          />
        </div>
        {select("type", assetTypeLabels, "Todos os tipos")}
        <Select
          aria-label="Filtrar por categoria"
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
        >
          <option value="ALL">Todas as categorias</option>
          {categories.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </Select>
        {select("ownership", ownershipLabels, "Todas as propriedades")}
        {select("status", statusLabels, "Todos os status")}
        {select("condition", conditionLabels, "Todas as condições")}
        {select(
          "depreciation",
          { LINEAR: "Linear", NONE: "Não depreciável" },
          "Toda depreciação",
        )}
        {select("maintenance", { SCHEDULED: "Programada", IN_PROGRESS: "Em andamento", OVERDUE: "Vencida" }, "Toda manutenção")}
        {select("warranty", { ACTIVE: "Ativa", EXPIRING_SOON: "A vencer", EXPIRED: "Expirada", NOT_INFORMED: "Não informada" }, "Toda garantia")}
        {select("critical", { YES: "Somente críticos" }, "Toda criticidade")}
      </PageHeaderToolbar>
    </PageHeader>
  );
}
