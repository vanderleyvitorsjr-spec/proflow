"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageHeader, PageHeaderActions, PageHeaderContent, PageHeaderHeading } from "@/components/ui/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableNumericCell, TableRow } from "@/components/ui/table";
import { formatCurrencyBRLFromCents, parseCurrencyBRToCents } from "@/lib/br-formatters";
import { listSuppliersAction } from "../fornecedores-actions";
import type { SupplierRecord } from "../fornecedores-types";
import { addQuotationResponseAction, addQuotationSupplierAction, createOrdersFromQuotationAction, getQuotationAction, selectQuotationResponseAction, updateQuotationAction } from "../compras-actions";
import { compareQuotation, type PurchaseQuotation, type PurchaseUnit } from "../compras-domain";
export function CotacaoEditor({ quotationId }: { quotationId: string }) {
  const router = useRouter();
  const [quotation, setQuotation] = useState<PurchaseQuotation>();
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [itemId, setItemId] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("5");
  const [message, setMessage] = useState("");
  const refresh = () => getQuotationAction(quotationId).then(setQuotation);
  useEffect(() => { void Promise.all([getQuotationAction(quotationId), listSuppliersAction()]).then(([value, supplierResult]) => { setQuotation(value); setSuppliers(supplierResult.ok ? supplierResult.data.filter((item) => item.status === "ACTIVE") : []); }); }, [quotationId]);
  const comparison = useMemo(() => compareQuotation(quotation?.responses ?? []), [quotation]);
  if (!quotation) return <div className="rounded-xl border bg-card p-6">Carregando Cotação...</div>;
  async function addItem() {
    if (!quotation) return;
    const item = { id: crypto.randomUUID(), description: "Novo Material", quantity: 1, unit: "UNIT" as PurchaseUnit };
    await updateQuotationAction(quotation.id, { items: [...quotation.items, item] }); await refresh();
  }
  async function invite() { if (!supplierId || !quotation) return; await addQuotationSupplierAction(quotation.id, supplierId); await refresh(); }
  async function respond() {
    if (!quotation) return;
    const supplier = suppliers.find((item) => item.id === supplierId), source = quotation.items.find((item) => item.id === itemId);
    if (!supplier || !source) return;
    const unitPriceCents = parseCurrencyBRToCents(unitPrice);
    await addQuotationResponseAction(quotation.id, { supplierId: supplier.id, supplierName: supplier.tradeName || supplier.legalName, itemId: source.id, unitPriceCents, totalCents: Math.round(unitPriceCents * source.quantity), freightCents: 0, deliveryDays: Number(deliveryDays), paymentTerms: "A Combinar" });
    setUnitPrice(""); await refresh();
  }
  async function select(responseId: string, lowest: boolean) {
    if (!quotation) return;
    const reason = lowest ? undefined : window.prompt("Justifique a escolha desta proposta:") ?? undefined;
    if (!lowest && !reason) return;
    await selectQuotationResponseAction(quotation.id, responseId, reason); await refresh();
  }
  async function generate() {
    if (!quotation) return;
    try { const orders = await createOrdersFromQuotationAction(quotation.id); if (orders[0]) router.push(`/dashboard/fornecedores/compras/pedidos/${orders[0].id}`); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : "Não foi possível gerar o Pedido."); }
  }
  return <div className="space-y-3"><PageHeader><PageHeaderContent><PageHeaderHeading title={quotation.number} description={quotation.title} /><PageHeaderActions><Button size="sm" variant="secondary" onClick={addItem}>Adicionar Item</Button><Button size="sm" onClick={generate}>Gerar Pedido</Button></PageHeaderActions></PageHeaderContent></PageHeader>{message ? <p role="alert" className="rounded-lg bg-amber-500/10 p-3 text-sm">{message}</p> : null}
    <section className="space-y-3 rounded-xl border bg-card p-4"><h2 className="font-semibold">Itens Solicitados</h2>{quotation.items.map((item) => <div key={item.id} className="grid gap-2 sm:grid-cols-[1fr_8rem_10rem]"><Input value={item.description} onChange={(event) => setQuotation({ ...quotation, items: quotation.items.map((entry) => entry.id === item.id ? { ...entry, description: event.target.value } : entry) })} onBlur={() => void updateQuotationAction(quotation.id, { items: quotation.items })} /><Input type="number" min="0" value={item.quantity} onChange={(event) => setQuotation({ ...quotation, items: quotation.items.map((entry) => entry.id === item.id ? { ...entry, quantity: Number(event.target.value) } : entry) })} /><Select value={item.unit} onChange={(event) => setQuotation({ ...quotation, items: quotation.items.map((entry) => entry.id === item.id ? { ...entry, unit: event.target.value as PurchaseUnit } : entry) })}><option value="UNIT">Unidade</option><option value="METER">Metro</option><option value="KILOGRAM">Quilograma</option><option value="LITER">Litro</option><option value="BOX">Caixa</option></Select></div>)}</section>
    <section className="space-y-3 rounded-xl border bg-card p-4"><h2 className="font-semibold">Fornecedores e Respostas</h2><div className="flex gap-2"><Select value={supplierId} onChange={(event) => setSupplierId(event.target.value)}><option value="">Selecione o Fornecedor</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.tradeName || supplier.legalName}</option>)}</Select><Button size="sm" variant="secondary" onClick={invite}>Convidar</Button></div><div className="grid gap-2 sm:grid-cols-4"><Select value={itemId} onChange={(event) => setItemId(event.target.value)}><option value="">Item Respondido</option>{quotation.items.map((item) => <option key={item.id} value={item.id}>{item.description}</option>)}</Select><Input value={unitPrice} onChange={(event) => setUnitPrice(event.target.value)} placeholder="Valor unitário" /><Input type="number" min="0" value={deliveryDays} onChange={(event) => setDeliveryDays(event.target.value)} placeholder="Prazo em dias" /><Button size="sm" onClick={respond}>Registrar Resposta</Button></div>
      {comparison.length ? <Table density="compact"><TableHeader><TableRow><TableHead>Fornecedor</TableHead><TableHead>Item</TableHead><TableHead data-align="right">Total</TableHead><TableHead>Prazo</TableHead><TableHead>Destaque</TableHead><TableHead>Ação</TableHead></TableRow></TableHeader><TableBody>{comparison.map((response) => <TableRow key={response.id}><TableCell>{response.supplierName}</TableCell><TableCell>{quotation.items.find((item) => item.id === response.itemId)?.description}</TableCell><TableNumericCell>{formatCurrencyBRLFromCents(response.totalCents + response.freightCents)}</TableNumericCell><TableCell>{response.deliveryDays} dias</TableCell><TableCell>{response.isLowestPrice ? "Melhor Preço" : response.isFastest ? "Melhor Prazo" : "Comparar Condições"}</TableCell><TableCell><Button size="sm" variant={response.markers.includes("SELECTED") ? "default" : "secondary"} onClick={() => void select(response.id, response.isLowestPrice)}>{response.markers.includes("SELECTED") ? "Selecionado" : "Selecionar"}</Button></TableCell></TableRow>)}</TableBody></Table> : null}
    </section>
  </div>;
}
