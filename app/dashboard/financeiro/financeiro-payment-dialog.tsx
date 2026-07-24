"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyTextInput } from "@/components/ui/br-masked-inputs";
import { Field } from "@/components/ui/field";
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
          <Field label={transaction.kind === "RECEIVABLE" ? "Valor recebido" : "Valor pago"} htmlFor="payment-value" help="Informe o valor efetivamente movimentado nesta baixa.">
            <CurrencyTextInput
              id="payment-value"
              autoFocus
              value={values.amount}
              onValueChange={(amount) => setValues({ ...values, amount })}
            />
          </Field>
          <Field label="Data da movimentação" htmlFor="payment-date" help="Dia em que o dinheiro entrou ou saiu da conta.">
            <Input
              id="payment-date"
              type="date"
              value={values.paidAt}
              onChange={(e) => setValues({ ...values, paidAt: e.target.value })}
            />
          </Field>
          <Field label="Conta movimentada" htmlFor="payment-account" help="Escolha a conta bancária, carteira ou caixa onde ocorreu a movimentação.">
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
          </Field>
          <Field label="Forma de pagamento" htmlFor="payment-method" help="Informe como o valor foi recebido ou pago.">
            <Select
              id="payment-method"
              value={values.method}
              onChange={(e) => setValues({ ...values, method: e.target.value })}
            >
              {methods.map((method) => <option key={method} value={method}>{ptBrLabel(method)}</option>)}
            </Select>
          </Field>
          <Field label="Comprovante ou referência" htmlFor="payment-reference" help="Número do comprovante, boleto, Pix ou documento relacionado.">
            <Input
              id="payment-reference"
              placeholder="Ex.: Pix E2E ou número do comprovante"
              value={values.reference}
              onChange={(e) => setValues({ ...values, reference: e.target.value })}
            />
          </Field>
          <Field label="Observações internas" htmlFor="payment-notes">
            <Input
              id="payment-notes"
              value={values.notes}
              onChange={(e) => setValues({ ...values, notes: e.target.value })}
            />
          </Field>
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
