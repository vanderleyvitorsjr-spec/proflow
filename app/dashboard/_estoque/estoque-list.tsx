import Link from "next/link";
import {
  Archive,
  ArrowRight,
  Boxes,
  MoreHorizontal,
  Pencil,
  Plus,
  Minus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableFrame } from "@/components/ui/table";
import { stockCategoryLabels, stockUnitLabels } from "./estoque-data";
import { formatStockQuantity } from "./estoque-selectors";
import type { StockMovementType, StockSnapshot, StockView } from "./estoque-types";
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const labels = {
  AVAILABLE: "Disponível",
  LOW_STOCK: "Estoque baixo",
  OUT_OF_STOCK: "Sem estoque",
  ARCHIVED: "Arquivado",
};
const variants = {
  AVAILABLE: "success",
  LOW_STOCK: "warning",
  OUT_OF_STOCK: "destructive",
  ARCHIVED: "neutral",
} as const;
export function EstoqueList({
  view,
  items,
  onEdit,
  onArchive,
  onMovement,
}: {
  view: StockView;
  items: StockSnapshot[];
  onEdit: (s: StockSnapshot) => void;
  onArchive: (s: StockSnapshot) => void;
  onMovement: (s: StockSnapshot, type: StockMovementType) => void;
}) {
  if (!items.length)
    return (
      <EmptyState
        icon={<Boxes className="h-5 w-5" />}
        title="Nenhum item encontrado"
        description="Ajuste a busca ou os filtros, ou cadastre um novo item."
      />
    );
  if (view === "cards")
    return (
      <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {items.map((s) => (
          <Card key={s.item.id} className="overflow-hidden">
            <CardContent className="space-y-3 p-3">
              <div className="flex justify-between gap-3">
                <div>
                  <Link
                    href={`/dashboard/estoque/${s.item.id}`}
                    className="text-sm font-bold hover:text-sky-600"
                  >
                    {s.item.name}
                  </Link>
                  <p className="text-xs text-sky-600">{s.item.internalCode}</p>
                </div>
                <Badge variant={variants[s.status]}>{labels[s.status]}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-muted p-2">
                  <span className="text-muted-foreground">Quantidade</span>
                  <strong className="block text-sm">
                    {formatStockQuantity(
                      s.physicalQuantity,
                      s.item,
                      stockUnitLabels[s.item.unit],
                    )}
                  </strong>
                </div>
                <div className="rounded-lg bg-muted p-2">
                  <span className="text-muted-foreground">Valor</span>
                  <strong className="block text-sm">
                    {money.format(s.totalValueCents / 100)}
                  </strong>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {stockCategoryLabels[s.item.category]} · {s.item.location.name}
              </p>
              <div className="flex justify-between border-t pt-2">
                <div className="flex">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onEdit(s)}
                    aria-label={`Editar ${s.item.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onMovement(s, "ENTRY")}
                    disabled={Boolean(s.item.archivedAt)}
                    aria-label={`Entrada em ${s.item.name}`}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onMovement(s, "EXIT")}
                    disabled={Boolean(s.item.archivedAt)}
                    aria-label={`Saída de ${s.item.name}`}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onArchive(s)}
                    disabled={Boolean(s.item.archivedAt)}
                    aria-label={`Arquivar ${s.item.name}`}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                </div>
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/dashboard/estoque/${s.item.id}`}>
                    Ver item
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    );
  return (
    <TableFrame scrollHint>
      <Table framed={false} density="compact" className="min-w-[80rem]">
        <thead>
          <tr>
            <th>Item</th>
            <th>Categoria</th>
            <th>Quantidade</th>
            <th>Mínimo</th>
            <th>Localização</th>
            <th>Custo médio</th>
            <th>Valor total</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.item.id}>
              <td>
                <Link
                  href={`/dashboard/estoque/${s.item.id}`}
                  className="font-semibold hover:text-sky-600"
                >
                  {s.item.name}
                </Link>
                <span className="block text-xs text-sky-600">{s.item.internalCode}</span>
              </td>
              <td>{stockCategoryLabels[s.item.category]}</td>
              <td className="font-semibold">
                {formatStockQuantity(
                  s.physicalQuantity,
                  s.item,
                  stockUnitLabels[s.item.unit],
                )}
                <span className="block text-xs font-normal text-muted-foreground">
                  Reservado:{" "}
                  {formatStockQuantity(
                    s.reservedQuantity,
                    s.item,
                    stockUnitLabels[s.item.unit],
                  )}{" "}
                  · Disponível:{" "}
                  {formatStockQuantity(
                    s.availableQuantity,
                    s.item,
                    stockUnitLabels[s.item.unit],
                  )}
                </span>
              </td>
              <td>
                {formatStockQuantity(
                  s.item.minimumQuantity,
                  s.item,
                  stockUnitLabels[s.item.unit],
                )}
              </td>
              <td>
                {s.item.location.name}
                <span className="block text-xs text-muted-foreground">
                  {s.item.supplierReference ?? "Sem fornecedor"}
                </span>
              </td>
              <td>{money.format(s.averageCostCents / 100)}</td>
              <td className="font-semibold">{money.format(s.totalValueCents / 100)}</td>
              <td>
                <Badge variant={variants[s.status]}>{labels[s.status]}</Badge>
              </td>
              <td>
                <div className="flex">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onEdit(s)}
                    aria-label={`Editar ${s.item.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onMovement(s, "ENTRY")}
                    disabled={Boolean(s.item.archivedAt)}
                    aria-label={`Movimentar ${s.item.name}`}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onArchive(s)}
                    disabled={Boolean(s.item.archivedAt)}
                    aria-label={`Arquivar ${s.item.name}`}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableFrame>
  );
}
