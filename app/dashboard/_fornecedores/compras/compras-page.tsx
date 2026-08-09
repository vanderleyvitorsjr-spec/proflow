"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { MetricItem, MetricStrip } from "@/components/ui/metric-strip";
import { PageHeader, PageHeaderActions, PageHeaderContent, PageHeaderHeading, PageHeaderIcon, PageHeaderIdentity } from "@/components/ui/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateBR, normalizeProperNameInput } from "@/lib/br-formatters";
import { ptBrLabel } from "@/lib/pt-br-labels";
import { createQuotationAction, listPurchasesAction } from "../compras-actions";
import type { PurchaseQuotation, PurchasesEnvelope } from "../compras-domain";

export function ComprasPage() {
  const [state, setState] = useState<PurchasesEnvelope>();
  const [title, setTitle] = useState("");
  const refresh = () => listPurchasesAction().then(setState);
  useEffect(() => { void refresh(); }, []);
  const summary = useMemo(() => ({
    open: (state?.quotations ?? []).filter((item) => !["CANCELED", "CLOSED"].includes(item.status)).length,
    orders: state?.orders.length ?? 0,
    pending: state?.orders.filter((item) => ["WAITING_APPROVAL", "APPROVED", "SENT", "PARTIALLY_RECEIVED"].includes(item.status)).length ?? 0,
  }), [state]);
  const quotations = state?.quotations ?? [];
  async function create() {
    await createQuotationAction({ title }); setTitle(""); await refresh();
  }
  return <div className="space-y-3">
    <PageHeader><PageHeaderContent><PageHeaderIdentity><PageHeaderIcon><ShoppingCart className="size-4" /></PageHeaderIcon><PageHeaderHeading title="Cotações e Compras" description="Compare fornecedores e acompanhe pedidos sem movimentar o Estoque automaticamente." /></PageHeaderIdentity><PageHeaderActions><Button asChild size="sm" variant="secondary"><Link href="/dashboard/fornecedores">Fornecedores</Link></Button></PageHeaderActions></PageHeaderContent></PageHeader>
    <section className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row"><Input value={title} onChange={(event) => setTitle(normalizeProperNameInput(event.target.value))} placeholder="Ex.: Materiais para Instalação" aria-label="Título da nova cotação" /><Button onClick={() => void create()} disabled={!title.trim()}>Criar Cotação</Button></section>
    <MetricStrip><MetricItem label="Cotações Ativas" value={summary.open} /><MetricItem label="Pedidos" value={summary.orders} /><MetricItem label="Aguardando Recebimento" value={summary.pending} tone="warning" /></MetricStrip>
    {quotations.length ? <Table density="compact"><TableHeader><TableRow><TableHead>Número</TableHead><TableHead>Título</TableHead><TableHead>Abertura</TableHead><TableHead>Fornecedores</TableHead><TableHead>Situação</TableHead></TableRow></TableHeader><TableBody>{quotations.map((quotation: PurchaseQuotation) => <TableRow key={quotation.id}><TableCell className="font-medium">{quotation.number}</TableCell><TableCell>{quotation.title}</TableCell><TableCell>{formatDateBR(quotation.openedAt)}</TableCell><TableCell>{quotation.invitedSupplierIds.length}</TableCell><TableCell>{ptBrLabel(quotation.status)}</TableCell></TableRow>)}</TableBody></Table> : <EmptyState title="Nenhuma cotação" description="Crie uma cotação para comparar preços, prazos e condições de fornecedores." />}
  </div>;
}
