"use client";
import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyTextInput, ProperNameInput } from "@/components/ui/br-masked-inputs";
import { Label } from "@/components/ui/label";
import { HelpHint } from "@/components/ui/help-hint";
import { Select } from "@/components/ui/select";
import {
  financialObligationSchema,
  type FinancialObligationFormValues,
} from "./financeiro-schema";
import type { FinancialAccountWithBalance } from "./financeiro-types";
import type { ClientPublicReference } from "@/lib/contracts/clientes.contract";
const today = () => new Date().toISOString().slice(0, 10);
export function FinancialObligationFormDrawer({
  open,
  kind,
  accounts,
  clients = [],
  busy,
  error,
  onClose,
  onSubmit,
  initialValues,
  title,
}: {
  open: boolean;
  kind: "RECEIVABLE" | "PAYABLE";
  accounts: FinancialAccountWithBalance[];
  clients?: ClientPublicReference[];
  busy?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (value: FinancialObligationFormValues) => Promise<void>;
  initialValues?: Partial<FinancialObligationFormValues>;
  title?: string;
}) {
  const [values, setValues] = useState<FinancialObligationFormValues>({
      title: "",
      description: "",
      category: kind === "RECEIVABLE" ? "Serviços" : "Outros",
      accountId: "",
      total: "",
      issueDate: today(),
      competenceDate: today(),
      firstDueDate: today(),
      installmentCount: 1,
      supplier: "",
      customerName: "",
      clientId: "",
      notes: "",
    }),
    [validation, setValidation] = useState("");
  useEffect(() => {
    if (open)
      queueMicrotask(() =>
        setValues((current) => ({
          ...current,
          ...initialValues,
          accountId: accounts.find((item) => item.isDefault)?.id ?? accounts[0]?.id ?? "",
          supplier: initialValues?.supplier ?? "",
          customerName: initialValues?.customerName ?? "",
          clientId: initialValues?.clientId ?? "",
          title: initialValues?.title ?? "",
          description: initialValues?.description ?? "",
          total: initialValues?.total ?? "",
          installmentCount: initialValues?.installmentCount ?? 1,
        })),
      );
  }, [accounts, initialValues, open]);
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
    const parsed = financialObligationSchema.safeParse(values);
    if (!parsed.success) {
      setValidation(parsed.error.issues[0]?.message ?? "Revise os campos.");
      return;
    }
    setValidation("");
    await onSubmit(parsed.data);
  };
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="obligation-title"
        onSubmit={submit}
        className="flex h-[100dvh] w-full flex-col overflow-hidden border-l border-border bg-background shadow-2xl sm:max-w-2xl"
      >
        <header className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 id="obligation-title" className="text-lg font-bold">
              {title ?? (kind === "RECEIVABLE" ? "Nova conta a receber" : "Nova conta a pagar")}
            </h2>
            <p className="text-xs text-muted-foreground">
              As parcelas serão distribuídas em centavos sem diferença no total.
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
          <Field label="Identificação da conta" id="obl-title" help="Use um nome que permita reconhecer rapidamente o que será recebido ou pago.">
            <Input
              id="obl-title"
              autoFocus
              placeholder="Ex.: Manutenção preventiva de julho"
              value={values.title}
              onChange={(e) => setValues({ ...values, title: e.target.value })}
            />
          </Field>
          <Field label="Categoria financeira" id="obl-category" help="Classifique a conta para organizar relatórios e análises financeiras.">
            <Input
              id="obl-category"
              placeholder="Ex.: Serviços de manutenção"
              value={values.category}
              onChange={(e) => setValues({ ...values, category: e.target.value })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Label htmlFor="obl-description">Descrição</Label>
            <textarea
              id="obl-description"
              className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={values.description}
              onChange={(e) => setValues({ ...values, description: e.target.value })}
            />
          </div>
          <Field label="Conta financeira" id="obl-account">
            <Select
              id="obl-account"
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
          <Field label="Valor total" id="obl-total">
            <CurrencyTextInput
              id="obl-total"
              placeholder="0,00"
              value={values.total}
              onValueChange={(total) => setValues({ ...values, total })}
            />
          </Field>
          <Field label="Emissão" id="obl-issue">
            <Input
              id="obl-issue"
              type="date"
              value={values.issueDate}
              onChange={(e) => setValues({ ...values, issueDate: e.target.value })}
            />
          </Field>
          <Field label="Mês de referência" id="obl-competence" help="Indica a qual período financeiro esta conta pertence, mesmo que o vencimento seja em outra data.">
            <Input
              id="obl-competence"
              type="date"
              value={values.competenceDate}
              onChange={(e) => setValues({ ...values, competenceDate: e.target.value })}
            />
          </Field>
          <Field label="Primeiro vencimento" id="obl-due">
            <Input
              id="obl-due"
              type="date"
              value={values.firstDueDate}
              onChange={(e) => setValues({ ...values, firstDueDate: e.target.value })}
            />
          </Field>
          <Field label="Quantidade de parcelas" id="obl-count">
            <Input
              id="obl-count"
              type="number"
              min={1}
              max={120}
              value={values.installmentCount}
              onChange={(e) =>
                setValues({ ...values, installmentCount: Number(e.target.value) })
              }
            />
          </Field>
          {kind === "RECEIVABLE" ? (
            <Field label="Cliente" id="obl-client">
              <Select
                id="obl-client"
                value={values.clientId}
                onChange={(e) => {
                  const client = clients.find((item) => item.id === e.target.value);
                  setValues({
                    ...values,
                    clientId: e.target.value,
                    customerName: client?.name ?? "",
                  });
                }}
              >
                <option value="">Sem cliente vinculado</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <Field label="Fornecedor opcional" id="obl-supplier">
              <ProperNameInput
                id="obl-supplier"
                value={values.supplier}
                onValueChange={(supplier) => setValues({ ...values, supplier })}
              />
            </Field>
          )}
          <div className="sm:col-span-2">
            <Label htmlFor="obl-notes">Observações</Label>
            <textarea
              id="obl-notes"
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
        </div>
        <footer className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy || !accounts.length}>
            {busy ? "Salvando..." : "Salvar"}
          </Button>
        </footer>
      </form>
    </div>
  );
}
function Field({
  label,
  id,
  children,
  help,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
  help?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {help ? <HelpHint text={help} className="mt-1.5" /> : null}
    </div>
  );
}
