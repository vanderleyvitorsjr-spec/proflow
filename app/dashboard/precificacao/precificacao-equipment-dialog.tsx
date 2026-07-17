"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyFormInput, DecimalBRInput } from "@/components/ui/br-masked-inputs";
import { parseCurrencyBRToCents, parseDecimalBR } from "@/lib/br-formatters";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { EquipmentPricingReference } from "@/lib/contracts/equipamentos.contract";

export type PricingEquipmentInput = {
  equipmentId: string;
  method: "DERIVED_PER_HOUR" | "MANUAL_PER_HOUR" | "MANUAL_PER_USE";
  usage: number;
  manualCostCents?: number;
  manualReason?: string;
};
export function PricingEquipmentDialog({
  open,
  items,
  busy,
  onClose,
  onSave,
}: {
  open: boolean;
  items: EquipmentPricingReference[];
  busy: boolean;
  onClose: () => void;
  onSave: (input: PricingEquipmentInput) => Promise<void>;
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
        aria-labelledby="real-equipment-title"
        className="max-h-[calc(100dvh-2rem)] w-full max-w-lg space-y-3 overflow-y-auto rounded-xl border bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl sm:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget),
            manual = parseCurrencyBRToCents(String(data.get("manualCost") ?? ""));
          void onSave({
            equipmentId: String(data.get("equipmentId")),
            method: String(data.get("method")) as PricingEquipmentInput["method"],
            usage: parseDecimalBR(String(data.get("usage") ?? "")),
            manualCostCents: manual > 0 ? manual : undefined,
            manualReason: String(data.get("manualReason") ?? ""),
          });
        }}
      >
        <h2 id="real-equipment-title" className="font-semibold">
          Adicionar equipamento real
        </h2>
        <div>
          <Label htmlFor="pricing-real-equipment">Equipamento</Label>
          <Select id="pricing-real-equipment" name="equipmentId" autoFocus required>
            <option value="">Selecione...</option>
            {items
              .filter(
                (item) =>
                  !item.archived &&
                  item.condition !== "UNUSABLE" &&
                  ["AVAILABLE", "IN_USE"].includes(item.status),
              )
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.internalCode} · {item.name} · {item.ownership}
                </option>
              ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="pricing-equipment-method">Método</Label>
          <Select id="pricing-equipment-method" name="method">
            <option value="DERIVED_PER_HOUR">Custo derivado por hora</option>
            <option value="MANUAL_PER_HOUR">Custo manual por hora</option>
            <option value="MANUAL_PER_USE">Custo manual por uso</option>
          </Select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="pricing-equipment-usage">Horas ou usos</Label>
            <DecimalBRInput
              id="pricing-equipment-usage"
              name="usage"
              defaultValue={0}
              maximumFractionDigits={2}
              required
            />
          </div>
          <div>
            <Label htmlFor="pricing-equipment-cost">Custo manual (R$)</Label>
            <CurrencyFormInput
              id="pricing-equipment-cost"
              name="manualCost"
              defaultValue={0}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="pricing-equipment-reason">Justificativa do custo manual</Label>
          <Input id="pricing-equipment-reason" name="manualReason" />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={busy}>Adicionar equipamento</Button>
        </div>
      </form>
    </div>
  );
}
