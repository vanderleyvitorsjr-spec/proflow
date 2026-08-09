import { Grid2X2, List, Plus, Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type { TechnicalLibraryView } from "./biblioteca-tecnica-data";

type BibliotecaTecnicaHeaderProps = {
  searchTerm: string;
  categoryFilter: string;
  manufacturerFilter: string;
  contentTypeFilter: string;
  view: TechnicalLibraryView;
  categories: Array<{ value: string; label: string }>;
  manufacturers: string[];
  contentTypes: Array<{ value: string; label: string }>;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onManufacturerChange: (value: string) => void;
  onContentTypeChange: (value: string) => void;
  onViewChange: (value: TechnicalLibraryView) => void;
  onNewDocument: () => void;
};

const selectClassName =
  "h-9 rounded-[var(--radius-control)] border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20";

export function BibliotecaTecnicaHeader({
  searchTerm,
  categoryFilter,
  manufacturerFilter,
  contentTypeFilter,
  view,
  categories,
  manufacturers,
  contentTypes,
  onSearchChange,
  onCategoryChange,
  onManufacturerChange,
  onContentTypeChange,
  onViewChange,
  onNewDocument,
}: BibliotecaTecnicaHeaderProps) {
  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-card px-4 py-3 shadow-xs">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-blue-600">
            Conhecimento operacional
          </p>
          <h1 className="mt-0.5 text-lg font-bold tracking-tight text-foreground">
            Biblioteca Técnica
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Centralize referências para diagnóstico, instalação, manutenção e
            segurança, com contexto de equipamentos e Ordens de Serviço.
          </p>
        </div>

        <Button type="button" size="sm" onClick={onNewDocument}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Novo documento
        </Button>
      </div>

      <Card className="mt-3 rounded-none border-0 border-t border-border bg-transparent shadow-none">
        <CardContent className="space-y-2.5 px-0 pb-0 pt-3">
          <div className="flex flex-col gap-2 xl:flex-row">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Buscar na Biblioteca Técnica</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={searchTerm}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Buscar por título, código, equipamento ou fabricante"
                className="h-9 rounded-[var(--radius-control)] pl-9"
              />
            </label>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <select
                aria-label="Filtrar por categoria"
                className={selectClassName}
                value={categoryFilter}
                onChange={(event) => onCategoryChange(event.target.value)}
              >
                <option value="ALL">Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filtrar por fabricante"
                className={selectClassName}
                value={manufacturerFilter}
                onChange={(event) => onManufacturerChange(event.target.value)}
              >
                <option value="ALL">Todos os fabricantes</option>
                {manufacturers.map((manufacturer) => (
                  <option key={manufacturer} value={manufacturer}>
                    {manufacturer}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filtrar por tipo de conteúdo"
                className={selectClassName}
                value={contentTypeFilter}
                onChange={(event) => onContentTypeChange(event.target.value)}
              >
                <option value="ALL">Todos os tipos</option>
                {contentTypes.map((contentType) => (
                  <option key={contentType.value} value={contentType.value}>
                    {contentType.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border pt-2.5">
            <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Busca e filtros locais
            </span>

            <div className="flex rounded-lg border border-border bg-muted/40 p-1">
              <button
                type="button"
                aria-label="Visualizar em cartões"
                aria-pressed={view === "cards"}
                onClick={() => onViewChange("cards")}
                className={cn(
                  "rounded-md p-2 text-muted-foreground transition-colors",
                  view === "cards" && "bg-background text-foreground shadow-sm",
                )}
              >
                <Grid2X2 className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Visualizar em lista"
                aria-pressed={view === "list"}
                onClick={() => onViewChange("list")}
                className={cn(
                  "rounded-md p-2 text-muted-foreground transition-colors",
                  view === "list" && "bg-background text-foreground shadow-sm",
                )}
              >
                <List className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
