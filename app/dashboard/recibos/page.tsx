"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ReceiptText, Search } from "lucide-react";
import { listReceiptSourcesAction, type ReceiptSource } from "../financeiro/financeiro-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader, PageHeaderContent, PageHeaderHeading, PageHeaderIdentity } from "@/components/ui/page-header";
import { formatCurrencyBRLFromCents, formatDateBR } from "@/lib/br-formatters";

export default function RecibosPage() {
  const [items, setItems] = useState<ReceiptSource[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { void listReceiptSourcesAction().then((result) => result.ok ? setItems(result.data) : setError(result.error.message)); }, []);
  const filtered = useMemo(() => items.filter((item) => {
    const search = query.trim().toLocaleLowerCase("pt-BR");
    return !search || [item.number, item.customerName, item.description, item.serviceOrderNumber].join(" ").toLocaleLowerCase("pt-BR").includes(search);
  }), [items, query]);
  const total = items.filter((item) => !item.canceled).reduce((sum, item) => sum + item.amountCents, 0);
  return <div className="space-y-4">
    <PageHeader><PageHeaderContent><PageHeaderIdentity><ReceiptText className="h-5 w-5"/><PageHeaderHeading title="Recibos" description="Comprovantes gerados exclusivamente a partir de recebimentos financeiros registrados."/></PageHeaderIdentity></PageHeaderContent></PageHeader>
    <section className="grid gap-3 sm:grid-cols-2"><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Recebimentos com comprovante</p><p className="mt-1 text-2xl font-bold">{items.length}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total recebido ativo</p><p className="mt-1 text-2xl font-bold">{formatCurrencyBRLFromCents(total)}</p></CardContent></Card></section>
    <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por número, cliente, serviço ou Ordem..."/></div>
    {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <Card key={`${item.transactionId}:${item.paymentId ?? "realized"}`}><CardContent className="space-y-3 p-4"><div className="flex justify-between gap-3"><div><p className="text-xs font-semibold text-primary">{item.number}</p><h2 className="font-semibold">{item.customerName}</h2><p className="text-xs text-muted-foreground">{formatDateBR(item.paidAt)}</p></div><p className="font-bold">{formatCurrencyBRLFromCents(item.amountCents)}</p></div><p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>{item.canceled ? <p className="text-xs font-semibold text-red-600">Recebimento estornado ou cancelado</p> : null}<Button asChild size="sm" variant="secondary"><Link href={`/dashboard/financeiro/${item.transactionId}/comprovante${item.paymentId ? `?payment=${item.paymentId}` : ""}`}>Visualizar comprovante</Link></Button></CardContent></Card>)}</div>
    {!error && !filtered.length ? <p className="rounded-xl border p-8 text-center text-sm text-muted-foreground">Nenhum recebimento financeiro encontrado.</p> : null}
  </div>;
}
