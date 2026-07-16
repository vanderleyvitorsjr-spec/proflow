"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
        className="w-full max-w-lg space-y-3 rounded-xl border bg-background p-5 shadow-xl"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget),
            manual = Number(data.get("manualCost"));
          void onSave({
            equipmentId: String(data.get("equipmentId")),
            method: String(data.get("method")) as PricingEquipmentInput["method"],
            usage: Number(data.get("usage")),
            manualCostCents: manual > 0 ? Math.round(manual * 100) : undefined,
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
            <Input
              id="pricing-equipment-usage"
              name="usage"
              type="number"
              min="0.01"
              step="0.01"
              required
            />
          </div>
          <div>
            <Label htmlFor="pricing-equipment-cost">Custo manual (R$)</Label>
            <Input
              id="pricing-equipment-cost"
              name="manualCost"
              type="number"
              min="0"
              step="0.01"
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
