"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderHeading,
  PageHeaderIcon,
  PageHeaderIdentity,
} from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import {
  addFinancialPaymentAction,
  cancelFinancialInstallmentAction,
  cancelFinancialTransactionAction,
  getFinancialTransactionAction,
  listFinancialStateAction,
  reverseFinancialPaymentAction,
} from "../financeiro-actions";
import { FinanceiroCancelDialog } from "../financeiro-cancel-dialog";
import { natureLabels } from "../financeiro-data";
import { FinanceiroInstallments } from "../financeiro-installments";
import { formatMoneyCents } from "../financeiro-money";
import { FinanceiroPaymentDialog } from "../financeiro-payment-dialog";
import type { FinancialPaymentFormValues } from "../financeiro-schema";
import {
  transactionOpenCents,
  transactionPaidCents,
  transactionStatus,
} from "../financeiro-status";
import type {
  FinancialAccountWithBalance,
  FinancialInstallment,
  FinancialPayment,
  FinancialTransaction,
} from "../financeiro-types";
import { accountsWithBalance } from "../financeiro-selectors";
const date = (value: string) =>
    new Intl.DateTimeFormat("pt-BR").format(new Date(`${value}T12:00:00`)),
  dateTime = (value: string) =>
    new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
      new Date(value),
    );
