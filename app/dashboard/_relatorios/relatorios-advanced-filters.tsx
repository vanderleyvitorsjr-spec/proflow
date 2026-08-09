import { Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ReportFilter } from "./relatorios-types";

type Props = {
  filters: ReportFilter;
  onChange: (value: ReportFilter) => void;
};

export function RelatoriosAdvancedFilters({ filters, onChange }: Props) {
  const update = <K extends keyof ReportFilter>(key: K, value: ReportFilter[K]) =>
    onChange({ ...filters, [key]: value });
  return (
    <details className="border-t border-border px-4 py-2.5 print:hidden sm:px-5">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-medium text-foreground">
        <Filter className="h-3.5 w-3.5" />
        Filtros avançados
        <span className="text-[10px] font-normal text-muted-foreground">
          Aplicados apenas às fontes compatíveis
        </span>
      </summary>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <Input className="h-9" aria-label="Cliente por identificador" placeholder="ID do cliente" value={filters.clientId} onChange={(event) => update("clientId", event.target.value)} />
        <Input className="h-9" aria-label="Responsável comercial" placeholder="Responsável comercial" value={filters.salesOwner} onChange={(event) => update("salesOwner", event.target.value)} />
        <Input className="h-9" aria-label="Técnico" placeholder="Técnico" value={filters.technician} onChange={(event) => update("technician", event.target.value)} />
        <Input className="h-9" aria-label="Categoria" placeholder="Categoria" value={filters.category} onChange={(event) => update("category", event.target.value)} />
        <Input className="h-9" aria-label="Status" placeholder="Status" value={filters.status} onChange={(event) => update("status", event.target.value)} />
        <Input className="h-9" aria-label="Origem" placeholder="Origem" value={filters.origin} onChange={(event) => update("origin", event.target.value)} />
        <Input className="h-9" aria-label="Cidade" placeholder="Cidade" value={filters.city} onChange={(event) => update("city", event.target.value)} />
        <Input className="h-9" aria-label="Estado" placeholder="UF" maxLength={2} value={filters.state} onChange={(event) => update("state", event.target.value.toUpperCase())} />
        <Input className="h-9" aria-label="Tipo de serviço" placeholder="Tipo de serviço" value={filters.serviceType} onChange={(event) => update("serviceType", event.target.value)} />
        <Input className="h-9" aria-label="Conta financeira" placeholder="ID da conta" value={filters.financialAccount} onChange={(event) => update("financialAccount", event.target.value)} />
        <Select className="h-9" aria-label="Natureza financeira" value={filters.financialNature} onChange={(event) => update("financialNature", event.target.value)}><option value="">Todas as naturezas</option><option value="REVENUE">Receita</option><option value="EXPENSE">Despesa</option><option value="INVESTMENT">Investimento</option></Select>
        <Select className="h-9" aria-label="Propriedade do ativo" value={filters.assetOwnership} onChange={(event) => update("assetOwnership", event.target.value)}><option value="">Todas as propriedades</option><option value="COMPANY">Próprio</option><option value="CUSTOMER">Cliente</option><option value="THIRD_PARTY">Terceiro</option></Select>
      </div>
    </details>
  );
}
