"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProfessionalDocument } from "@/components/documents/professional-document";
import { receiptDocument, type DocumentIdentity } from "@/components/documents/professional-document-domain";
import { getDocumentIdentityAction } from "@/app/dashboard/configuracoes/configuracoes-actions";
import { registerDocumentMetadataAction } from "@/app/dashboard/documentos/documentos-actions";
import { getFinancialTransactionAction, getReceiptRelatedClientAction } from "../../financeiro-actions";
import type { FinancialTransaction } from "../../financeiro-types";

export function FinanceiroReceipt({ id, paymentId }: { id: string; paymentId?: string }) {
  const [transaction, setTransaction] = useState<FinancialTransaction | null>(null);
  const [identity, setIdentity] = useState<DocumentIdentity>();
  const [relatedClient, setRelatedClient] = useState<{ id: string; name: string; phone?: string; email?: string } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    void Promise.all([getFinancialTransactionAction(id), getDocumentIdentityAction(), getReceiptRelatedClientAction(id)]).then(([financial, company, client]) => {
      if (financial.ok) setTransaction(financial.data); else setError(financial.error.message);
      if (company.ok) setIdentity(company.data);
      if (client.ok) setRelatedClient(client.data);
    });
  }, [id]);
  const source = useMemo(() => {
    if (!transaction) return undefined;
    const candidates = transaction.installments.flatMap((installment) =>
      installment.payments.map((payment) => ({ payment, installment })),
    );
    if (paymentId) return candidates.find(({ payment }) => payment.id === paymentId);
    const active = candidates.filter(({ payment }) => !payment.reversedAt);
    if (!active.length) return undefined;
    return active.sort((a, b) => new Date(b.payment.paidAt).getTime() - new Date(a.payment.paidAt).getTime())[0];
  }, [paymentId, transaction]);
  const amountCents = source?.payment.amountCents ?? (transaction?.kind === "REALIZED" ? transaction.totalCents : 0);
  const paidAt = source?.payment.paidAt ?? transaction?.realizedAt ?? transaction?.issueDate ?? "";
  const number = transaction
    ? `REC-${new Date(paidAt).getFullYear()}-${String(transaction.sequence).padStart(5, "0")}${source ? `-${String(source.installment.number).padStart(2, "0")}` : ""}`
    : "";
  useEffect(() => {
    if (!transaction || !number || amountCents <= 0) return;
    void registerDocumentMetadataAction({
      type: "RECEIPT", entity: "Recebimento", entityId: source?.payment.id ?? transaction.id,
      number, version: 1, title: `${number} — ${transaction.customerName || transaction.clientNameSnapshot || "Cliente"}`,
      status: source?.payment.reversedAt || transaction.canceledAt ? "ARCHIVED" : "AVAILABLE",
      origin: "FINANCEIRO", responsible: identity?.companyName,
      link: `/dashboard/financeiro/${transaction.id}/comprovante${source ? `?payment=${source.payment.id}` : ""}`,
    });
  }, [amountCents, identity?.companyName, number, source, transaction]);
  if (error) return <p className="p-6 text-sm text-red-600">{error}</p>;
  if (!transaction) return <p className="p-6 text-sm text-muted-foreground">Carregando recibo...</p>;
  if (transaction.direction !== "INCOME" || amountCents <= 0 || (paymentId && !source)) return <div className="mx-auto max-w-2xl p-6"><Card><CardContent className="space-y-4 p-6"><h1 className="text-xl font-semibold">Recibo indisponível</h1><p className="text-sm text-muted-foreground">O recibo somente pode ser emitido para um recebimento financeiro existente.</p><Button asChild><Link href={`/dashboard/financeiro/${id}`}>Voltar ao lançamento</Link></Button></CardContent></Card></div>;
  const document = receiptDocument({
    identity, number,
    receivedFrom: relatedClient?.name || transaction.customerName || transaction.clientNameSnapshot || "Cliente não informado",
    clientPhone: relatedClient?.phone, clientEmail: relatedClient?.email,
    amountCents, description: receiptDescription(transaction),
    paymentMethod: source?.payment.method || "Não informada",
    paymentReference: source?.payment.reference,
    installment: source && source.installment.total > 1 ? `${source.installment.number}/${source.installment.total}` : "À vista",
    serviceOrder: transaction.serviceOrderNumberSnapshot,
    paidAt, notes: [transaction.notes, source?.payment.notes, source?.payment.reversedAt ? `Recebimento estornado: ${source.payment.reversalReason || "sem motivo informado"}.` : undefined].filter(Boolean).join("\n"),
  });
  return <main className="space-y-3"><div className="print:hidden"><Button asChild variant="secondary"><Link href={`/dashboard/financeiro/${id}`}><ArrowLeft className="h-4 w-4"/>Voltar ao lançamento</Link></Button></div><ProfessionalDocument data={document}/></main>;
}

function receiptDescription(transaction: FinancialTransaction) {
  const clean = (value: string) => value.trim().replace(/\s+/g, " ").replace(/([.!?])\1+$/g, "$1").replace(/\.\.$/, ".");
  if (transaction.serviceOrderNumberSnapshot)
    return clean(`Referente à Ordem de Serviço ${transaction.serviceOrderNumberSnapshot}${transaction.serviceOrderTitleSnapshot ? ` — ${transaction.serviceOrderTitleSnapshot}` : ""}.`);
  return clean(transaction.description || transaction.title);
}
