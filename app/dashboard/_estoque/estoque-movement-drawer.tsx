"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyFormInput, DecimalBRInput } from "@/components/ui/br-masked-inputs";
import { parseCurrencyBRToCents, parseDecimalBR } from "@/lib/br-formatters";
import { Label } from "@/components/ui/label";
import { HelpHint } from "@/components/ui/help-hint";
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
        className="h-[100dvh] w-full overflow-y-auto border-l bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-xl sm:p-5"
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
              quantity: parseDecimalBR(String(d.get("quantity") ?? "")),
              unitCost: parseCurrencyBRToCents(String(d.get("unitCost") ?? "")) / 100,
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
            <HelpHint text="Escolha o material que terá sua quantidade alterada." className="mt-1.5" />
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
            <HelpHint text="Entrada aumenta o saldo; saída, perda e ajuste de saída reduzem o saldo disponível." className="mt-1.5" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="movement-quantity">
                Quantidade {selected ? `(${stockUnitLabels[selected.item.unit]})` : ""}
              </Label>
              <DecimalBRInput
                id="movement-quantity"
                name="quantity"
                defaultValue={0}
                maximumFractionDigits={selected?.item.unitScale === 1 ? 0 : 3}
                autoFocus
                required
                aria-label="Quantidade no padrão brasileiro"
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
              <CurrencyFormInput
                id="movement-cost"
                name="unitCost"
                defaultValue={0}
                aria-label="Custo unitário em reais"
              />
              <HelpHint text="Valor pago por uma unidade deste material. Ele será usado no cálculo do custo médio." className="mt-1.5" />
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
              <HelpHint text="Vincule a saída original quando o material estiver retornando ao estoque." className="mt-1.5" />
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
            <Input id="movement-reason" name="reason" placeholder="Ex.: Compra para reposição do almoxarifado" required />
            <HelpHint text="Explique por que a quantidade do material está sendo alterada." className="mt-1.5" />
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
