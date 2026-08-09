"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HelpHint } from "@/components/ui/help-hint";
import { Select } from "@/components/ui/select";
import type { StockPurchaseFormValues } from "./estoque-schema";
import type { StockPurchase, StockSnapshot } from "./estoque-types";

type Line = {
  id: string;
  stockItemId: string;
  quantity: number;
  unitCost: number;
  notes: string;
};
export function StockPurchaseDialog({
  open,
  purchase,
  stock,
  busy,
  error,
  onClose,
  onSave,
}: {
  open: boolean;
  purchase?: StockPurchase | null;
  stock: StockSnapshot[];
  busy: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (value: StockPurchaseFormValues) => Promise<void>;
}) {
  const [lines, setLines] = useState<Line[]>([]);
  useEffect(() => {
    if (open)
      queueMicrotask(() =>
        setLines(
          purchase?.items.map((item) => ({
            id: item.id,
            stockItemId: item.stockItemId,
            quantity: item.orderedQuantity / item.unitScaleSnapshot,
            unitCost: item.unitCostCents / 100,
            notes: item.notes ?? "",
          })) ?? [
            {
              id: crypto.randomUUID(),
              stockItemId: stock.find((item) => !item.item.archivedAt)?.item.id ?? "",
              quantity: 1,
              unitCost: 0,
              notes: "",
            },
          ],
        ),
      );
  }, [open, purchase, stock]);
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, busy, onClose]);
  if (!open) return null;
  const setLine = (index: number, patch: Partial<Line>) =>
    setLines((current) =>
      current.map((line, position) =>
        position === index ? { ...line, ...patch } : line,
      ),
    );
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-title"
        className="h-full w-full max-w-3xl overflow-y-auto border-l bg-background p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="purchase-title" className="text-lg font-semibold">
              {purchase ? "Editar compra" : "Nova compra"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Cadastre fornecedor, itens e custos antes de confirmar o pedido.
            </p>
          </div>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Fechar
          </Button>
        </div>
        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-500/30 p-3 text-sm text-red-600"
          >
            {error}
          </p>
        ) : null}
        <form
          className="mt-5 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            void onSave({
              supplierName: String(data.get("supplierName") ?? ""),
              supplierDocument: String(data.get("supplierDocument") ?? ""),
              supplierPhone: String(data.get("supplierPhone") ?? ""),
              supplierEmail: String(data.get("supplierEmail") ?? ""),
              supplierNotes: "",
              documentNumber: String(data.get("documentNumber") ?? ""),
              purchaseDate: String(data.get("purchaseDate")),
              expectedDate: String(data.get("expectedDate") ?? ""),
              notes: String(data.get("notes") ?? ""),
              items: lines,
            });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor="supplierName">Fornecedor</Label>
              <Input
                id="supplierName"
                name="supplierName"
                defaultValue={purchase?.supplier.name}
                required
              />
              <HelpHint text="Nome do fornecedor responsável por esta compra." className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="supplierDocument">CPF/CNPJ</Label>
              <Input
                id="supplierDocument"
                name="supplierDocument"
                defaultValue={purchase?.supplier.document}
              />
              <HelpHint text="Informe apenas números. A formatação será aplicada ao exibir a compra." className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="supplierPhone">Telefone</Label>
              <Input
                id="supplierPhone"
                name="supplierPhone"
                defaultValue={purchase?.supplier.phone}
                placeholder="(73) 9 8893-6763"
              />
            </div>
            <div>
              <Label htmlFor="supplierEmail">E-mail</Label>
              <Input
                id="supplierEmail"
                name="supplierEmail"
                type="email"
                defaultValue={purchase?.supplier.email}
              />
            </div>
            <div>
              <Label htmlFor="documentNumber">Nota fiscal ou pedido</Label>
              <Input
                id="documentNumber"
                name="documentNumber"
                defaultValue={purchase?.documentNumber}
                placeholder="Ex.: NF 28451"
              />
              <HelpHint text="Número usado para conferir a compra com o documento do fornecedor." className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="purchaseDate">Data da compra</Label>
              <Input
                id="purchaseDate"
                name="purchaseDate"
                type="date"
                defaultValue={
                  purchase?.purchaseDate ?? new Date().toISOString().slice(0, 10)
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="expectedDate">Previsão de entrega</Label>
              <Input
                id="expectedDate"
                name="expectedDate"
                type="date"
                defaultValue={purchase?.expectedDate}
              />
              <HelpHint text="Data estimada para receber os materiais no estoque." className="mt-1.5" />
            </div>
          </div>
          <div className="rounded-xl border">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold">Itens da compra</h3>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() =>
                  setLines((current) => [
                    ...current,
                    {
                      id: crypto.randomUUID(),
                      stockItemId: stock[0]?.item.id ?? "",
                      quantity: 1,
                      unitCost: 0,
                      notes: "",
                    },
                  ])
                }
              >
                Adicionar item
              </Button>
            </div>
            <div className="space-y-3 p-4">
              {lines.map((line, index) => (
                <div
                  key={line.id}
                  className="grid gap-2 rounded-lg bg-muted/35 p-3 sm:grid-cols-[1fr_8rem_9rem_auto]"
                >
                  <Select
                    aria-label={`Item ${index + 1}`}
                    value={line.stockItemId}
                    onChange={(event) =>
                      setLine(index, { stockItemId: event.target.value })
                    }
                  >
                    {stock
                      .filter((item) => !item.item.archivedAt)
                      .map((item) => (
                        <option key={item.item.id} value={item.item.id}>
                          {item.item.internalCode} · {item.item.name}
                        </option>
                      ))}
                  </Select>
                  <Input
                    aria-label="Quantidade"
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={line.quantity}
                    onChange={(event) =>
                      setLine(index, { quantity: Number(event.target.value) })
                    }
                  />
                  <Input
                    aria-label="Custo unitário"
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unitCost}
                    onChange={(event) =>
                      setLine(index, { unitCost: Number(event.target.value) })
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={lines.length === 1}
                    onClick={() =>
                      setLines((current) =>
                        current.filter((_, position) => position !== index),
                      )
                    }
                  >
                    Remover
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="purchaseNotes">Observações</Label>
            <Input id="purchaseNotes" name="notes" defaultValue={purchase?.notes} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button disabled={busy}>{busy ? "Salvando..." : "Salvar compra"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
