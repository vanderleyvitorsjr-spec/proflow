"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import type { StockReservationOperationValues } from "./estoque-schema";
import type { StockReservation } from "./estoque-types";
export function StockReleaseDialog({
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
        aria-labelledby="release-title"
        className="w-full max-w-md rounded-xl border bg-background p-5 shadow-2xl"
      >
        <h2 id="release-title" className="font-bold">
          Liberar reserva
        </h2>
        {error ? (
          <p role="alert" className="mt-2 text-sm text-rose-600">
            {error}
          </p>
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
            });
          }}
        >
          <Field label="Quantidade a liberar" htmlFor="release-quantity" help="Informe quanto deixará de ficar reservado e voltará ao estoque disponível.">
            <Input
              id="release-quantity"
              name="quantity"
              type="number"
              min="0"
              step="any"
              autoFocus
              required
            />
          </Field>
          <Field label="Motivo da liberação" htmlFor="release-reason" help="Explique por que o material não será mais necessário nesta Ordem.">
            <Input id="release-reason" name="reason" placeholder="Ex.: Serviço cancelado pelo cliente" required />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Liberando..." : "Liberar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
