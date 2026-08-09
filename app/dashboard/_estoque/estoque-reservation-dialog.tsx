"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { stockUnitLabels } from "./estoque-data";
import type { StockOrderReference } from "./estoque-ordens-gateway";
import type { StockReservationFormValues } from "./estoque-schema";
import type { StockSnapshot } from "./estoque-types";
export function StockReservationDialog({
  open,
  items,
  orders,
  initialItemId,
  busy,
  error,
  onClose,
  onSave,
}: {
  open: boolean;
  items: StockSnapshot[];
  orders: StockOrderReference[];
  initialItemId?: string;
  busy: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (value: StockReservationFormValues) => Promise<void>;
}) {
  const [itemId, setItemId] = useState(initialItemId ?? items[0]?.item.id ?? "");
  useEffect(() => {
    if (open) queueMicrotask(() => setItemId(initialItemId ?? items[0]?.item.id ?? ""));
  }, [open, initialItemId, items]);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open, busy, onClose]);
  if (!open) return null;
  const selected = items.find((item) => item.item.id === itemId);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-title"
        className="w-full max-w-lg rounded-xl border bg-background p-5 shadow-2xl"
      >
        <h2 id="reservation-title" className="text-lg font-bold">
          Reservar material
        </h2>
        <p className="text-sm text-muted-foreground">
          A reserva reduz somente a disponibilidade.
        </p>
        {error ? (
          <div
            role="alert"
            className="mt-3 rounded-lg border border-rose-500/30 p-3 text-sm text-rose-600"
          >
            {error}
          </div>
        ) : null}
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const d = new FormData(e.currentTarget);
            void onSave({
              itemId,
              serviceOrderId: String(d.get("serviceOrderId")),
              purpose: String(d.get("purpose")),
              quantity: Number(d.get("quantity")),
            });
          }}
        >
          <Field label="Ordem de Serviço" htmlFor="reservation-order" help="Escolha o atendimento para o qual o material ficará separado.">
            <Select id="reservation-order" name="serviceOrderId" required autoFocus>
              <option value="">Selecione</option>
              {orders
                .filter((o) => o.reservationAllowed)
                .map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.number} · {o.title}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Material a reservar" htmlFor="reservation-item" help="A reserva reduz a quantidade disponível, mas não altera o saldo físico.">
            <Select
              id="reservation-item"
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              disabled={Boolean(initialItemId)}
            >
              {items
                .filter((s) => !s.item.archivedAt)
                .map((s) => (
                  <option key={s.item.id} value={s.item.id}>
                    {s.item.internalCode} · {s.item.name}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Como o material será usado?" htmlFor="reservation-purpose" help="Descreva a etapa ou aplicação prevista na Ordem de Serviço.">
            <Input
              id="reservation-purpose"
              name="purpose"
              placeholder="Ex.: Tubulação da instalação principal"
              required
            />
          </Field>
          <Field label={`Quantidade a reservar${selected ? ` (${stockUnitLabels[selected.item.unit]})` : ""}`} htmlFor="reservation-quantity" help="Informe somente a quantidade prevista para este atendimento.">
            <Input
              id="reservation-quantity"
              name="quantity"
              type="number"
              min="0"
              step={selected ? 1 / selected.item.unitScale : "any"}
              required
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy || !selected}>
              {busy ? "Reservando..." : "Criar reserva"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
