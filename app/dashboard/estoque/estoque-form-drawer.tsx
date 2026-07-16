"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { stockCategoryLabels, stockUnitLabels, stockUnitScales } from "./estoque-data";
import type { StockItemFormValues } from "./estoque-schema";
import type { StockItem } from "./estoque-types";
const field = "space-y-1.5";
export function StockFormDrawer({
  open,
  item,
  busy,
  error,
  onClose,
  onSave,
}: {
  open: boolean;
  item?: StockItem | null;
  busy: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (input: StockItemFormValues) => Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [unit, setUnit] = useState(item?.unit ?? "UNIT");
  useEffect(() => {
    if (open) queueMicrotask(() => setUnit(item?.unit ?? "UNIT"));
  }, [open, item]);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open, busy, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-form-title"
        className="h-full w-full max-w-2xl overflow-y-auto border-l bg-background p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="stock-form-title" className="text-lg font-bold">
              {item ? "Editar item" : "Novo item"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Dados cadastrais não alteram saldos ou custos.
            </p>
          </div>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Fechar
          </Button>
        </div>
        {error ? (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-rose-500/30 p-3 text-sm text-rose-600"
          >
            {error}
          </div>
        ) : null}
        <form
          ref={formRef}
          className="mt-5 grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            void onSave({
              name: String(data.get("name") || ""),
              internalCode: String(data.get("internalCode") || ""),
              description: String(data.get("description") || ""),
              category: String(data.get("category")) as StockItem["category"],
              unit: unit as StockItem["unit"],
              unitScale: stockUnitScales[unit as StockItem["unit"]],
              barcode: String(data.get("barcode") || ""),
              manufacturer: String(data.get("manufacturer") || ""),
              minimumQuantity: Number(data.get("minimumQuantity")),
              locationName: String(data.get("locationName") || ""),
              locationRoom: String(data.get("locationRoom") || ""),
              locationContainer: String(data.get("locationContainer") || ""),
              locationDescription: String(data.get("locationDescription") || ""),
              supplierReference: String(data.get("supplierReference") || ""),
              notes: String(data.get("notes") || ""),
            });
          }}
        >
          <div className={field}>
            <Label htmlFor="stock-name">Nome</Label>
            <Input
              id="stock-name"
              name="name"
              autoFocus
              defaultValue={item?.name}
              required
            />
          </div>
          <div className={field}>
            <Label htmlFor="stock-code">Código interno</Label>
            <Input
              id="stock-code"
              name="internalCode"
              defaultValue={item?.internalCode}
              required
            />
          </div>
          <div className={field}>
            <Label htmlFor="stock-category">Categoria</Label>
            <Select
              id="stock-category"
              name="category"
              defaultValue={item?.category ?? "OTHER"}
            >
              {Object.entries(stockCategoryLabels).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className={field}>
            <Label htmlFor="stock-unit">Unidade</Label>
            <Select
              id="stock-unit"
              name="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value as StockItem["unit"])}
              disabled={Boolean(item)}
            >
              {Object.entries(stockUnitLabels).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              Escala interna: {stockUnitScales[unit as StockItem["unit"]]}
            </p>
          </div>
          <div className={`${field} sm:col-span-2`}>
            <Label htmlFor="stock-description">Descrição</Label>
            <textarea
              id="stock-description"
              name="description"
              defaultValue={item?.description}
              className="min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className={field}>
            <Label htmlFor="stock-barcode">Código de barras</Label>
            <Input id="stock-barcode" name="barcode" defaultValue={item?.barcode} />
          </div>
          <div className={field}>
            <Label htmlFor="stock-manufacturer">Fabricante</Label>
            <Input
              id="stock-manufacturer"
              name="manufacturer"
              defaultValue={item?.manufacturer}
            />
          </div>
          <div className={field}>
            <Label htmlFor="stock-minimum">
              Estoque mínimo ({stockUnitLabels[unit as StockItem["unit"]]})
            </Label>
            <Input
              id="stock-minimum"
              name="minimumQuantity"
              type="number"
              min="0"
              step={1 / stockUnitScales[unit as StockItem["unit"]]}
              defaultValue={item ? item.minimumQuantity / item.unitScale : 0}
              required
            />
          </div>
          <div className={field}>
            <Label htmlFor="stock-location">Localização</Label>
            <Input
              id="stock-location"
              name="locationName"
              defaultValue={item?.location.name}
              required
            />
          </div>
          <div className={field}>
            <Label htmlFor="stock-room">Sala/área</Label>
            <Input
              id="stock-room"
              name="locationRoom"
              defaultValue={item?.location.room}
            />
          </div>
          <div className={field}>
            <Label htmlFor="stock-container">Prateleira/recipiente</Label>
            <Input
              id="stock-container"
              name="locationContainer"
              defaultValue={item?.location.container}
            />
          </div>
          <div className={`${field} sm:col-span-2`}>
            <Label htmlFor="stock-location-description">Descrição da localização</Label>
            <Input
              id="stock-location-description"
              name="locationDescription"
              defaultValue={item?.location.description}
            />
          </div>
          <div className={`${field} sm:col-span-2`}>
            <Label htmlFor="stock-supplier">Fornecedor preferencial</Label>
            <Input
              id="stock-supplier"
              name="supplierReference"
              defaultValue={item?.supplierReference}
            />
          </div>
          <div className={`${field} sm:col-span-2`}>
            <Label htmlFor="stock-notes">Observações</Label>
            <textarea
              id="stock-notes"
              name="notes"
              defaultValue={item?.notes}
              className="min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Salvando..." : "Salvar item"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
