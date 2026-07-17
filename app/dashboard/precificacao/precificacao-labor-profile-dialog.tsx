"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  CurrencyFormInput,
  PercentageFormInput,
  ProperNameInput,
} from "@/components/ui/br-masked-inputs";
import {
  parseCurrencyBRToCents,
  parsePercentageBRToBasisPoints,
} from "@/lib/br-formatters";
import { useState } from "react";
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
  const [name, setName] = useState("");
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
        className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl border bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl sm:p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const d = new FormData(e.currentTarget);
          void onSave({
            name,
            hourlyCostCents: parseCurrencyBRToCents(String(d.get("hourly") ?? "")),
            burdenRateBasisPoints: parsePercentageBRToBasisPoints(
              String(d.get("burden") ?? ""),
            ),
            fixedAdditionalCents: parseCurrencyBRToCents(
              String(d.get("additional") ?? ""),
            ),
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
            <ProperNameInput
              id="labor-name"
              name="name"
              value={name}
              onValueChange={setName}
              autoFocus
              required
            />
          </div>
          <div>
            <Label htmlFor="labor-hourly">Custo por hora</Label>
            <CurrencyFormInput
              id="labor-hourly"
              name="hourly"
              defaultValue={0}
              required
            />
          </div>
          <div>
            <Label htmlFor="labor-burden">Encargos (%)</Label>
            <PercentageFormInput id="labor-burden" name="burden" defaultValue={0} />
          </div>
          <div>
            <Label htmlFor="labor-additional">Adicional fixo</Label>
            <CurrencyFormInput id="labor-additional" name="additional" defaultValue={0} />
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
