"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { StockMovement } from "./estoque-types";
export function StockPurchaseReturnDialog({
  open,
  receipts,
  busy,
  error,
  onClose,
  onSave,
  getReceiptLabel,
}: {
  open: boolean;
  receipts: StockMovement[];
  busy: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (movementId: string, quantity: number, reason: string) => Promise<void>;
  getReceiptLabel: (receipt: StockMovement) => string;
}) {
  const [movementId, setMovementId] = useState(""),
    [quantity, setQuantity] = useState(0),
    [reason, setReason] = useState("");
  useEffect(() => {
    if (open)
      queueMicrotask(() => {
        setMovementId("");
        setQuantity(0);
        setReason("");
      });
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
        aria-labelledby="return-title"
        className="w-full max-w-md rounded-xl border bg-background p-5 shadow-2xl"
      >
        <h2 id="return-title" className="font-semibold">
          Devolver ao fornecedor
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A saída preservará o recebimento original e sua rastreabilidade.
        </p>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        ) : null}
        <div className="mt-4 space-y-3">
          <div>
            <Label htmlFor="return-receipt">Recebimento</Label>
            <Select
              id="return-receipt"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              value={movementId}
              onChange={(event) => setMovementId(event.target.value)}
            >
              <option value="">Selecione</option>
              {receipts.map((receipt) => (
                <option key={receipt.id} value={receipt.id}>
                  {receipt.date} · {getReceiptLabel(receipt)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="return-quantity">Quantidade</Label>
            <Input
              id="return-quantity"
              type="number"
              min="0.001"
              step="0.001"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="return-reason">Motivo</Label>
            <Input
              id="return-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={busy || !movementId || quantity <= 0 || reason.trim().length < 3}
            onClick={() => void onSave(movementId, quantity, reason)}
          >
            {busy ? "Salvando..." : "Registrar devolução"}
          </Button>
        </div>
      </div>
    </div>
  );
}
