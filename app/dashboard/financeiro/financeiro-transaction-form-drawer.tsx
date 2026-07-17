"use client";
import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyTextInput, ProperNameInput } from "@/components/ui/br-masked-inputs";
import { Field } from "@/components/ui/field";
import { FormSectionIntro, RequiredFieldsNotice } from "@/components/ui/form-guidance";
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
        className="flex h-[100dvh] w-full flex-col overflow-hidden border-l border-border bg-background shadow-2xl sm:max-w-2xl"
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
        <div className="grid flex-1 gap-4 overflow-y-auto p-4 pb-28 sm:grid-cols-2 sm:p-5">
          <RequiredFieldsNotice className="sm:col-span-2" />
          <FormSectionIntro className="sm:col-span-2" title="Informações do lançamento" description="Registre o motivo, a classificação e a conta afetada por esta movimentação." />
          <Field className="sm:col-span-2" label="Identificação do lançamento" htmlFor="transaction-title" required help="Use um título que permita reconhecer a movimentação rapidamente. Ex.: Compra de cabos para obra Centro.">
            <Input
              id="transaction-title"
              autoFocus
              value={values.title}
              onChange={(e) => setValues({ ...values, title: e.target.value })}
            />
          </Field>
          <Field className="sm:col-span-2" label="Descrição" htmlFor="transaction-description" help="Detalhe o motivo do lançamento, o documento relacionado ou informações para conferência futura.">
            <textarea
              id="transaction-description"
              className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={values.description}
              onChange={(e) => setValues({ ...values, description: e.target.value })}
            />
          </Field>
          <Field label="Tipo financeiro" htmlFor="transaction-nature" required help="Receita é dinheiro recebido; despesa é gasto operacional; investimento é aquisição que gera benefício futuro.">
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
          </Field>
          <Field label="Movimento da conta" htmlFor="transaction-direction" help="Indica se o valor entra ou sai da conta. Em receitas e despesas, essa opção é definida automaticamente.">
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
          </Field>
          <Field label="Categoria financeira" htmlFor="transaction-category" required help="Classifique a movimentação para organizar relatórios. Ex.: Materiais, combustível, serviços ou equipamentos.">
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
          </Field>
          <Field label="Conta movimentada" htmlFor="transaction-account" required help="Escolha a conta bancária, carteira ou caixa onde o valor entrou ou saiu.">
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
          </Field>
          <FormSectionIntro className="sm:col-span-2 mt-2" title="Datas e valor" description="As datas ajudam a separar quando o fato ocorreu, quando foi emitido e quando afetou a conta." />
          <Field label="Mês de referência" htmlFor="transaction-competence" required help="Data usada para indicar a qual período financeiro a movimentação pertence, mesmo que o pagamento ocorra em outro dia.">
            <Input
              id="transaction-competence"
              type="date"
              value={values.competenceDate}
              onChange={(e) => setValues({ ...values, competenceDate: e.target.value })}
            />
          </Field>
          <Field label="Data de emissão" htmlFor="transaction-issue" required help="Data do recibo, nota fiscal, boleto ou documento que originou o lançamento.">
            <Input
              id="transaction-issue"
              type="date"
              value={values.issueDate}
              onChange={(e) => setValues({ ...values, issueDate: e.target.value })}
            />
          </Field>
          <Field label="Data da movimentação" htmlFor="transaction-realized" required help="Dia em que o dinheiro realmente entrou ou saiu da conta selecionada.">
            <Input
              id="transaction-realized"
              type="date"
              value={values.realizedAt}
              onChange={(e) => setValues({ ...values, realizedAt: e.target.value })}
            />
          </Field>
          <Field label="Valor total" htmlFor="transaction-total" required help="Informe o valor completo da movimentação em reais.">
            <CurrencyTextInput
              id="transaction-total"
              placeholder="0,00"
              value={values.total}
              onValueChange={(total) => setValues({ ...values, total })}
            />
          </Field>
          <Field className="sm:col-span-2" label="Fornecedor ou favorecido" htmlFor="transaction-supplier" help="Nome de quem recebeu ou forneceu o produto/serviço. Este campo é opcional.">
            <ProperNameInput
              id="transaction-supplier"
              value={values.supplier}
              onValueChange={(supplier) => setValues({ ...values, supplier })}
            />
          </Field>
          <Field className="sm:col-span-2" label="Observações internas" htmlFor="transaction-notes" help="Inclua número do documento, forma de pagamento ou informações úteis para conferência.">
            <textarea
              id="transaction-notes"
              className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
        <footer className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
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
