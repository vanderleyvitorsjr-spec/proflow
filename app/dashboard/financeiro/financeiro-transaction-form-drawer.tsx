"use client";
import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { natureLabels } from "./financeiro-data";
import { getFinancialConfiguration } from "./financeiro-configuracoes-gateway";
import type { FinancialPublicSettings } from "@/lib/contracts/configuracoes.contract";
import { formatMoneyCents } from "./financeiro-money";
import {
  financialTransactionSchema,
  type FinancialTransactionFormValues,
} from "./financeiro-schema";
import type {
  FinancialAccountWithBalance,
  FinancialNature,
  FinancialTransactionView,
} from "./financeiro-types";
const today = () => new Date().toISOString().slice(0, 10);
const initial = (
  nature: FinancialNature,
  transaction?: FinancialTransactionView | null,
): FinancialTransactionFormValues => ({
  title: transaction?.title ?? "",
  description: transaction?.description ?? "",
  nature: transaction?.nature ?? nature,
  direction: transaction?.direction ?? (nature === "REVENUE" ? "INCOME" : "EXPENSE"),
  category:
    transaction?.category ??
    (nature === "REVENUE"
      ? "Serviços"
      : nature === "INVESTMENT"
        ? "Equipamentos"
        : "Outros"),
  accountId: transaction?.accountId ?? "",
  competenceDate: transaction?.competenceDate ?? today(),
  issueDate: transaction?.issueDate ?? today(),
  realizedAt: transaction?.realizedAt ?? today(),
  total: transaction
    ? formatMoneyCents(transaction.totalCents).replace("R$", "").trim()
    : "",
  supplier: transaction?.supplier ?? "",
  notes: transaction?.notes ?? "",
});
export function FinanceiroTransactionFormDrawer({
  open,
  nature,
  transaction,
  accounts,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  nature: FinancialNature;
  transaction?: FinancialTransactionView | null;
  accounts: FinancialAccountWithBalance[];
  busy?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (value: FinancialTransactionFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState(() => initial(nature, transaction));
  const [validation, setValidation] = useState("");
  const [configuration, setConfiguration] = useState<FinancialPublicSettings | null>(null);
  const [configurationWarning, setConfigurationWarning] = useState("");
  useEffect(() => {
    if (open) {
      void getFinancialConfiguration().then(({ settings, warning }) => {
        const value = initial(nature, transaction);
        if (!transaction) {
          const categories = categoriesForNature(settings, nature);
          value.category = categories[0] ?? value.category;
        }
        if (!value.accountId) {
          value.accountId = accounts.find((item) => item.id === settings.defaultAccountId)?.id ?? "";
          if (!value.accountId && !settings.defaultAccountId)
            value.accountId = accounts.find((item) => item.isDefault)?.id ?? accounts[0]?.id ?? "";
        }
        setConfiguration(settings);
        setConfigurationWarning(
          warning ??
            (settings.defaultAccountId && !value.accountId
              ? "A conta padrão configurada não está disponível. Selecione uma conta manualmente."
              : ""),
        );
        setValues(value);
        setValidation("");
      });
    }
  }, [accounts, nature, open, transaction]);
  useEffect(() => {
    if (!open) return;
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [busy, onClose, open]);
  if (!open) return null;
  const setNature = (value: FinancialNature) =>
    setValues({
      ...values,
      nature: value,
      direction: value === "REVENUE" ? "INCOME" : "EXPENSE",
      category: configuration ? categoriesForNature(configuration, value)[0] ?? "" : values.category,
    });
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = financialTransactionSchema.safeParse(values);
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
        aria-labelledby="transaction-form-title"
        onSubmit={submit}
        className="h-full w-full max-w-2xl overflow-y-auto border-l border-border bg-background shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 id="transaction-form-title" className="text-lg font-bold">
              {transaction
                ? "Editar lançamento"
                : `Nova ${natureLabels[nature].toLocaleLowerCase("pt-BR")}`}
            </h2>
            <p className="text-xs text-muted-foreground">
              Lançamento manual realizado na data informada.
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
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="transaction-title">Título</Label>
            <Input
              id="transaction-title"
              autoFocus
              value={values.title}
              onChange={(e) => setValues({ ...values, title: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="transaction-description">Descrição</Label>
            <textarea
              id="transaction-description"
              className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={values.description}
              onChange={(e) => setValues({ ...values, description: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="transaction-nature">Natureza</Label>
            <Select
              id="transaction-nature"
              value={values.nature}
              onChange={(e) => setNature(e.target.value as FinancialNature)}
            >
              {Object.entries(natureLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="transaction-direction">Direção</Label>
            <Select
              id="transaction-direction"
              value={values.direction}
              onChange={(e) =>
                setValues({
                  ...values,
                  direction: e.target
                    .value as FinancialTransactionFormValues["direction"],
                })
              }
              disabled={values.nature !== "INVESTMENT"}
            >
              <option value="INCOME">Entrada</option>
              <option value="EXPENSE">Saída</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="transaction-category">Categoria</Label>
            <Input
              id="transaction-category"
              list="financial-categories"
              value={values.category}
              onChange={(e) => setValues({ ...values, category: e.target.value })}
            />
            <datalist id="financial-categories">
              {(configuration ? categoriesForNature(configuration, values.nature) : []).map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>
          <div>
            <Label htmlFor="transaction-account">Conta</Label>
            <Select
              id="transaction-account"
              value={values.accountId}
              onChange={(e) => setValues({ ...values, accountId: e.target.value })}
            >
              <option value="">Selecione</option>
              {accounts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="transaction-competence">Competência</Label>
            <Input
              id="transaction-competence"
              type="date"
              value={values.competenceDate}
              onChange={(e) => setValues({ ...values, competenceDate: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="transaction-issue">Emissão</Label>
            <Input
              id="transaction-issue"
              type="date"
              value={values.issueDate}
              onChange={(e) => setValues({ ...values, issueDate: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="transaction-realized">Realização</Label>
            <Input
              id="transaction-realized"
              type="date"
              value={values.realizedAt}
              onChange={(e) => setValues({ ...values, realizedAt: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="transaction-total">Valor</Label>
            <Input
              id="transaction-total"
              inputMode="decimal"
              placeholder="0,00"
              value={values.total}
              onChange={(e) => setValues({ ...values, total: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="transaction-supplier">Fornecedor opcional</Label>
            <Input
              id="transaction-supplier"
              value={values.supplier}
              onChange={(e) => setValues({ ...values, supplier: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="transaction-notes">Observações</Label>
            <textarea
              id="transaction-notes"
              className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
        <footer className="flex justify-end gap-2 border-t border-border p-5">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy || accounts.length === 0}>
            {busy ? "Salvando..." : "Salvar lançamento"}
          </Button>
        </footer>
      </form>
    </div>
  );
}

function categoriesForNature(settings: FinancialPublicSettings, nature: FinancialNature) {
  if (nature === "REVENUE") return settings.revenueCategories;
  if (nature === "INVESTMENT") return settings.investmentCategories;
  return settings.expenseCategories;
}
