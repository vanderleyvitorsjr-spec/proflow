"use client";

import Link from "next/link";
import { ArrowLeft, Printer, ReceiptText } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyBRLFromCents, formatDateBR, formatDateTimeBR } from "@/lib/br-formatters";
import { getFinancialTransactionAction } from "../../financeiro-actions";
import { transactionPaidCents } from "../../financeiro-status";
import type { FinancialTransaction } from "../../financeiro-types";

export function FinanceiroReceipt({ id }: { id: string }) {
  const [transaction, setTransaction] = useState<FinancialTransaction | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void getFinancialTransactionAction(id).then((result) => {
      if (result.ok) setTransaction(result.data);
      else setError(result.error.message);
    });
  }, [id]);

  if (error) return <p className="p-6 text-sm text-rose-600">{error}</p>;
  if (!transaction) return <p className="p-6 text-sm text-muted-foreground">Carregando comprovante...</p>;

  const paidCents = transaction.kind === "REALIZED" && !transaction.canceledAt
    ? transaction.totalCents
    : transactionPaidCents(transaction);
  if (paidCents <= 0) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card><CardContent className="space-y-4 p-6">
          <h1 className="text-xl font-semibold">Comprovante indisponível</h1>
          <p className="text-sm text-muted-foreground">Registre um recebimento ou pagamento antes de emitir o comprovante.</p>
          <Button asChild><Link href={`/dashboard/financeiro/${id}`}>Voltar ao lançamento</Link></Button>
        </CardContent></Card>
      </div>
    );
  }

  const number = `COMP-${String(transaction.sequence).padStart(5, "0")}`;
  return (
    <main className="min-h-screen bg-muted/30 p-4 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-3xl justify-between gap-2 print:hidden">
        <Button asChild variant="secondary"><Link href={`/dashboard/financeiro/${id}`}><ArrowLeft className="h-4 w-4" />Voltar</Link></Button>
        <Button onClick={() => window.print()}><Printer className="h-4 w-4" />Imprimir ou Salvar em PDF</Button>
      </div>
      <article className="mx-auto min-h-[270mm] max-w-3xl bg-white p-8 text-slate-950 shadow-xl print:min-h-0 print:max-w-none print:shadow-none sm:p-12">
        <header className="flex items-start justify-between gap-6 border-b pb-6">
          <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">ProFlow</p><h1 className="mt-2 flex items-center gap-2 text-3xl font-bold"><ReceiptText className="h-7 w-7" />Comprovante Financeiro</h1></div>
          <div className="text-right text-sm"><p className="font-semibold">{number}</p><p>{formatDateBR(new Date().toISOString())}</p></div>
        </header>

        <section className="mt-8 grid gap-6 sm:grid-cols-2">
          <Info label={transaction.direction === "INCOME" ? "Recebido de" : "Pago a"} value={transaction.customerName || transaction.supplier || "Não informado"} />
          <Info label="Valor" value={formatCurrencyBRLFromCents(paidCents)} strong />
          <Info label="Referente a" value={transaction.title} />
          <Info label="Descrição" value={transaction.description || "Não informada"} />
          <Info label="Competência" value={formatDateBR(transaction.competenceDate)} />
          <Info label="Data do registro" value={formatDateTimeBR(transaction.updatedAt)} />
        </section>

        {transaction.installments.length ? (
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Pagamentos registrados</h2>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className="p-3 text-left">Parcela</th><th className="p-3 text-left">Data</th><th className="p-3 text-left">Forma</th><th className="p-3 text-right">Valor</th></tr></thead>
                <tbody>{transaction.installments.flatMap((installment) => installment.payments.filter((payment) => !payment.reversedAt).map((payment) => (
                  <tr key={payment.id} className="border-t"><td className="p-3">{installment.number}/{installment.total}</td><td className="p-3">{formatDateBR(payment.paidAt)}</td><td className="p-3">{payment.method || "Não informada"}</td><td className="p-3 text-right font-medium">{formatCurrencyBRLFromCents(payment.amountCents)}</td></tr>
                )))}</tbody>
              </table>
            </div>
          </section>
        ) : null}

        <footer className="mt-16 border-t pt-6 text-xs text-slate-500">
          <p>Documento emitido a partir de um registro financeiro existente. A emissão deste comprovante não cria ou altera pagamentos.</p>
          <p className="mt-2">Emitido em {formatDateTimeBR(new Date().toISOString())}.</p>
        </footer>
      </article>
    </main>
  );
}

function Info({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p><p className={strong ? "mt-1 text-2xl font-bold" : "mt-1 text-sm"}>{value}</p></div>;
}
