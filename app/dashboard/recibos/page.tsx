"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Plus, Printer, ReceiptText, Search, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageHeader, PageHeaderActions, PageHeaderContent, PageHeaderHeading, PageHeaderIdentity } from "@/components/ui/page-header";

type Receipt = {
  id: string;
  number: number;
  client: string;
  clientDocument: string;
  clientPhone: string;
  description: string;
  serviceOrder: string;
  serviceDate: string;
  amountCents: number;
  paymentMethod: string;
  paymentReference: string;
  installment: string;
  date: string;
  issuerName: string;
  issuerDocument: string;
  issuerCity: string;
  notes: string;
  createdAt: string;
};

const KEY = "proflow:receipts:v2";
const LEGACY_KEY = "proflow:receipts:v1";
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFmt = new Intl.DateTimeFormat("pt-BR");

const blankReceipt = (number: number): Receipt => ({
  id: crypto.randomUUID(),
  number,
  client: "",
  clientDocument: "",
  clientPhone: "",
  description: "",
  serviceOrder: "",
  serviceDate: "",
  amountCents: 0,
  paymentMethod: "PIX",
  paymentReference: "",
  installment: "",
  date: new Date().toISOString().slice(0, 10),
  issuerName: "ProFlow",
  issuerDocument: "",
  issuerCity: "Porto Seguro - BA",
  notes: "",
  createdAt: new Date().toISOString(),
});

function normalizeReceipt(value: Partial<Receipt> & { id: string; number: number }): Receipt {
  return {
    ...blankReceipt(value.number),
    ...value,
    id: value.id,
    number: value.number,
  };
}

