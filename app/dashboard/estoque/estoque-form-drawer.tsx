"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { FormSectionIntro, RequiredFieldsNotice } from "@/components/ui/form-guidance";
import { Select } from "@/components/ui/select";
import { stockCategoryLabels, stockUnitLabels, stockUnitScales } from "./estoque-data";
import type { StockItemFormValues } from "./estoque-schema";
import type { StockItem } from "./estoque-types";
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
        <RequiredFieldsNotice className="mt-4" />
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
          <FormSectionIntro className="sm:col-span-2" title="Identificação do item" description="Informe como o material será reconhecido nas compras, reservas e movimentações." />
          <Field label="Nome do item" htmlFor="stock-name" required help="Use um nome claro e específico. Ex.: Cabo PP 2 x 2,5 mm².">
            <Input
              id="stock-name"
              name="name"
              autoFocus
              defaultValue={item?.name}
              required
            />
          </Field>
          <Field label="Código interno" htmlFor="stock-code" required help="Código curto usado pela empresa para localizar o item. Ex.: CAB-PP-225.">
            <Input
              id="stock-code"
              name="internalCode"
              defaultValue={item?.internalCode}
              required
            />
          </Field>
          <Field label="Categoria do material" htmlFor="stock-category" help="Agrupa itens semelhantes e facilita filtros e relatórios.">
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
          </Field>
          <Field label="Unidade de controle" htmlFor="stock-unit" help="Escolha como a quantidade será registrada: unidade, metro, quilo, litro ou outra medida.">
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
          </Field>
          <Field className="sm:col-span-2" label="Descrição do item" htmlFor="stock-description" help="Inclua características que diferenciam o material, como medida, capacidade, cor ou aplicação.">
            <textarea
              id="stock-description"
              name="description"
              defaultValue={item?.description}
              className="min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Código de barras" htmlFor="stock-barcode" help="Preencha somente quando o produto possuir código de barras do fabricante.">
            <Input id="stock-barcode" name="barcode" defaultValue={item?.barcode} />
          </Field>
          <Field label="Fabricante" htmlFor="stock-manufacturer" help="Marca ou empresa que fabrica o item. Ex.: Schneider, Elgin ou Tigre.">
            <Input
              id="stock-manufacturer"
              name="manufacturer"
              defaultValue={item?.manufacturer}
            />
          </Field>
          <FormSectionIntro className="sm:col-span-2 mt-2" title="Controle e localização" description="Defina quando o sistema deve alertar reposição e onde o item fica armazenado." />
          <Field label={`Estoque mínimo (${stockUnitLabels[unit as StockItem["unit"]]})`} htmlFor="stock-minimum" required help="Quantidade mínima desejada antes de o sistema sinalizar necessidade de reposição.">
            <Input
              id="stock-minimum"
              name="minimumQuantity"
              type="number"
              min="0"
              step={1 / stockUnitScales[unit as StockItem["unit"]]}
              defaultValue={item ? item.minimumQuantity / item.unitScale : 0}
              required
            />
          </Field>
          <Field label="Local principal" htmlFor="stock-location" required help="Informe o almoxarifado, depósito, veículo ou unidade onde o material fica guardado.">
            <Input
              id="stock-location"
              name="locationName"
              defaultValue={item?.location.name}
              required
            />
          </Field>
          <Field label="Sala ou área" htmlFor="stock-room" help="Detalhe a área dentro do local principal. Ex.: Sala elétrica ou corredor B.">
            <Input
              id="stock-room"
              name="locationRoom"
              defaultValue={item?.location.room}
            />
          </Field>
          <Field label="Prateleira ou recipiente" htmlFor="stock-container" help="Ex.: Prateleira 03, caixa azul ou gaveta 12.">
            <Input
              id="stock-container"
              name="locationContainer"
              defaultValue={item?.location.container}
            />
          </Field>
          <Field className="sm:col-span-2" label="Referência da localização" htmlFor="stock-location-description" help="Use quando precisar de uma orientação adicional para encontrar o item.">
            <Input
              id="stock-location-description"
              name="locationDescription"
              defaultValue={item?.location.description}
            />
          </Field>
          <Field className="sm:col-span-2" label="Fornecedor preferencial" htmlFor="stock-supplier" help="Fornecedor normalmente utilizado para repor este material.">
            <Input
              id="stock-supplier"
              name="supplierReference"
              defaultValue={item?.supplierReference}
            />
          </Field>
          <Field className="sm:col-span-2" label="Observações internas" htmlFor="stock-notes" help="Registre cuidados, compatibilidades ou informações úteis para compras e uso.">
            <textarea
              id="stock-notes"
              name="notes"
              defaultValue={item?.notes}
              className="min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </Field>
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
