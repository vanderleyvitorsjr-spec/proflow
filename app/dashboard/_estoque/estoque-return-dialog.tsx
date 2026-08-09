"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import type { StockMovement } from "./estoque-types";
export function StockReturnDialog({
  movement,
  busy,
  error,
  onClose,
  onSave,
}: {
  movement: StockMovement | null;
  busy: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (quantity: number, reason: string) => Promise<void>;
}) {
  if (!movement) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="return-title"
        className="w-full max-w-md rounded-xl border bg-background p-5"
      >
        <h2 id="return-title" className="font-bold">
          Devolver consumo
        </h2>
        <p className="text-sm text-muted-foreground">
          O custo original será reutilizado.
        </p>
        {error ? (
          <p role="alert" className="text-sm text-rose-600">
            {error}
          </p>
        ) : null}
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const d = new FormData(e.currentTarget);
            void onSave(Number(d.get("quantity")), String(d.get("reason")));
          }}
        >
          <Field label="Quantidade devolvida" htmlFor="return-quantity" help="Informe quanto do material consumido retornou ao estoque em condições de uso.">
            <Input
              id="return-quantity"
              name="quantity"
              type="number"
              min="0"
              step="any"
              autoFocus
              required
            />
          </Field>
          <Field label="Motivo da devolução" htmlFor="return-reason" help="Explique por que o material retornou ao estoque.">
            <Input id="return-reason" name="reason" placeholder="Ex.: Material não utilizado no atendimento" required />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              Devolver
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