export default function RecibosPage() {
  const [items, setItems] = useState<Receipt[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Receipt | null>(null);
  const [printing, setPrinting] = useState<Receipt | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Array<Partial<Receipt> & { id: string; number: number }>;
      const normalized = parsed.map(normalizeReceipt);
      setItems(normalized);
      localStorage.setItem(KEY, JSON.stringify(normalized));
    } catch {}
  }, []);

  useEffect(() => {
    if (!printing) return;
    const timer = window.setTimeout(() => window.print(), 80);
    const clear = () => setPrinting(null);
    window.addEventListener("afterprint", clear, { once: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", clear);
    };
  }, [printing]);

  const persist = (next: Receipt[]) => {
    setItems(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const filtered = useMemo(() => items.filter((item) => {
    const q = query.trim().toLowerCase();
    return !q || `${item.client} ${item.clientDocument} ${item.description} ${item.serviceOrder} ${item.number}`.toLowerCase().includes(q);
  }), [items, query]);

  const total = items.reduce((sum, item) => sum + item.amountCents, 0);
  const lastNumber = Math.max(0, ...items.map((item) => item.number));

  return <>
    <div className="space-y-4 pb-20 print:hidden lg:pb-0">
      <PageHeader><PageHeaderContent><PageHeaderIdentity><ReceiptText className="h-5 w-5"/><PageHeaderHeading title="Recibos" description="Emita comprovantes detalhados de serviços e recebimentos realizados pelo ProFlow."/></PageHeaderIdentity><PageHeaderActions><Button size="sm" onClick={() => setEditing(blankReceipt(lastNumber + 1))}><Plus className="h-4 w-4"/>Novo recibo</Button></PageHeaderActions></PageHeaderContent></PageHeader>

      <section className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Recibos emitidos</p><p className="mt-1 text-2xl font-bold">{items.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Valor registrado</p><p className="mt-1 text-2xl font-bold">{money.format(total / 100)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Último número</p><p className="mt-1 text-2xl font-bold">#{String(lastNumber).padStart(4, "0")}</p></CardContent></Card>
      </section>

      <div className="relative rounded-xl border bg-card p-3"><Search className="absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input className="pl-9" placeholder="Buscar por cliente, CPF/CNPJ, serviço, OS ou número..." value={query} onChange={(event) => setQuery(event.target.value)}/></div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => <Card key={item.id}><CardContent className="p-4">
          <div className="flex items-start justify-between gap-2"><div><p className="text-xs font-semibold text-sky-600">REC #{String(item.number).padStart(4, "0")}</p><h2 className="mt-1 font-semibold">{item.client}</h2><p className="text-xs text-muted-foreground">{dateFmt.format(new Date(`${item.date}T12:00:00`))}{item.serviceOrder ? ` · ${item.serviceOrder}` : ""}</p></div><Button variant="ghost" size="sm" onClick={() => setEditing(item)}>Editar</Button></div>
          <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{item.description}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-3 text-xs"><div><span className="text-muted-foreground">Pagamento</span><p className="font-semibold">{item.paymentMethod}</p></div><div><span className="text-muted-foreground">Valor</span><p className="font-semibold">{money.format(item.amountCents / 100)}</p></div>{item.paymentReference ? <div className="col-span-2"><span className="text-muted-foreground">Referência</span><p className="font-medium">{item.paymentReference}</p></div> : null}</div>
          <div className="mt-3 flex justify-end"><Button variant="secondary" size="sm" onClick={() => setPrinting(item)}><Printer className="h-4 w-4"/>Imprimir recibo</Button></div>
        </CardContent></Card>)}
      </div>

      {editing ? <ReceiptDrawer receipt={editing} onClose={() => setEditing(null)} onSave={(receipt) => { const exists = items.some((item) => item.id === receipt.id); persist(exists ? items.map((item) => item.id === receipt.id ? receipt : item) : [receipt, ...items]); setEditing(null); }} onPrint={(receipt) => setPrinting(receipt)}/> : null}
    </div>
    {printing ? <PrintableReceipt receipt={printing}/> : null}
  </>;
}

function ReceiptDrawer({ receipt, onClose, onSave, onPrint }: { receipt: Receipt; onClose: () => void; onSave: (receipt: Receipt) => void; onPrint: (receipt: Receipt) => void }) {
  const [draft, setDraft] = useState(receipt);
  return <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/55 print:hidden"><section className="h-full w-full max-w-2xl overflow-y-auto border-l bg-background shadow-2xl">
    <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/95 p-4"><div><h2 className="font-semibold">Recibo #{String(draft.number).padStart(4, "0")}</h2><p className="text-xs text-muted-foreground">Registre quem pagou, o que foi realizado e como o pagamento foi recebido.</p></div><Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4"/></Button></header>
    <div className="space-y-5 p-4 sm:p-6">
      <section className="space-y-3"><div className="flex items-center gap-2 border-b pb-2"><FileText className="h-4 w-4 text-sky-600"/><h3 className="text-sm font-semibold">Dados do cliente</h3></div><label className="block text-sm font-medium">Recebido de<Input className="mt-1" placeholder="Nome do cliente ou empresa" value={draft.client} onChange={(e) => setDraft({ ...draft, client: e.target.value })}/></label><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">CPF/CNPJ<Input className="mt-1" placeholder="CPF ou CNPJ" value={draft.clientDocument} onChange={(e) => setDraft({ ...draft, clientDocument: e.target.value })}/></label><label className="text-sm font-medium">Telefone / WhatsApp<Input className="mt-1" placeholder="(73) 9 0000-0000" value={draft.clientPhone} onChange={(e) => setDraft({ ...draft, clientPhone: e.target.value })}/></label></div></section>

      <section className="space-y-3"><div className="border-b pb-2"><h3 className="text-sm font-semibold">Serviço e referência</h3></div><label className="block text-sm font-medium">Referente a<textarea className="mt-1 min-h-28 w-full rounded-lg border bg-card p-3 text-sm" placeholder="Descreva de forma clara o serviço, material ou recebimento." value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })}/></label><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Ordem de Serviço / referência<Input className="mt-1" placeholder="Ex.: OS-0012" value={draft.serviceOrder} onChange={(e) => setDraft({ ...draft, serviceOrder: e.target.value })}/></label><label className="text-sm font-medium">Data de execução do serviço<Input className="mt-1" type="date" value={draft.serviceDate} onChange={(e) => setDraft({ ...draft, serviceDate: e.target.value })}/></label></div></section>

      <section className="space-y-3"><div className="border-b pb-2"><h3 className="text-sm font-semibold">Pagamento</h3></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><label className="text-sm font-medium">Valor recebido (R$)<Input className="mt-1" type="number" min="0" step="0.01" value={(draft.amountCents / 100).toFixed(2)} onChange={(e) => setDraft({ ...draft, amountCents: Math.round(Number(e.target.value || 0) * 100) })}/></label><label className="text-sm font-medium">Forma de pagamento<Select className="mt-1" value={draft.paymentMethod} onChange={(e) => setDraft({ ...draft, paymentMethod: e.target.value })}><option>PIX</option><option>Dinheiro</option><option>Cartão de crédito</option><option>Cartão de débito</option><option>Transferência bancária</option><option>Boleto</option><option>Outro</option></Select></label><label className="text-sm font-medium">Data do recebimento<Input className="mt-1" type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })}/></label></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Identificação do pagamento<Input className="mt-1" placeholder="Ex.: ID Pix, NSU, comprovante ou transação" value={draft.paymentReference} onChange={(e) => setDraft({ ...draft, paymentReference: e.target.value })}/></label><label className="text-sm font-medium">Parcela / condição<Input className="mt-1" placeholder="Ex.: À vista, 1/2, entrada, parcela final" value={draft.installment} onChange={(e) => setDraft({ ...draft, installment: e.target.value })}/></label></div></section>

      <section className="space-y-3"><div className="border-b pb-2"><h3 className="text-sm font-semibold">Emitente</h3></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Nome / empresa emitente<Input className="mt-1" value={draft.issuerName} onChange={(e) => setDraft({ ...draft, issuerName: e.target.value })}/></label><label className="text-sm font-medium">CPF/CNPJ do emitente<Input className="mt-1" value={draft.issuerDocument} onChange={(e) => setDraft({ ...draft, issuerDocument: e.target.value })}/></label></div><label className="block text-sm font-medium">Cidade / UF<Input className="mt-1" placeholder="Porto Seguro - BA" value={draft.issuerCity} onChange={(e) => setDraft({ ...draft, issuerCity: e.target.value })}/></label></section>

      <label className="block text-sm font-medium">Observações adicionais<textarea className="mt-1 min-h-24 w-full rounded-lg border bg-card p-3 text-sm" placeholder="Garantia, ressalvas ou outras informações que devam constar no recibo." value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })}/></label>
    </div>
    <footer className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t bg-background/95 p-4"><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button variant="outline" disabled={!draft.client.trim() || !draft.description.trim() || draft.amountCents <= 0} onClick={() => onPrint(draft)}><Printer className="h-4 w-4"/>Visualizar / imprimir</Button><Button disabled={!draft.client.trim() || !draft.description.trim() || draft.amountCents <= 0} onClick={() => onSave(draft)}><Save className="h-4 w-4"/>Salvar recibo</Button></footer>
  </section></div>;
}

