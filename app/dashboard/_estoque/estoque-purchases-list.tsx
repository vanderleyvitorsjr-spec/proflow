"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableFrame,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StockPurchase } from "./estoque-types";
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const status: Record<StockPurchase["status"], string> = {
  DRAFT: "Rascunho",
  ORDERED: "Pedido",
  PARTIALLY_RECEIVED: "Recebimento parcial",
  RECEIVED: "Recebido",
  CANCELED: "Cancelado",
  ARCHIVED: "Arquivado",
};
export function StockPurchasesList({ purchases }: { purchases: StockPurchase[] }) {
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("ALL");
  const filtered = useMemo(
    () =>
      purchases.filter(
        (purchase) =>
          (filter === "ALL" || purchase.status === filter) &&
          [purchase.supplier.name, purchase.documentNumber, String(purchase.sequence)]
            .concat(
              purchase.items.flatMap((item) => [
                item.nameSnapshot,
                item.internalCodeSnapshot,
              ]),
            )
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase("pt-BR")
            .includes(search.toLocaleLowerCase("pt-BR")),
      ),
    [purchases, search, filter],
  );
  return (
    <section className="rounded-xl border bg-card">
      <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">Compras de estoque</h2>
          <p className="text-xs text-muted-foreground">
            Pedidos, recebimentos e vínculos financeiros.
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            aria-label="Buscar compras"
            placeholder="Buscar compra..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-8 w-full sm:w-56"
          />
          <Select
            aria-label="Filtrar status"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="h-8 w-44"
          >
            <option value="ALL">Todos os status</option>
            {Object.entries(status).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      {filtered.length ? (
        <TableFrame className="rounded-none border-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Compra</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Recebido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell>
                    <Link
                      className="font-medium text-primary hover:underline"
                      href={`/dashboard/estoque/compras/${purchase.id}`}
                    >
                      #{String(purchase.sequence).padStart(4, "0")}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {purchase.documentNumber || "Sem documento"}
                    </p>
                  </TableCell>
                  <TableCell>{purchase.supplier.name}</TableCell>
                  <TableCell>
                    {new Date(`${purchase.purchaseDate}T12:00:00`).toLocaleDateString(
                      "pt-BR",
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-medium">
                      {status[purchase.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {money.format(purchase.totalCents / 100)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {money.format(purchase.receivedTotalCents / 100)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableFrame>
      ) : (
        <EmptyState
          title="Nenhuma compra encontrada"
          description="Cadastre uma compra ou ajuste os filtros."
        />
      )}
    </section>
  );
}