export function FinanceiroDetail({ id }: { id: string }) {
  const [transaction, setTransaction] = useState<FinancialTransaction | null>(null),
    [accounts, setAccounts] = useState<FinancialAccountWithBalance[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [selectedInstallment, setSelectedInstallment] = useState<FinancialInstallment | null>(
      null,
    ),
    [cancelTarget, setCancelTarget] = useState<{
      type: "transaction" | "installment";
      installment?: FinancialInstallment;
    } | null>(null),
    [reversal, setReversal] = useState<{
      installment: FinancialInstallment;
      payment: FinancialPayment;
    } | null>(null);
  const load = useCallback(async () => {
    const [record, state] = await Promise.all([
      getFinancialTransactionAction(id),
      listFinancialStateAction(),
    ]);
    if (record.ok) setTransaction(record.data);
    else setError(record.error.message);
    if (state.ok) setAccounts(accountsWithBalance(state.data));
    setLoading(false);
  }, [id]);
  useEffect(() => {
    void Promise.all([getFinancialTransactionAction(id), listFinancialStateAction()])
      .then(([record, state]) => {
        if (record.ok) setTransaction(record.data);
        else setError(record.error.message);
        if (state.ok) setAccounts(accountsWithBalance(state.data));
      })
      .finally(() => setLoading(false));
  }, [id]);
  const payment = async (value: FinancialPaymentFormValues) => {
    if (!selectedInstallment) return;
    setBusy(true);
    const result = await addFinancialPaymentAction(id, selectedInstallment.id, value);
    if (result.ok) {
      await load();
      setSelectedInstallment(null);
      setNotice(
        transaction?.kind === "RECEIVABLE"
          ? "Recebimento registrado."
          : "Pagamento registrado.",
      );
    } else setError(result.error.message);
    setBusy(false);
  };
  const cancel = async (reason: string) => {
    if (!cancelTarget) return;
    setBusy(true);
    const result =
      cancelTarget.type === "transaction"
        ? await cancelFinancialTransactionAction(id, { reason })
        : await cancelFinancialInstallmentAction(id, cancelTarget.installment!.id, {
            reason,
          });
    if (result.ok) {
      await load();
      setCancelTarget(null);
      setNotice("Cancelamento registrado com histórico preservado.");
    } else setError(result.error.message);
    setBusy(false);
  };
  const reverse = async (reason: string) => {
    if (!reversal) return;
    setBusy(true);
    const result = await reverseFinancialPaymentAction(
      id,
      reversal.installment.id,
      reversal.payment.id,
      { reason },
    );
    if (result.ok) {
      await load();
      setReversal(null);
      setNotice("Estorno registrado e saldo da parcela reaberto.");
    } else setError(result.error.message);
    setBusy(false);
  };
  if (loading)
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Carregando lançamento...
      </div>
    );
  if (!transaction)
    return (
      <EmptyState
        title="Lançamento não encontrado"
        description={error || "O lançamento pode ter sido arquivado."}
        action={
          <Button asChild>
            <Link href="/dashboard/financeiro">Voltar ao Financeiro</Link>
          </Button>
        }
      />
    );
  const accountName =
      accounts.find((item) => item.id === transaction.accountId)?.name ??
      "Conta arquivada",
    status =
      transaction.kind === "REALIZED"
        ? transaction.canceledAt
          ? "CANCELED"
          : "PAID"
        : transactionStatus(transaction);
  return (
    <div className="space-y-3">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderIdentity>
            <PageHeaderIcon>
              <ReceiptText className="h-5 w-5" />
            </PageHeaderIcon>
            <PageHeaderHeading
              title={`FIN-${String(transaction.sequence).padStart(5, "0")} · ${transaction.title}`}
              description={
                transaction.kind === "REALIZED"
                  ? "Lançamento manual realizado."
                  : transaction.kind === "RECEIVABLE"
                    ? "Conta a receber manual."
                    : "Conta a pagar manual."
              }
            />
          </PageHeaderIdentity>
          <PageHeaderActions>
            <Button asChild variant="secondary">
              <Link href="/dashboard/financeiro">
                <ArrowLeft className="h-4 w-4" />
                Financeiro
              </Link>
            </Button>
            {transaction.kind !== "REALIZED" && !transaction.canceledAt && (
              <Button
                variant="destructive"
                onClick={() => setCancelTarget({ type: "transaction" })}
              >
                Cancelar saldo
              </Button>
            )}
          </PageHeaderActions>
        </PageHeaderContent>
      </PageHeader>
      {notice && (
        <div
          role="status"
          className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
        >
          {notice}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
        >
          {error}
        </div>
      )}
      <Card>
        <CardHeader>
          <SectionHeader compact title="Dados financeiros" />
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Info label="Natureza" value={natureLabels[transaction.nature]} />
          <Info label="Status" value={status} />
          <Info label="Total" value={formatMoneyCents(transaction.totalCents)} />
          <Info
            label="Realizado"
            value={formatMoneyCents(
              transaction.kind === "REALIZED" && !transaction.canceledAt
                ? transaction.totalCents
                : transactionPaidCents(transaction),
            )}
          />
          <Info
            label="Saldo aberto"
            value={formatMoneyCents(
              transaction.kind === "REALIZED" ? 0 : transactionOpenCents(transaction),
            )}
          />
          <Info label="Conta" value={accountName} />
          <Info label="Competência" value={date(transaction.competenceDate)} />
          <Info label="Emissão" value={date(transaction.issueDate)} />
          <Info
            label="Cliente/fornecedor"
            value={transaction.customerName || transaction.supplier || "Não informado"}
          />
          <Info label="Descrição" value={transaction.description} />
          <Info label="Observações" value={transaction.notes || "Não informadas"} />
          <Info
            label="Criado/atualizado"
            value={`${dateTime(transaction.createdAt)} · ${dateTime(transaction.updatedAt)}`}
          />
        </CardContent>
      </Card>
      {(transaction.clientId || transaction.serviceOrderId) && (
        <Card>
          <CardHeader>
            <SectionHeader compact title="Origem e vínculos" />
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-sm">
            {transaction.clientId && (
              <Button asChild variant="secondary" size="sm">
                <Link href={`/dashboard/clientes/${transaction.clientId}`}>
                  Cliente: {transaction.clientNameSnapshot ?? transaction.customerName}
                </Link>
              </Button>
            )}
            {transaction.serviceOrderId && (
              <Button asChild variant="secondary" size="sm">
                <Link href={`/dashboard/ordens/${transaction.serviceOrderId}`}>
                  OS {transaction.serviceOrderNumberSnapshot}
                </Link>
              </Button>
            )}
            {transaction.purpose && (
              <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
                Finalidade: {transaction.purpose}
              </span>
            )}
            {transaction.manuallyModified && (
              <span className="rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                Alterado manualmente
              </span>
            )}
          </CardContent>
        </Card>
      )}
      {transaction.kind !== "REALIZED" && (
        <FinanceiroInstallments
          transaction={transaction}
          onPayment={setSelectedInstallment}
          onCancelInstallment={(installment) =>
            setCancelTarget({ type: "installment", installment })
          }
          onReverse={(installment, paymentItem) =>
            setReversal({ installment, payment: paymentItem })
          }
        />
      )}
      <Card>
        <CardHeader>
          <SectionHeader compact title="Histórico completo" />
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {[...transaction.history].reverse().map((item) => (
            <div key={item.id} className="flex justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium">{item.description}</p>
                <p className="text-xs text-muted-foreground">{item.type}</p>
              </div>
              <time className="text-xs text-muted-foreground">
                {dateTime(item.createdAt)}
              </time>
            </div>
          ))}
        </CardContent>
      </Card>
      <FinanceiroPaymentDialog
        open={Boolean(selectedInstallment)}
        transaction={transaction}
        installment={selectedInstallment}
        accounts={accounts}
        busy={busy}
        error={error}
        onClose={() => setSelectedInstallment(null)}
        onSubmit={payment}
      />
      <FinanceiroCancelDialog
        open={Boolean(cancelTarget)}
        title={
          cancelTarget?.type === "installment"
            ? "Cancelar parcela?"
            : "Cancelar saldo do lançamento?"
        }
        description="Pagamentos existentes não serão apagados. O motivo ficará registrado no histórico."
        busy={busy}
        error={error}
        onClose={() => setCancelTarget(null)}
        onConfirm={cancel}
      />
      <FinanceiroCancelDialog
        open={Boolean(reversal)}
        title="Estornar pagamento?"
        description="O efeito no saldo será neutralizado e a parcela será reaberta."
        busy={busy}
        error={error}
        onClose={() => setReversal(null)}
        onConfirm={reverse}
      />
    </div>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1">{value}</p>
    </div>
  );
}
