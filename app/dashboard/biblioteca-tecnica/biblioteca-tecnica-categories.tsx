import { BookOpen, Building2, Cpu, Files, Tags } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CategoryGroup = {
  key: "category" | "equipment" | "manufacturer" | "contentType";
  label: string;
  description: string;
  count: number;
  icon: typeof BookOpen;
};

type BibliotecaTecnicaCategoriesProps = {
  documentCount: number;
  categoryCount: number;
  equipmentCount: number;
  manufacturerCount: number;
  contentTypeCount: number;
  activeGroup: CategoryGroup["key"];
  onGroupChange: (group: CategoryGroup["key"]) => void;
};

export type TechnicalLibraryGroup = CategoryGroup["key"];

export function BibliotecaTecnicaCategories({
  documentCount,
  categoryCount,
  equipmentCount,
  manufacturerCount,
  contentTypeCount,
  activeGroup,
  onGroupChange,
}: BibliotecaTecnicaCategoriesProps) {
  const groups: CategoryGroup[] = [
    {
      key: "category",
      label: "Categorias",
      description: `${categoryCount} áreas técnicas`,
      count: documentCount,
      icon: Tags,
    },
    {
      key: "equipment",
      label: "Equipamentos",
      description: `${equipmentCount} famílias vinculadas`,
      count: documentCount,
      icon: Cpu,
    },
    {
      key: "manufacturer",
      label: "Fabricantes",
      description: `${manufacturerCount} referências`,
      count: documentCount,
      icon: Building2,
    },
    {
      key: "contentType",
      label: "Tipos de conteúdo",
      description: `${contentTypeCount} formatos técnicos`,
      count: documentCount,
      icon: Files,
    },
  ];

  return (
    <section aria-labelledby="library-organization-title" className="space-y-2">
      <div>
        <h2 id="library-organization-title" className="text-base font-bold text-foreground">
          Organização da biblioteca
        </h2>
        <p className="text-xs text-muted-foreground">
          Explore o acervo pela perspectiva mais adequada ao atendimento.
        </p>
      </div>

      <div className="grid overflow-hidden rounded-[var(--radius-card)] border border-border bg-card shadow-xs sm:grid-cols-2 xl:grid-cols-4 [&>*]:border-b [&>*]:border-r [&>*]:border-border">
        {groups.map((group) => {
          const Icon = group.icon;
          const active = activeGroup === group.key;

          return (
            <button
              key={group.key}
              type="button"
              aria-pressed={active}
              onClick={() => onGroupChange(group.key)}
              className="text-left"
            >
              <Card
                className={cn(
                  "h-full rounded-none border-0 bg-card shadow-none transition-colors hover:bg-muted/40",
                  active && "border-blue-500 bg-blue-50/70 dark:bg-blue-500/10",
                )}
              >
                <CardContent className="flex min-h-20 items-center gap-3 p-3">
                  <span className="rounded-lg bg-blue-100 p-2 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-foreground">{group.label}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {group.description}
                    </span>
                  </span>
                  <span className="text-sm font-bold text-foreground">{group.count}</span>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
    </section>
  );
}
