"use client";
import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        className="h-full w-full max-w-lg overflow-y-auto border-l border-border bg-background shadow-2xl"
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
        <div className="space-y-4 p-5">
          <div>
            <Label htmlFor="account-name">Nome</Label>
            <Input
              id="account-name"
              autoFocus
              value={values.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="account-type">Tipo</Label>
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
          </div>
          <div>
            <Label htmlFor="opening-balance">Saldo inicial</Label>
            <Input
              id="opening-balance"
              inputMode="decimal"
              value={values.openingBalance}
              onChange={(e) => setValues({ ...values, openingBalance: e.target.value })}
              placeholder="0,00"
            />
          </div>
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
        <footer className="flex justify-end gap-2 border-t border-border p-5">
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
