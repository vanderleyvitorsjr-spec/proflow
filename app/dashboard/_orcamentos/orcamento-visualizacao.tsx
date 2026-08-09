"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ProfessionalDocument } from "@/components/documents/professional-document";
import { quoteDocument } from "@/components/documents/professional-document-domain";
import { formatDateTimeBR } from "@/lib/br-formatters";
import { compareQuoteVersions, validateQuoteConversion, type ProfessionalQuote } from "./orcamentos-domain";
import { convertQuoteToOrderAction, getQuoteAction, listQuotesAction, newQuoteVersionAction } from "./orcamentos-actions";
import { registerDocumentMetadataAction } from "@/app/dashboard/_documentos/documentos-actions";

export function OrcamentoVisualizacao({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [quote, setQuote] = useState<ProfessionalQuote>();
  const [versions, setVersions] = useState<ProfessionalQuote[]>([]);
  const [conversion, setConversion] = useState(false);
  const [error, setError] = useState("");
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0, 10));
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [priority, setPriority] = useState<"LOW" | "NORMAL" | "HIGH" | "URGENT">("NORMAL");
  useEffect(() => {
    void Promise.all([getQuoteAction(quoteId), listQuotesAction({ archived: false })]).then(([current, all]) => {
      setQuote(current); setVersions(all.filter((item) => item.id === current.parentId || item.parentId === (current.parentId ?? current.id) || item.id === current.id).sort((a, b) => a.version - b.version));
    });
  }, [quoteId]);
  useEffect(() => {
    if (!quote) return;
    void registerDocumentMetadataAction({
      type: "QUOTE", entity: "Orçamento", entityId: quote.id, number: quote.number,
      version: quote.version, title: `${quote.number} — ${quote.clientName}`, status: "AVAILABLE",
      origin: "ORÇAMENTOS", responsible: quote.responsible,
      link: `/dashboard/orcamentos/${quote.id}/visualizar`,
    });
  }, [quote]);
  const comparison = useMemo(() => quote && versions.length > 1 ? compareQuoteVersions(versions.at(-2)!, quote) : undefined, [quote, versions]);
  if (!quote) return <div className="rounded-xl border bg-card p-6">Carregando Visualização...</div>;
  const missing = validateQuoteConversion(quote);
  const document = quoteDocument({
    number: quote.number, version: quote.version, issuedAt: quote.issuedAt, validUntil: quote.validUntil,
    client: quote.clientName, clientDocument: quote.clientDocument, address: quote.address,
    description: quote.description, items: quote.items, subtotalCents: quote.subtotalCents,
    discountCents: quote.discountCents, surchargeCents: quote.surchargeCents, totalCents: quote.totalCents,
    paymentTerms: quote.paymentTerms.notes, deadline: quote.executionDeadline, warranty: quote.warranty,
    notes: quote.customerNotes, terms: quote.terms,
  });
  async function convert() {
    if (!quote) return;
    setError("");
    try {
      const result = await convertQuoteToOrderAction(quote.id, { priority, scheduledDate, scheduledTime, estimatedDurationMinutes: 60, checklistText: "Confirmar execução do serviço" });
      router.push(`/dashboard/ordens/${result.order.id}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível converter o Orçamento."); }
  }
  return <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-3 print:hidden">
      <div><p className="font-semibold">{quote.number} · Versão {quote.version}</p><p className="text-xs text-muted-foreground">Atualizado em {formatDateTimeBR(quote.updatedAt)}</p></div>
      <div className="flex flex-wrap gap-2"><Button asChild size="sm" variant="secondary"><Link href={`/dashboard/orcamentos/${quote.id}/editar`}>Editar</Link></Button><Button size="sm" variant="secondary" onClick={() => newQuoteVersionAction(quote.id).then((created) => router.push(`/dashboard/orcamentos/${created.id}/editar`))}>Criar Nova Versão</Button>{quote.serviceOrderId ? <Button asChild size="sm"><Link href={`/dashboard/ordens/${quote.serviceOrderId}`}>Abrir Ordem {quote.serviceOrderNumber}</Link></Button> : <Button size="sm" onClick={() => setConversion(true)}>Converter em Ordem</Button>}</div>
    </div>
    {conversion ? <section className="rounded-xl border bg-card p-4 print:hidden">
      <h2 className="font-semibold">Revisão da Conversão</h2>
      <p className="mt-1 text-sm text-muted-foreground">A Ordem será criada somente depois da confirmação. Nenhum pagamento, agenda ou movimento de Estoque será criado.</p>
      {missing.length ? <div className="mt-3 rounded-lg bg-amber-500/10 p-3 text-sm"><strong>Preencha os seguintes dados antes de converter:</strong><ul className="mt-1 list-disc pl-5">{missing.map((item) => <li key={item}>{item}</li>)}</ul></div> : <div className="mt-3 grid gap-3 sm:grid-cols-3"><label className="text-xs font-medium">Prioridade<Select value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)}><option value="LOW">Baixa</option><option value="NORMAL">Normal</option><option value="HIGH">Alta</option><option value="URGENT">Urgente</option></Select></label><label className="text-xs font-medium">Data Prevista<Input type="date" value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} /></label><label className="text-xs font-medium">Horário Previsto<Input type="time" value={scheduledTime} onChange={(event) => setScheduledTime(event.target.value)} /></label></div>}
      {error ? <p role="alert" className="mt-3 text-sm text-red-600">{error}</p> : null}
      <div className="mt-3 flex gap-2"><Button size="sm" variant="secondary" onClick={() => setConversion(false)}>Cancelar</Button><Button size="sm" disabled={Boolean(missing.length)} onClick={() => void convert()}>Confirmar e Criar Ordem</Button></div>
    </section> : null}
    {comparison ? <section className="grid gap-2 rounded-xl border bg-card p-4 text-sm sm:grid-cols-4 print:hidden"><h2 className="col-span-full font-semibold">Comparação com a Versão Anterior</h2><p>Itens adicionados: <strong>{comparison.added.length}</strong></p><p>Itens removidos: <strong>{comparison.removed.length}</strong></p><p>Itens alterados: <strong>{comparison.changed.length}</strong></p><p>Condições alteradas: <strong>{comparison.paymentChanged ? "Sim" : "Não"}</strong></p></section> : null}
    <ProfessionalDocument data={document} />
    <section className="rounded-xl border bg-card p-4 print:hidden"><h2 className="font-semibold">Histórico e Versões</h2><div className="mt-3 grid gap-3 lg:grid-cols-2"><div>{versions.map((version) => <Link key={version.id} className="flex justify-between border-b py-2 text-sm hover:text-primary" href={`/dashboard/orcamentos/${version.id}/visualizar`}><span>Versão {version.version}</span><span>{version.number}</span></Link>)}</div><div>{quote.history.map((event) => <div key={event.id} className="border-b py-2 text-sm"><strong>{event.description}</strong><p className="text-xs text-muted-foreground">{formatDateTimeBR(event.createdAt)}</p></div>)}</div></div></section>
  </div>;
}
