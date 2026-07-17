"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyTextInput } from "@/components/ui/br-masked-inputs";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ptBrLabel } from "@/lib/pt-br-labels";
import { formatMoneyCents } from "./financeiro-money";
import {
  financialPaymentSchema,
  type FinancialPaymentFormValues,
} from "./financeiro-schema";
import type {
  FinancialAccountWithBalance,
  FinancialInstallment,
  FinancialTransaction,
} from "./financeiro-types";
import { installmentOpenCents } from "./financeiro-status";
import { getFinancialConfiguration } from "./financeiro-configuracoes-gateway";
export function FinanceiroPaymentDialog({
  open,
  transaction,
  installment,
  accounts,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  transaction: FinancialTransaction | null;
  installment: FinancialInstallment | null;
  accounts: FinancialAccountWithBalance[];
  busy?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (value: FinancialPaymentFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState<FinancialPaymentFormValues>({
      amount: "",
      paidAt: new Date().toISOString().slice(0, 10),
      accountId: "",
      method: "Pix",
      notes: "",
      reference: "",
    }),
    [validation, setValidation] = useState("");
  const [methods, setMethods] = useState(["Pix"]);
  const [configurationWarning, setConfigurationWarning] = useState("");
  useEffect(() => {
    if (open && installment) {
      void getFinancialConfiguration().then(({ settings, warning }) => {
        setMethods(settings.paymentMethods);
        setConfigurationWarning(warning ?? "");
        setValues((current) => ({
          ...current,
          amount: formatMoneyCents(installmentOpenCents(installment))
            .replace("R$", "")
            .trim(),
          accountId:
            accounts.find((item) => item.id === transaction?.accountId)?.id ??
            accounts[0]?.id ??
            "",
          method: settings.paymentMethods.includes(current.method)
            ? current.method
            : settings.paymentMethods[0] ?? current.method,
        }));
      });
    }
  }, [accounts, installment, open, transaction]);
  useEffect(() => {
    if (!open) return;
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [busy, onClose, open]);
  if (!open || !transaction || !installment) return null;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = financialPaymentSchema.safeParse(values);
    if (!parsed.success) {
      setValidation(parsed.error.issues[0]?.message ?? "Revise os campos.");
      return;
    }
    await onSubmit(parsed.data);
  };
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/45 p-4">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-title"
        onSubmit={submit}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl sm:p-5"
      >
        <h2 id="payment-title" className="text-lg font-bold">
          {transaction.kind === "RECEIVABLE"
            ? "Registrar recebimento"
            : "Registrar pagamento"}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Parcela {installment.number}/{installment.total} · saldo{" "}
          {formatMoneyCents(installmentOpenCents(installment))}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="payment-value">Valor</Label>
            <CurrencyTextInput
              id="payment-value"
              autoFocus
              value={values.amount}
              onValueChange={(amount) => setValues({ ...values, amount })}
            />
          </div>
          <div>
            <Label htmlFor="payment-date">Data</Label>
            <Input
              id="payment-date"
              type="date"
              value={values.paidAt}
              onChange={(e) => setValues({ ...values, paidAt: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="payment-account">Conta</Label>
            <Select
              id="payment-account"
              value={values.accountId}
              onChange={(e) => setValues({ ...values, accountId: e.target.value })}
            >
              {accounts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="payment-method">Método</Label>
            <Select
              id="payment-method"
              value={values.method}
              onChange={(e) => setValues({ ...values, method: e.target.value })}
            >
              {methods.map((method) => <option key={method} value={method}>{ptBrLabel(method)}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="payment-reference">Referência opcional</Label>
            <Input
              id="payment-reference"
              value={values.reference}
              onChange={(e) => setValues({ ...values, reference: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="payment-notes">Observação</Label>
            <Input
              id="payment-notes"
              value={values.notes}
              onChange={(e) => setValues({ ...values, notes: e.target.value })}
            />
          </div>
          {(validation || error) && (
            <p
              role="alert"
              className="sm:col-span-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
            >
              {validation || error}
            </p>
          )}
          {configurationWarning && (
            <p role="status" className="sm:col-span-2 text-xs text-amber-700 dark:text-amber-300">
              {configurationWarning}
            </p>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            Voltar
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Registrando..." : "Confirmar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
