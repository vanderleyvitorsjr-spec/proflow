"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CurrencyFormInput,
  DecimalBRInput,
  PercentageFormInput,
} from "@/components/ui/br-masked-inputs";
import {
  formatCurrencyBRLFromCents,
  parseCurrencyBRToCents,
  parseDecimalBR,
  parsePercentageBRToBasisPoints,
} from "@/lib/br-formatters";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { StockPricingReference } from "@/lib/contracts/estoque.contract";

export type PricingMaterialInput = {
  stockItemId: string;
  quantity: number;
  wasteBasisPoints: number;
  manualCostCents?: number;
  manualReason?: string;
  insufficientConfirmed: boolean;
};

export function PricingMaterialDialog({
  open,
  items,
  busy,
  onClose,
  onSave,
}: {
  open: boolean;
  items: StockPricingReference[];
  busy: boolean;
  onClose: () => void;
  onSave: (input: PricingMaterialInput) => Promise<void>;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) =>
      event.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, busy, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-material-title"
        className="max-h-[calc(100dvh-2rem)] w-full max-w-lg space-y-3 overflow-y-auto rounded-xl border bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl sm:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget),
            manual = parseCurrencyBRToCents(String(data.get("manualCost") ?? ""));
          void onSave({
            stockItemId: String(data.get("stockItemId")),
            quantity: parseDecimalBR(String(data.get("quantity") ?? "")),
            wasteBasisPoints: parsePercentageBRToBasisPoints(
              String(data.get("waste") ?? ""),
            ),
            manualCostCents: manual > 0 ? manual : undefined,
            manualReason: String(data.get("manualReason") ?? ""),
            insufficientConfirmed: data.get("insufficientConfirmed") === "on",
          });
        }}
      >
        <h2 id="stock-material-title" className="font-semibold">
          Adicionar material do Estoque
        </h2>
        <div>
          <Label htmlFor="pricing-stock-item">Item</Label>
          <Select id="pricing-stock-item" name="stockItemId" autoFocus required>
            <option value="">Selecione...</option>
            {items
              .filter((item) => !item.archived)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.internalCode} · {item.name} ·{" "}
                  {formatCurrencyBRLFromCents(item.averageCostCents)}
                </option>
              ))}
          </Select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="pricing-stock-quantity">Quantidade</Label>
            <DecimalBRInput
              id="pricing-stock-quantity"
              name="quantity"
              defaultValue={0}
              maximumFractionDigits={3}
              required
            />
          </div>
          <div>
            <Label htmlFor="pricing-stock-waste">Perda técnica (%)</Label>
            <PercentageFormInput id="pricing-stock-waste" name="waste" defaultValue={0} />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="pricing-stock-manual">Custo manual (R$)</Label>
            <CurrencyFormInput
              id="pricing-stock-manual"
              name="manualCost"
              defaultValue={0}
            />
          </div>
          <div>
            <Label htmlFor="pricing-stock-reason">Justificativa</Label>
            <Input id="pricing-stock-reason" name="manualReason" />
          </div>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input name="insufficientConfirmed" type="checkbox" className="mt-1" />
          Manter na estimativa mesmo se a disponibilidade for insuficiente.
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={busy}>Adicionar material</Button>
        </div>
      </form>
    </div>
  );
}
