"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader, PageHeaderActions, PageHeaderContent, PageHeaderHeading } from "@/components/ui/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableNumericCell, TableRow } from "@/components/ui/table";
import { formatCurrencyBRLFromCents, formatDateBR } from "@/lib/br-formatters";
import { ptBrLabel } from "@/lib/pt-br-labels";
import { listPurchasesAction } from "../compras-actions";
import type { PurchasesEnvelope } from "../compras-domain";
export function ComprasListagem({ mode }: { mode: "quotations" | "orders" | "receipts" }) {
  const [state, setState] = useState<PurchasesEnvelope>();
  const [search, setSearch] = useState("");
  useEffect(() => { void listPurchasesAction().then(setState); }, []);
  const term = search.toLocaleLowerCase("pt-BR");
  const quotations = useMemo(() => (state?.quotations ?? []).filter((item) => `${item.number} ${item.title}`.toLocaleLowerCase("pt-BR").includes(term)), [state, term]);
  const orders = useMemo(() => (state?.orders ?? []).filter((item) => `${item.number} ${item.supplierName}`.toLocaleLowerCase("pt-BR").includes(term)), [state, term]);
  const title = mode === "quotations" ? "Cotações" : mode === "orders" ? "Pedidos de Compra" : "Recebimentos";
  return <div className="space-y-3"><PageHeader><PageHeaderContent><PageHeaderHeading title={title} description="Acompanhe o fluxo de compras com registros locais e confirmações explícitas." /><PageHeaderActions><Button asChild size="sm" variant="secondary"><Link href="/dashboard/fornecedores/compras">Painel de Compras</Link></Button></PageHeaderActions></PageHeaderContent></PageHeader><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar por número, título ou fornecedor" aria-label={`Pesquisar ${title}`} />
    {mode === "quotations" ? quotations.length ? <Table density="compact"><TableHeader><TableRow><TableHead>Número</TableHead><TableHead>Título</TableHead><TableHead>Abertura</TableHead><TableHead>Respostas</TableHead><TableHead>Situação</TableHead></TableRow></TableHeader><TableBody>{quotations.map((item) => <TableRow key={item.id}><TableCell><Link className="font-medium hover:text-primary" href={`/dashboard/fornecedores/compras/cotacoes/${item.id}`}>{item.number}</Link></TableCell><TableCell>{item.title}</TableCell><TableCell>{formatDateBR(item.openedAt)}</TableCell><TableCell>{item.responses.length}</TableCell><TableCell>{ptBrLabel(item.status)}</TableCell></TableRow>)}</TableBody></Table> : <EmptyState title="Nenhuma Cotação" description="Crie uma Cotação no Painel de Compras." />
    : mode === "orders" ? orders.length ? <Table density="compact"><TableHeader><TableRow><TableHead>Número</TableHead><TableHead>Fornecedor</TableHead><TableHead>Data</TableHead><TableHead>Situação</TableHead><TableHead data-align="right">Total</TableHead></TableRow></TableHeader><TableBody>{orders.map((item) => <TableRow key={item.id}><TableCell><Link className="font-medium hover:text-primary" href={`/dashboard/fornecedores/compras/pedidos/${item.id}`}>{item.number}</Link></TableCell><TableCell>{item.supplierName}</TableCell><TableCell>{formatDateBR(item.date)}</TableCell><TableCell>{ptBrLabel(item.status)}</TableCell><TableNumericCell>{formatCurrencyBRLFromCents(item.totalCents)}</TableNumericCell></TableRow>)}</TableBody></Table> : <EmptyState title="Nenhum Pedido" description="Pedidos são gerados a partir das propostas selecionadas." />
    : orders.flatMap((order) => order.receipts.map((receipt) => ({ order, receipt }))).length ? <Table density="compact"><TableHeader><TableRow><TableHead>Pedido</TableHead><TableHead>Data</TableHead><TableHead>Responsável</TableHead><TableHead>Condição</TableHead><TableHead>Estoque</TableHead></TableRow></TableHeader><TableBody>{orders.flatMap((order) => order.receipts.map((receipt) => <TableRow key={receipt.id}><TableCell>{order.number}</TableCell><TableCell>{formatDateBR(receipt.receivedAt)}</TableCell><TableCell>{receipt.responsible}</TableCell><TableCell>{ptBrLabel(receipt.condition)}</TableCell><TableCell>{receipt.stockMovementConfirmed ? "Entrada Preparada" : "Sem Movimentação"}</TableCell></TableRow>))}</TableBody></Table> : <EmptyState title="Nenhum Recebimento" description="Registre recebimentos dentro de um Pedido de Compra." />}
  </div>;
}
