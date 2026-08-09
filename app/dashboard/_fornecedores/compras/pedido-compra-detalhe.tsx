"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageHeader, PageHeaderActions, PageHeaderContent, PageHeaderHeading } from "@/components/ui/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableNumericCell, TableRow } from "@/components/ui/table";
import { formatCurrencyBRLFromCents, formatDateBR } from "@/lib/br-formatters";
import { ptBrLabel } from "@/lib/pt-br-labels";
import { getPurchaseOrderAction, markPurchaseOrderSentAction, receivePurchaseOrderAction } from "../compras-actions";
import type { PurchaseOrder } from "../compras-domain";
export function PedidoCompraDetalhe({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<PurchaseOrder>();
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [refused, setRefused] = useState("0");
  const [condition, setCondition] = useState<"ACCEPTED" | "DIVERGENT" | "REFUSED">("ACCEPTED");
  const [responsible, setResponsible] = useState("");
  const [divergence, setDivergence] = useState("");
  const [prepareStock, setPrepareStock] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    void getPurchaseOrderAction(orderId).then(setOrder);
  }, [orderId]);
  if (!order) return <div className="rounded-xl border bg-card p-6">Carregando Pedido...</div>;
  async function receive() {
    if (!order) return;
    if (!itemId || !responsible.trim()) { setMessage("Selecione o item e informe o responsável."); return; }
    if (prepareStock && !window.confirm("Deseja preparar a entrada destes materiais no Estoque? Nenhum saldo será alterado agora.")) return;
    try {
      const result = await receivePurchaseOrderAction(order.id, { itemId, receivedQuantity: Number(quantity), refusedQuantity: Number(refused), condition, divergence, responsible, idempotencyKey: `${order.id}:${itemId}:${Date.now()}` }, prepareStock);
      setOrder(result.order); setMessage(result.stockMovementPrepared ? "Recebimento registrado e entrada de Estoque preparada." : "Recebimento registrado sem movimentar Estoque.");
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Não foi possível registrar o recebimento."); }
  }
  return <div className="space-y-3"><PageHeader><PageHeaderContent><PageHeaderHeading title={order.number} description={`${order.supplierName} · ${ptBrLabel(order.status)}`} /><PageHeaderActions>{!order.sentManuallyAt ? <Button size="sm" variant="secondary" onClick={() => markPurchaseOrderSentAction(order.id).then(setOrder)}>Marcar como Enviado</Button> : null}</PageHeaderActions></PageHeaderContent></PageHeader>
    <section className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-4"><div><p className="text-xs text-muted-foreground">Data</p><strong>{formatDateBR(order.date)}</strong></div><div><p className="text-xs text-muted-foreground">Subtotal</p><strong>{formatCurrencyBRLFromCents(order.subtotalCents)}</strong></div><div><p className="text-xs text-muted-foreground">Frete</p><strong>{formatCurrencyBRLFromCents(order.freightCents)}</strong></div><div><p className="text-xs text-muted-foreground">Total</p><strong>{formatCurrencyBRLFromCents(order.totalCents)}</strong></div></section>
    <Table density="compact"><TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Pedido</TableHead><TableHead>Recebido</TableHead><TableHead>Recusado</TableHead><TableHead data-align="right">Total</TableHead></TableRow></TableHeader><TableBody>{order.items.map((item) => <TableRow key={item.id}><TableCell>{item.description}</TableCell><TableCell>{item.orderedQuantity}</TableCell><TableCell>{item.receivedQuantity}</TableCell><TableCell>{item.refusedQuantity}</TableCell><TableNumericCell>{formatCurrencyBRLFromCents(item.totalCents)}</TableNumericCell></TableRow>)}</TableBody></Table>
    <section className="space-y-3 rounded-xl border bg-card p-4"><h2 className="font-semibold">Registrar Recebimento</h2><div className="grid gap-3 sm:grid-cols-3"><label className="text-xs font-medium">Item<Select value={itemId} onChange={(event) => setItemId(event.target.value)}><option value="">Selecione</option>{order.items.map((item) => <option key={item.id} value={item.id}>{item.description}</option>)}</Select></label><label className="text-xs font-medium">Quantidade Recebida<Input type="number" min="0" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label><label className="text-xs font-medium">Quantidade Recusada<Input type="number" min="0" value={refused} onChange={(event) => setRefused(event.target.value)} /></label><label className="text-xs font-medium">Condição<Select value={condition} onChange={(event) => setCondition(event.target.value as typeof condition)}><option value="ACCEPTED">Aceito</option><option value="DIVERGENT">Com Divergência</option><option value="REFUSED">Recusado</option></Select></label><label className="text-xs font-medium">Responsável<Input value={responsible} onChange={(event) => setResponsible(event.target.value)} placeholder="Nome do responsável" /></label><label className="text-xs font-medium">Divergência<Input value={divergence} onChange={(event) => setDivergence(event.target.value)} placeholder="Descreva quando necessário" /></label></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={prepareStock} onChange={(event) => setPrepareStock(event.target.checked)} />Preparar entrada no Estoque após confirmação</label>{message ? <p role="status" className="text-sm">{message}</p> : null}<Button size="sm" onClick={() => void receive()}>Confirmar Recebimento</Button></section>
  </div>;
}
