"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { FinancialRelationOrder } from "./financeiro-relations-gateway";
import type { FinancialAccountWithBalance } from "./financeiro-types";
import type { FinancialObligationFormValues } from "./financeiro-schema";
import { formatMoneyCents } from "./financeiro-money";

const today = () => new Date().toISOString().slice(0, 10);
export function FinanceiroOrderReceivableDrawer({
  open,
  orders,
  accounts,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  orders: FinancialRelationOrder[];
  accounts: FinancialAccountWithBalance[];
  busy: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (orderId: string, values: FinancialObligationFormValues) => Promise<void>;
}) {
  const [orderId, setOrderId] = useState(""),
    [count, setCount] = useState(1),
    [due, setDue] = useState(today());
  useEffect(() => {
    if (open)
      queueMicrotask(() => {
        setOrderId(orders[0]?.id ?? "");
        setCount(1);
        setDue(today());
      });
  }, [open, orders]);
  if (!open) return null;
  const order = orders.find((item) => item.id === orderId);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!order) return;
    await onSubmit(order.id, {
      title: `Recebível da OS ${order.number}`,
      description: order.title,
      category: "Serviços",
      accountId: accounts.find((item) => item.isDefault)?.id ?? accounts[0]?.id ?? "",
      total: (order.estimatedValueCents / 100).toFixed(2).replace(".", ","),
      issueDate: today(),
      competenceDate: today(),
      firstDueDate: due,
      installmentCount: count,
      supplier: "",
      customerName: order.client.name,
      clientId: order.client.id,
      notes: `Origem: Ordem de Serviço ${order.number}.`,
    });
  };
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-receivable-title"
        onSubmit={submit}
        className="h-full w-full max-w-xl overflow-y-auto border-l bg-background p-5 shadow-2xl"
      >
        <h2 id="order-receivable-title" className="text-lg font-bold">
          Gerar recebível da OS
        </h2>
        <p className="mb-5 text-sm text-muted-foreground">
          A criação só ocorre após sua confirmação.
        </p>
        <div className="space-y-4">
          <div>
            <Label htmlFor="financial-order">Ordem elegível</Label>
            <Select
              id="financial-order"
              autoFocus
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            >
              <option value="">Selecione</option>
              {orders.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.number} · {item.title}
                </option>
              ))}
            </Select>
          </div>
          {order && (
            <div className="grid gap-3 rounded-lg border p-3 text-sm sm:grid-cols-2">
              <p>
                <span className="text-muted-foreground">Cliente:</span>
                <br />
                {order.client.name}
              </p>
              <p>
                <span className="text-muted-foreground">Status:</span>
                <br />
                {order.status}
              </p>
              <p>
                <span className="text-muted-foreground">Valor:</span>
                <br />
                {formatMoneyCents(order.estimatedValueCents)}
              </p>
              <p>
                <span className="text-muted-foreground">Atualizada:</span>
                <br />
                {new Intl.DateTimeFormat("pt-BR").format(new Date(order.updatedAt))}
              </p>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="financial-order-due">Primeiro vencimento</Label>
              <Input
                id="financial-order-due"
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="financial-order-count">Parcelas</Label>
              <Input
                id="financial-order-count"
                type="number"
                min={1}
                max={120}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              />
            </div>
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
            >
              {error}
            </p>
          )}
        </div>
        <footer className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            Voltar
          </Button>
          <Button type="submit" disabled={busy || !order || !accounts.length}>
            {busy ? "Gerando..." : "Confirmar recebível"}
          </Button>
        </footer>
      </form>
    </div>
  );
}
