"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import type { StockReservationOperationValues } from "./estoque-schema";
import type { StockReservation } from "./estoque-types";
export function StockConsumptionDialog({
  open,
  reservation,
  busy,
  error,
  onClose,
  onSave,
}: {
  open: boolean;
  reservation: StockReservation | null;
  busy: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (value: StockReservationOperationValues) => Promise<void>;
}) {
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open, busy, onClose]);
  if (!open || !reservation) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consume-title"
        className="w-full max-w-md rounded-xl border bg-background p-5 shadow-2xl"
      >
        <h2 id="consume-title" className="font-bold">
          Consumir material reservado
        </h2>
        <p className="text-sm text-muted-foreground">
          {reservation.serviceOrderNumberSnapshot} · {reservation.purpose}
        </p>
        {error ? (
          <div role="alert" className="mt-3 text-sm text-rose-600">
            {error}
          </div>
        ) : null}
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const d = new FormData(e.currentTarget);
            void onSave({
              reservationId: reservation.id,
              quantity: Number(d.get("quantity")),
              reason: String(d.get("reason")),
              administrative: d.get("administrative") === "on",
            });
          }}
        >
          <Field label="Quantidade utilizada" htmlFor="consume-quantity" help="Informe quanto do material reservado foi realmente usado na Ordem de Serviço.">
            <Input
              id="consume-quantity"
              name="quantity"
              type="number"
              min="0"
              step="any"
              autoFocus
              required
            />
          </Field>
          <Field label="Motivo do consumo" htmlFor="consume-reason" help="Explique de forma curta onde ou como o material foi utilizado.">
            <Input id="consume-reason" name="reason" placeholder="Ex.: Utilizado na instalação da unidade externa" required />
          </Field>
          <label className="block rounded-lg border border-amber-500/30 p-3 text-sm">
            <input name="administrative" type="checkbox" className="mr-2" />
            Consumir além da reserva com confirmação administrativa
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Consumindo..." : "Consumir"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
