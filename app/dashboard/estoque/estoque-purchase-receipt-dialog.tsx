"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StockPurchase } from "./estoque-types";
import type { StockPurchaseReceiptValues } from "./estoque-schema";
export function StockPurchaseReceiptDialog({
  open,
  purchase,
  busy,
  error,
  onClose,
  onSave,
}: {
  open: boolean;
  purchase: StockPurchase;
  busy: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (input: StockPurchaseReceiptValues) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, number>>({});
  useEffect(() => {
    if (open) queueMicrotask(() => setValues({}));
  }, [open]);
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
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-title"
        className="w-full max-w-2xl rounded-xl border bg-background p-5 shadow-2xl"
      >
        <h2 id="receipt-title" className="font-semibold">
          Registrar recebimento
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Informe apenas as quantidades recebidas agora.
        </p>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        ) : null}
        <div className="mt-4 space-y-2">
          {purchase.items
            .filter((item) => item.receivedQuantity < item.orderedQuantity)
            .map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[1fr_9rem] items-center gap-3 rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{item.nameSnapshot}</p>
                  <p className="text-xs text-muted-foreground">
                    Pendente:{" "}
                    {(item.orderedQuantity - item.receivedQuantity) /
                      item.unitScaleSnapshot}
                  </p>
                </div>
                <Input
                  aria-label={`Quantidade recebida de ${item.nameSnapshot}`}
                  type="number"
                  min="0"
                  max={
                    (item.orderedQuantity - item.receivedQuantity) /
                    item.unitScaleSnapshot
                  }
                  step={1 / item.unitScaleSnapshot}
                  value={values[item.id] ?? 0}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [item.id]: Number(event.target.value),
                    }))
                  }
                />
              </div>
            ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={busy || !Object.values(values).some((value) => value > 0)}
            onClick={() =>
              void onSave({
                purchaseId: purchase.id,
                items: purchase.items.map((item) => ({
                  purchaseItemId: item.id,
                  quantity: values[item.id] ?? 0,
                })),
              })
            }
          >
            {busy ? "Recebendo..." : "Confirmar recebimento"}
          </Button>
        </div>
      </div>
    </div>
  );
}
