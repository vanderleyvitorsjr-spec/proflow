"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { MetricItem, MetricStrip } from "@/components/ui/metric-strip";
import {
  PageHeader, PageHeaderActions, PageHeaderContent, PageHeaderHeading,
  PageHeaderIcon, PageHeaderIdentity, PageHeaderToolbar,
} from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Table, TableActionsCell, TableBody, TableCell, TableHead, TableHeader, TableNumericCell, TableRow } from "@/components/ui/table";
import { formatCurrencyBRLFromCents, formatDateBR } from "@/lib/br-formatters";
import { ptBrLabel } from "@/lib/pt-br-labels";
import { duplicateQuoteAction, listQuotesAction, newQuoteVersionAction, transitionQuoteAction } from "./orcamentos-actions";
import { quoteStatuses, type ProfessionalQuote, type QuoteStatus } from "./orcamentos-domain";

export function OrcamentosPage() {
  const [quotes, setQuotes] = useState<ProfessionalQuote[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<QuoteStatus | "ALL">("ALL");
  const refresh = () => listQuotesAction({ search, status: status === "ALL" ? undefined : status }).then(setQuotes);
  useEffect(() => {
    void listQuotesAction({ search, status: status === "ALL" ? undefined : status }).then(setQuotes);
  }, [search, status]);

  const totals = useMemo(() => ({
    active: quotes.length,
    approved: quotes.filter((quote) => quote.status === "APPROVED").length,
    pending: quotes.filter((quote) => ["REVIEW", "WAITING_SEND", "SENT", "VIEWED"].includes(quote.status)).length,
    value: quotes.reduce((sum, quote) => sum + quote.totalCents, 0),
  }), [quotes]);

  return <div className="space-y-3">
    <PageHeader>
      <PageHeaderContent>
        <PageHeaderIdentity>
          <PageHeaderIcon><FileText className="size-4" /></PageHeaderIcon>
          <PageHeaderHeading title="Orçamentos" description="Crie, acompanhe e converta propostas comerciais sem gerar cobranças automaticamente." />
        </PageHeaderIdentity>
        <PageHeaderActions>
          <Button asChild size="sm"><Link href="/dashboard/orcamentos/novo"><Plus className="size-4" />Novo Orçamento</Link></Button>
        </PageHeaderActions>
      </PageHeaderContent>
      <PageHeaderToolbar>
        <div className="relative min-w-0 flex-1 sm:max-w-sm"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Número, cliente, documento, telefone ou título" aria-label="Pesquisar orçamentos" /></div>
        <Select value={status} onChange={(event) => setStatus(event.target.value as QuoteStatus | "ALL")} aria-label="Filtrar por situação">
          <option value="ALL">Todas as situações</option>
          {quoteStatuses.map((item) => <option key={item} value={item}>{ptBrLabel(item)}</option>)}
        </Select>
      </PageHeaderToolbar>
    </PageHeader>

    <MetricStrip>
      <MetricItem label="Orçamentos Ativos" value={totals.active} />
      <MetricItem label="Aguardando Retorno" value={totals.pending} tone="warning" />
      <MetricItem label="Aprovados" value={totals.approved} tone="success" />
      <MetricItem label="Valor Apresentado" value={formatCurrencyBRLFromCents(totals.value)} tone="info" />
    </MetricStrip>

    {quotes.length ? <Table density="compact" scrollHint>
      <TableHeader><TableRow>
        <TableHead>Número</TableHead><TableHead>Cliente e Título</TableHead><TableHead>Versão</TableHead>
        <TableHead>Validade</TableHead><TableHead>Situação</TableHead><TableHead data-align="right">Valor</TableHead><TableHead>Ações</TableHead>
      </TableRow></TableHeader>
      <TableBody>{quotes.map((quote) => <TableRow key={quote.id}>
        <TableCell className="font-medium"><Link className="hover:text-primary" href={`/dashboard/orcamentos/${quote.id}/editar`}>{quote.number}</Link></TableCell>
        <TableCell><strong className="block">{quote.clientName}</strong><span className="text-xs text-muted-foreground">{quote.title}</span></TableCell>
        <TableCell>Versão {quote.version}</TableCell>
        <TableCell>{formatDateBR(quote.validUntil)}</TableCell>
        <TableCell><Badge variant="secondary">{ptBrLabel(quote.status)}</Badge></TableCell>
        <TableNumericCell>{formatCurrencyBRLFromCents(quote.totalCents)}</TableNumericCell>
        <TableActionsCell><div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => duplicateQuoteAction(quote.id).then(refresh)}>Duplicar</Button>
          <Button size="sm" variant="ghost" onClick={() => newQuoteVersionAction(quote.id).then(refresh)}>Nova Versão</Button>
          {quote.status === "DRAFT" ? <Button size="sm" variant="secondary" onClick={() => transitionQuoteAction(quote.id, "REVIEW").then(refresh)}>Enviar para Revisão</Button> : null}
        </div></TableActionsCell>
      </TableRow>)}</TableBody>
    </Table> : <EmptyState title="Nenhum orçamento encontrado" description="Crie um rascunho ou ajuste os filtros para localizar propostas existentes." />}
  </div>;
}
