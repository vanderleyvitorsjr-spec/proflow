"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { stockUnitLabels } from "./estoque-data";
import type { StockMovementFormValues } from "./estoque-schema";
import type { StockMovementType, StockSnapshot } from "./estoque-types";
const labels: Record<StockMovementType, string> = {
  ENTRY: "Entrada",
  EXIT: "Saída",
  RETURN: "Devolução",
  ADJUSTMENT_IN: "Ajuste positivo",
  ADJUSTMENT_OUT: "Ajuste negativo",
  LOSS: "Perda",
  CONSUMPTION: "Consumo em OS",
};
export function StockMovementDrawer({
  open,
  items,
  initialItemId,
  initialType = "ENTRY",
  busy,
  error,
  onClose,
  onSave,
}: {
  open: boolean;
  items: StockSnapshot[];
  initialItemId?: string;
  initialType?: StockMovementType;
  busy: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (input: StockMovementFormValues) => Promise<void>;
}) {
  const [type, setType] = useState<StockMovementType>(initialType),
    [itemId, setItemId] = useState(initialItemId ?? items[0]?.item.id ?? "");
  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        setType(initialType);
        setItemId(initialItemId ?? items[0]?.item.id ?? "");
      });
    }
  }, [open, initialType, initialItemId, items]);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open, busy, onClose]);
  if (!open) return null;
  const selected = items.find((s) => s.item.id === itemId),
    adds = ["ENTRY", "RETURN", "ADJUSTMENT_IN"].includes(type);
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="movement-title"
        className="h-full w-full max-w-xl overflow-y-auto border-l bg-background p-5 shadow-2xl"
      >
        <div className="flex justify-between">
          <div>
            <h2 id="movement-title" className="text-lg font-bold">
              Registrar movimento
            </h2>
            <p className="text-sm text-muted-foreground">
              Saldos e custos serão recalculados pelo histórico.
            </p>
          </div>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Fechar
          </Button>
        </div>
        {error ? (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-rose-500/30 p-3 text-sm text-rose-600"
          >
            {error}
          </div>
        ) : null}
        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const d = new FormData(e.currentTarget);
            void onSave({
              itemId,
              type: type as Exclude<StockMovementType, "CONSUMPTION">,
              quantity: Number(d.get("quantity")),
              unitCost: Number(d.get("unitCost") || 0),
              date: String(d.get("date")),
              reason: String(d.get("reason") || ""),
              notes: String(d.get("notes") || ""),
              originalMovementId: String(d.get("originalMovementId") || ""),
              useAverageCost: d.get("useAverageCost") === "on",
              confirmZeroCost: d.get("confirmZeroCost") === "on",
              allowNegativeAdjustment: d.get("allowNegativeAdjustment") === "on",
            });
          }}
        >
          <div>
            <Label htmlFor="movement-item">Item</Label>
            <Select
              id="movement-item"
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
          </div>
          <div>
            <Label htmlFor="movement-type">Tipo</Label>
            <Select
              id="movement-type"
              value={type}
              onChange={(e) => setType(e.target.value as StockMovementType)}
            >
              {Object.entries(labels)
                .filter(([id]) => id !== "CONSUMPTION")
                .map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="movement-quantity">
                Quantidade {selected ? `(${stockUnitLabels[selected.item.unit]})` : ""}
              </Label>
              <Input
                id="movement-quantity"
                name="quantity"
                type="number"
                min="0"
                step={selected ? 1 / selected.item.unitScale : "any"}
                autoFocus
                required
              />
            </div>
            <div>
              <Label htmlFor="movement-date">Data</Label>
              <Input
                id="movement-date"
                name="date"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                required
              />
            </div>
          </div>
          {adds ? (
            <div>
              <Label htmlFor="movement-cost">Custo unitário</Label>
              <Input
                id="movement-cost"
                name="unitCost"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
              />
              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                <label>
                  <input type="checkbox" name="useAverageCost" className="mr-2" />
                  Usar custo médio atual
                </label>
                <label>
                  <input type="checkbox" name="confirmZeroCost" className="mr-2" />
                  Confirmar entrada sem custo
                </label>
              </div>
            </div>
          ) : null}
          {type === "RETURN" && selected ? (
            <div>
              <Label htmlFor="movement-original">Movimento original (opcional)</Label>
              <Select id="movement-original" name="originalMovementId">
                <option value="">Sem referência</option>
                {selected.movements
                  .filter(
                    (m) =>
                      ["EXIT", "LOSS", "ADJUSTMENT_OUT"].includes(m.type) &&
                      !m.canceledAt,
                  )
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.date} · {labels[m.type as StockMovementType]}
                    </option>
                  ))}
              </Select>
            </div>
          ) : null}
          {type === "ADJUSTMENT_OUT" ? (
            <label className="block rounded-lg border border-amber-500/30 p-3 text-sm">
              <input type="checkbox" name="allowNegativeAdjustment" className="mr-2" />
              Confirmo ajuste administrativo que pode deixar saldo negativo
            </label>
          ) : null}
          <div>
            <Label htmlFor="movement-reason">Motivo</Label>
            <Input id="movement-reason" name="reason" required />
          </div>
          <div>
            <Label htmlFor="movement-notes">Observações</Label>
            <textarea
              id="movement-notes"
              name="notes"
              className="min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy || !selected}>
              {busy
                ? "Registrando..."
                : `Registrar ${labels[type].toLocaleLowerCase("pt-BR")}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