function PrintableReceipt({ receipt }: { receipt: Receipt }) {
  return <div className="hidden print:block print:bg-white print:text-black">
    <article className="mx-auto max-w-[780px] p-10 font-sans">
      <header className="flex items-start justify-between border-b-2 border-black pb-5"><div><h1 className="text-2xl font-bold">RECIBO</h1><p className="mt-1 text-sm">Comprovante de recebimento de serviço</p></div><div className="text-right"><p className="text-sm font-bold">Nº {String(receipt.number).padStart(4, "0")}</p><p className="text-xs">Emitido em {formatDate(receipt.date)}</p></div></header>
      <section className="mt-7 space-y-4 text-sm leading-6"><p>Recebi de <strong>{receipt.client}</strong>{receipt.clientDocument ? `, CPF/CNPJ ${receipt.clientDocument}` : ""}, a importância de <strong>{money.format(receipt.amountCents / 100)}</strong>, referente ao serviço descrito abaixo.</p><div className="rounded border border-black p-4"><p className="text-xs font-bold uppercase">Serviço / referência</p><p className="mt-2 whitespace-pre-line">{receipt.description}</p>{receipt.serviceOrder ? <p className="mt-3"><strong>Ordem de Serviço:</strong> {receipt.serviceOrder}</p> : null}{receipt.serviceDate ? <p><strong>Data do serviço:</strong> {formatDate(receipt.serviceDate)}</p> : null}</div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2"><p><strong>Forma de pagamento:</strong> {receipt.paymentMethod}</p><p><strong>Data do recebimento:</strong> {formatDate(receipt.date)}</p>{receipt.installment ? <p><strong>Condição/parcela:</strong> {receipt.installment}</p> : null}{receipt.paymentReference ? <p><strong>Identificação:</strong> {receipt.paymentReference}</p> : null}{receipt.clientPhone ? <p><strong>Contato do cliente:</strong> {receipt.clientPhone}</p> : null}</div>{receipt.notes ? <div className="border-t pt-4"><p className="text-xs font-bold uppercase">Observações</p><p className="mt-1 whitespace-pre-line">{receipt.notes}</p></div> : null}
      </section>
      <footer className="mt-16"><p>{receipt.issuerCity || ""}{receipt.issuerCity ? ", " : ""}{formatDateLong(receipt.date)}.</p><div className="mt-16 grid grid-cols-2 gap-12"><div className="border-t border-black pt-2 text-center"><p className="font-semibold">{receipt.issuerName || "Emitente"}</p>{receipt.issuerDocument ? <p className="text-xs">CPF/CNPJ: {receipt.issuerDocument}</p> : null}</div><div className="border-t border-black pt-2 text-center"><p className="font-semibold">{receipt.client}</p><p className="text-xs">Cliente / responsável</p></div></div></footer>
    </article>
  </div>;
}

function formatDate(value: string) {
  if (!value) return "Não informada";
  return dateFmt.format(new Date(`${value}T12:00:00`));
}

function formatDateLong(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}
