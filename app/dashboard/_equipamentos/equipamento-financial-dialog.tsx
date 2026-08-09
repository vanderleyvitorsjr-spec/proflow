"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HelpHint } from "@/components/ui/help-hint";
import { Select } from "@/components/ui/select";
import {
  equipmentFinancialFormSchema,
  type EquipmentFinancialFormValues,
} from "./equipamentos-schema";
import type { EquipmentFinancialAccountReference } from "@/lib/contracts/financeiro.contract";

const today = () => new Date().toISOString().slice(0, 10);
export function EquipmentFinancialDialog({
  open,
  title,
  maintenance,
  accounts,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  maintenance?: boolean;
  accounts: EquipmentFinancialAccountReference[];
  busy: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (value: EquipmentFinancialFormValues) => Promise<void>;
}) {
  const [value, setValue] = useState<EquipmentFinancialFormValues>({
    nature: maintenance ? "EXPENSE" : "INVESTMENT",
    accountId: "",
    competenceDate: today(),
    firstDueDate: today(),
    installmentCount: 1,
    notes: "",
    payNow: false,
    paymentMethod: "Transferência",
  });
  const [validation, setValidation] = useState("");
  useEffect(() => {
    if (open)
      queueMicrotask(() => {
        setValue({
          nature: maintenance ? "EXPENSE" : "INVESTMENT",
          accountId: accounts[0]?.id ?? "",
          competenceDate: today(),
          firstDueDate: today(),
          installmentCount: 1,
          notes: "",
          payNow: false,
          paymentMethod: "Transferência",
        });
        setValidation("");
      });
  }, [accounts, maintenance, open]);
  useEffect(() => {
    if (!open) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [busy, onClose, open]);
  if (!open) return null;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = equipmentFinancialFormSchema.safeParse(value);
    if (!parsed.success) {
      setValidation(parsed.error.issues[0]?.message ?? "Revise os campos.");
      return;
    }
    await onSubmit(parsed.data);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="equipment-financial-title"
        onSubmit={submit}
        className="w-full max-w-xl rounded-xl border bg-background p-5 shadow-2xl"
      >
        <h2 id="equipment-financial-title" className="text-lg font-bold">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          O lançamento só será criado após esta confirmação. Pagamentos continuam no fluxo
          do Financeiro.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="financial-nature">Natureza</Label>
            <Select
              id="financial-nature"
              autoFocus
              disabled={maintenance}
              value={value.nature}
              onChange={(event) =>
                setValue({
                  ...value,
                  nature: event.target.value as EquipmentFinancialFormValues["nature"],
                })
              }
            >
              <option value="INVESTMENT">Investimento</option>
              <option value="EXPENSE">Despesa</option>
            </Select>
            <HelpHint text="Investimento registra a aquisição do equipamento; despesa registra manutenção ou gasto operacional." className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="financial-account">Conta</Label>
            <Select
              id="financial-account"
              value={value.accountId}
              onChange={(event) => setValue({ ...value, accountId: event.target.value })}
            >
              <option value="">Selecione</option>
              {accounts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
            <HelpHint text="Conta bancária, carteira ou caixa que ficará vinculada ao lançamento." className="mt-1.5" />
          </div>
          <Field
            id="financial-competence"
            label="Competência"
            help="Mês ao qual o gasto pertence, mesmo que o pagamento ocorra em outra data."
            type="date"
            value={value.competenceDate}
            onChange={(competenceDate) => setValue({ ...value, competenceDate })}
          />
          <Field
            id="financial-due"
            label="Primeiro vencimento"
            help="Data prevista para pagar a primeira parcela."
            type="date"
            value={value.firstDueDate}
            onChange={(firstDueDate) => setValue({ ...value, firstDueDate })}
          />
          <Field
            id="financial-installments"
            label="Parcelas"
            help="Quantidade de parcelas em que o valor será dividido."
            type="number"
            value={String(value.installmentCount)}
            onChange={(installmentCount) =>
              setValue({ ...value, installmentCount: Number(installmentCount) })
            }
          />
          <Field
            id="financial-notes"
            label="Observações"
            value={value.notes}
            onChange={(notes) => setValue({ ...value, notes })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={value.payNow}
              onChange={(event) => setValue({ ...value, payNow: event.target.checked })}
            />
            Registrar pagamento integral agora
          </label>
          {value.payNow ? (
            <Field
              id="financial-method"
              label="Método de pagamento"
              help="Ex.: Pix, boleto, transferência ou cartão."
              value={value.paymentMethod}
              onChange={(paymentMethod) => setValue({ ...value, paymentMethod })}
            />
          ) : null}
        </div>
        {validation || error ? (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
          >
            {validation || error}
          </p>
        ) : null}
        <footer className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={busy || !accounts.length}>
            {busy ? "Gerando..." : maintenance ? "Gerar despesa" : "Gerar lançamento"}
          </Button>
        </footer>
      </form>
    </div>
  );
}
function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  help,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  help?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        min={type === "number" ? 1 : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {help ? <HelpHint text={help} className="mt-1.5" /> : null}
    </div>
  );
}
