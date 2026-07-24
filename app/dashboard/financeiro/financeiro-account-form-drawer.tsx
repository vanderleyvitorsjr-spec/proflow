"use client";
import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrencyTextInput, ProperNameInput } from "@/components/ui/br-masked-inputs";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { accountTypeLabels } from "./financeiro-data";
import { formatMoneyCents } from "./financeiro-money";
import {
  financialAccountSchema,
  type FinancialAccountFormValues,
} from "./financeiro-schema";
import type { FinancialAccountWithBalance } from "./financeiro-types";
const initial = (
  account?: FinancialAccountWithBalance | null,
): FinancialAccountFormValues => ({
  name: account?.name ?? "",
  type: account?.type ?? "CHECKING",
  openingBalance: account
    ? formatMoneyCents(account.openingBalanceCents).replace("R$", "").trim()
    : "0,00",
  isDefault: account?.isDefault ?? false,
});
export function FinanceiroAccountFormDrawer({
  open,
  account,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  account?: FinancialAccountWithBalance | null;
  busy?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (value: FinancialAccountFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState(() => initial(account));
  const [validation, setValidation] = useState("");
  useEffect(() => {
    if (open)
      queueMicrotask(() => {
        setValues(initial(account));
        setValidation("");
      });
  }, [account, open]);
  useEffect(() => {
    if (!open) return;
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [busy, onClose, open]);
  if (!open) return null;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = financialAccountSchema.safeParse(values);
    if (!parsed.success) {
      setValidation(parsed.error.issues[0]?.message ?? "Revise os campos.");
      return;
    }
    await onSubmit(parsed.data);
  };
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-form-title"
        onSubmit={submit}
        className="flex h-[100dvh] w-full flex-col overflow-hidden border-l border-border bg-background shadow-2xl sm:max-w-lg"
      >
        <header className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 id="account-form-title" className="text-lg font-bold">
              {account ? "Editar conta" : "Nova conta"}
            </h2>
            <p className="text-xs text-muted-foreground">
              O saldo atual será derivado dos lançamentos.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </Button>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto p-4 pb-28 sm:p-5">
          <Field label="Nome da conta" htmlFor="account-name" help="Use um nome fácil de reconhecer nos lançamentos e relatórios.">
            <ProperNameInput
              id="account-name"
              autoFocus
              placeholder="Ex.: Conta corrente principal"
              value={values.name}
              onValueChange={(name) => setValues({ ...values, name })}
            />
          </Field>
          <Field label="Tipo de conta" htmlFor="account-type" help="Escolha onde o dinheiro é movimentado ou guardado.">
            <Select
              id="account-type"
              value={values.type}
              onChange={(e) =>
                setValues({
                  ...values,
                  type: e.target.value as FinancialAccountFormValues["type"],
                })
              }
            >
              {Object.entries(accountTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Saldo inicial" htmlFor="opening-balance" help="Informe o saldo disponível na conta antes do primeiro lançamento no ProFlow.">
            <CurrencyTextInput
              id="opening-balance"
              allowNegative
              value={values.openingBalance}
              onValueChange={(openingBalance) => setValues({ ...values, openingBalance })}
              placeholder="0,00"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={values.isDefault}
              onChange={(e) => setValues({ ...values, isDefault: e.target.checked })}
            />
            Definir como conta padrão
          </label>
          {(validation || error) && (
            <p
              role="alert"
              className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
            >
              {validation || error}
            </p>
          )}
        </div>
        <footer className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Salvando..." : "Salvar conta"}
          </Button>
        </footer>
      </form>
    </div>
  );
}
