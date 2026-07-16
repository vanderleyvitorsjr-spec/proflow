"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LaborProfileFormValues } from "./precificacao-schema";
export function PricingLaborProfileDialog({
  open,
  busy,
  onClose,
  onSave,
}: {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onSave: (input: LaborProfileFormValues) => Promise<void>;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, busy, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="labor-title"
        className="w-full max-w-lg rounded-xl border bg-background p-5 shadow-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          const d = new FormData(e.currentTarget);
          void onSave({
            name: String(d.get("name")),
            hourlyCostCents: Math.round(Number(d.get("hourly")) * 100),
            burdenRateBasisPoints: Math.round(Number(d.get("burden")) * 100),
            fixedAdditionalCents: Math.round(Number(d.get("additional")) * 100),
            active: true,
            notes: String(d.get("notes") ?? ""),
          });
        }}
      >
        <h2 id="labor-title" className="font-semibold">
          Novo perfil de mão de obra
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="labor-name">Nome</Label>
            <Input id="labor-name" name="name" autoFocus required />
          </div>
          <div>
            <Label htmlFor="labor-hourly">Custo por hora</Label>
            <Input
              id="labor-hourly"
              name="hourly"
              type="number"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div>
            <Label htmlFor="labor-burden">Encargos (%)</Label>
            <Input
              id="labor-burden"
              name="burden"
              type="number"
              min="0"
              max="100"
              step="0.01"
            />
          </div>
          <div>
            <Label htmlFor="labor-additional">Adicional fixo</Label>
            <Input
              id="labor-additional"
              name="additional"
              type="number"
              min="0"
              step="0.01"
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={busy}>Salvar perfil</Button>
        </div>
      </form>
    </div>
  );
}
