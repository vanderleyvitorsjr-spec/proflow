"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { StockPurchaseFinancialAccountReference } from "@/lib/contracts/financeiro.contract";
import type { StockPurchaseFinancialFormValues } from "./estoque-schema";
import type { StockPurchase } from "./estoque-types";
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export function StockFinancialSummary({
  purchase,
  accounts,
  busy,
  onCreate,
  onCancelOpen,
}: {
  purchase: StockPurchase;
  accounts: StockPurchaseFinancialAccountReference[];
  busy: boolean;
  onCreate: (
    input: StockPurchaseFinancialFormValues,
    additional?: boolean,
  ) => Promise<void>;
  onCancelOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const summary = purchase.financialSnapshot;
  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Financeiro</h2>
          <p className="text-xs text-muted-foreground">
            Conta a pagar explicitamente vinculada à compra.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {summary ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                window.location.assign(`/dashboard/financeiro/${summary.transactionId}`)
              }
            >
              Abrir lançamento
            </Button>
          ) : null}
          {summary?.openCents ? (
            <Button size="sm" variant="secondary" onClick={onCancelOpen}>
              Cancelar saldo
            </Button>
          ) : null}
          <Button
            size="sm"
            onClick={() => setOpen((value) => !value)}
            disabled={["DRAFT", "CANCELED", "ARCHIVED"].includes(purchase.status)}
          >
            {summary ? "Gerar diferença" : "Gerar conta a pagar"}
          </Button>
        </div>
      </div>
      {summary ? (
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Total financeiro</p>
            <p className="font-semibold">{money.format(summary.totalCents / 100)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pago</p>
            <p className="font-semibold">{money.format(summary.paidCents / 100)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Em aberto</p>
            <p className="font-semibold">{money.format(summary.openCents / 100)}</p>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Nenhuma obrigação financeira gerada.
        </p>
      )}
      {open ? (
        <form
          className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            void onCreate(
              {
                accountId: String(data.get("accountId")),
                competenceDate: String(data.get("competenceDate")),
                firstDueDate: String(data.get("firstDueDate")),
                installmentCount: Number(data.get("installmentCount")),
                notes: String(data.get("notes") ?? ""),
              },
              Boolean(summary),
            );
          }}
        >
          <div>
            <Label htmlFor="financial-account">Conta</Label>
            <Select id="financial-account" name="accountId" required>
              <option value="">Selecione</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="financial-installments">Parcelas</Label>
            <Input
              id="financial-installments"
              name="installmentCount"
              type="number"
              min="1"
              max="120"
              defaultValue="1"
              required
            />
          </div>
          <div>
            <Label htmlFor="financial-competence">Competência</Label>
            <Input
              id="financial-competence"
              name="competenceDate"
              type="date"
              defaultValue={purchase.purchaseDate}
              required
            />
          </div>
          <div>
            <Label htmlFor="financial-due">Primeiro vencimento</Label>
            <Input
              id="financial-due"
              name="firstDueDate"
              type="date"
              defaultValue={purchase.expectedDate ?? purchase.purchaseDate}
              required
            />
          </div>
          <Input
            name="notes"
            placeholder="Observações financeiras"
            className="sm:col-span-2"
          />
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={busy}>
              {busy ? "Gerando..." : summary ? "Gerar diferença" : "Confirmar geração"}
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
