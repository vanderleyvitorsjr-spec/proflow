"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Copy, Eye, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageHeader, PageHeaderActions, PageHeaderContent, PageHeaderHeading, PageHeaderIdentity } from "@/components/ui/page-header";
import { Table, TableActionsCell, TableBody, TableCell, TableHead, TableHeader, TableNumericCell, TableRow } from "@/components/ui/table";
import { formatCurrencyBRLFromCents, formatDateBR, formatPercentageFromBasisPoints, parseCurrencyBRToCents } from "@/lib/br-formatters";
import { ptBrLabel } from "@/lib/pt-br-labels";
import { listClientsAction } from "@/app/dashboard/clientes/actions";
import { listCatalogServicesAction } from "@/app/dashboard/precificacao/catalogo-servicos-actions";
import type { CatalogService } from "@/app/dashboard/precificacao/catalogo-servicos-domain";
import { serviceSnapshot } from "@/app/dashboard/precificacao/catalogo-servicos-domain";
import {
  createQuoteAction, duplicateQuoteItemAction, getQuoteAction, removeQuoteItemAction,
  reorderQuoteItemAction, updateQuoteAction,
} from "./orcamentos-actions";
import {
  calculateQuote, calculateQuoteItem, quoteFinancialSummary, quotePaymentSchedule,
  type ProfessionalQuote, type QuoteItem, type QuoteItemCategory, type QuoteUnit,
} from "./orcamentos-domain";

type ClientOption = Awaited<ReturnType<typeof listClientsAction>>[number];
const today = () => new Date().toISOString().slice(0, 10);
const newQuoteDraft = (): ProfessionalQuote => ({
  id: "", number: "Novo Orçamento", version: 1, clientId: "", clientName: "", title: "",
  status: "DRAFT", origin: "MANUAL", items: [], subtotalCents: 0, discountCents: 0,
  surchargeCents: 0, taxCents: 0, totalCents: 0,
  paymentTerms: { type: "CASH", dueDates: [], method: "PIX" },
  createdAt: "", updatedAt: "", history: [],
});

export function OrcamentoEditor({ quoteId }: { quoteId?: string }) {
  const router = useRouter();
  const [quote, setQuote] = useState<ProfessionalQuote | undefined>(() => quoteId ? undefined : newQuoteDraft());
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [services, setServices] = useState<CatalogService[]>([]);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const [selectedService, setSelectedService] = useState("");

  useEffect(() => {
    void Promise.all([listClientsAction(), listCatalogServicesAction(), quoteId ? getQuoteAction(quoteId) : Promise.resolve(undefined)])
      .then(([clientList, serviceList, current]) => { setClients(clientList.filter((item) => !item.deletedAt)); setServices(serviceList.filter((item) => item.active)); setQuote(current); });
  }, [quoteId]);

  const financial = useMemo(() => quote ? quoteFinancialSummary(quote) : undefined, [quote]);
  const schedule = useMemo(() => {
    if (!quote) return [];
    try { return quotePaymentSchedule(quote.totalCents, quote.paymentTerms); } catch { return []; }
  }, [quote]);

  function change(changes: Partial<ProfessionalQuote>) {
    setQuote((current) => {
      if (!current) return current;
      const next = { ...current, ...changes };
      return changes.items
        ? { ...next, ...calculateQuote(changes.items, next.discountCents, next.surchargeCents, next.taxCents) }
        : next;
    });
    setDirty(true);
  }
  function updateItem(id: string, changes: Partial<QuoteItem>) {
    if (!quote) return;
    const items = quote.items.map((item) => item.id === id ? calculateQuoteItem({
      ...item, ...changes, totalCents: undefined,
    } as Omit<QuoteItem, "totalCents">, true) : item);
    change({ items });
  }
  function addFreeItem(category: QuoteItemCategory = "FREE") {
    if (!quote) return;
    const item = calculateQuoteItem({
      id: crypto.randomUUID(), description: category === "MATERIAL" ? "Novo Material" : "Novo Item",
      category, quantity: 1, unit: category === "SERVICE" ? "SERVICE" : "UNIT",
      unitPriceCents: 0, estimatedCostCents: 0, marginBasisPoints: 0, discountCents: 0,
      order: quote.items.length,
    });
    change({ items: [...quote.items, item] });
  }
  function addCatalogService() {
    if (!quote) return;
    const service = services.find((item) => item.id === selectedService); if (!service) return;
    const snapshot = serviceSnapshot(service);
    const item = calculateQuoteItem({
      id: crypto.randomUUID(), sourceId: service.id,
      sourceSnapshot: { code: service.code, name: service.name, capturedAt: snapshot.capturedAt },
      description: service.name, category: "SERVICE", quantity: 1, unit: "SERVICE",
      unitPriceCents: service.basePriceCents, estimatedCostCents: service.estimatedCostCents,
      marginBasisPoints: service.desiredMarginBasisPoints, discountCents: 0, order: quote.items.length,
    });
    change({ items: [...quote.items, item] }); setSelectedService("");
  }
  async function save() {
    if (!quote) return;
    const saved = await updateQuoteAction(quote.id, quote); setQuote(saved); setDirty(false);
    setMessage("Rascunho salvo."); window.setTimeout(() => setMessage(""), 2500);
  }
  async function createDraft() {
    const client = clients.find((item) => item.id === quote?.clientId);
    if (!client || !quote?.title.trim()) { setMessage("Selecione o cliente e informe o título."); return; }
    const created = await createQuoteAction({
      clientId: client.id, clientName: client.name, clientDocument: client.document,
      clientPhone: client.phone, title: quote.title, description: quote.description,
      city: client.city, state: client.state, issuedAt: today(), items: quote.items,
      paymentTerms: quote.paymentTerms,
    });
    router.push(`/dashboard/orcamentos/${created.id}/editar`);
  }

  if (!quote && quoteId) return <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Carregando Orçamento...</div>;
  const draft = quote ?? newQuoteDraft();

  return <div className="space-y-3">
    <PageHeader><PageHeaderContent><PageHeaderIdentity><PageHeaderHeading title={draft.number} description={`Versão ${draft.version} · ${ptBrLabel(draft.status)} · ${dirty ? "Alterações Não Salvas" : quoteId ? "Rascunho Salvo" : "Novo Rascunho"}`} /></PageHeaderIdentity><PageHeaderActions>
      {quoteId ? <Button asChild size="sm" variant="secondary"><Link href={`/dashboard/orcamentos/${quoteId}/visualizar`}><Eye className="size-4" />Visualizar</Link></Button> : null}
      <Button size="sm" onClick={() => void (quoteId ? save() : createDraft())}><Save className="size-4" />{quoteId ? "Salvar" : "Criar Rascunho"}</Button>
    </PageHeaderActions></PageHeaderContent></PageHeader>
    {message ? <p role="status" className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">{message}</p> : null}
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <main className="space-y-3">
        <section className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2">
          <h2 className="col-span-full text-sm font-semibold">Dados Gerais e Cliente</h2>
          <label className="text-xs font-medium">Cliente<Select value={draft.clientId} onChange={(event) => { const client = clients.find((item) => item.id === event.target.value); change({ clientId: event.target.value, clientName: client?.name ?? "", clientDocument: client?.document, clientPhone: client?.phone, city: client?.city, state: client?.state }); }}><option value="">Selecione o Cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name} · {client.city}/{client.state}</option>)}</Select></label>
          <label className="text-xs font-medium">Responsável<Input value={draft.responsible ?? ""} onChange={(event) => change({ responsible: event.target.value })} placeholder="Ex.: Técnico Responsável" /></label>
          <label className="text-xs font-medium md:col-span-2">Título<Input value={draft.title} onChange={(event) => change({ title: event.target.value })} placeholder="Ex.: Instalação de Ar-Condicionado Split" /></label>
          <label className="text-xs font-medium md:col-span-2">Descrição<textarea className="mt-1 min-h-24 w-full rounded-lg border bg-card p-3 text-sm" value={draft.description ?? ""} onChange={(event) => change({ description: event.target.value })} /></label>
          <label className="text-xs font-medium">Data de Emissão<Input type="date" value={draft.issuedAt?.slice(0, 10) ?? ""} onChange={(event) => change({ issuedAt: event.target.value })} /></label>
          <label className="text-xs font-medium">Válido Até<Input type="date" value={draft.validUntil?.slice(0, 10) ?? ""} onChange={(event) => change({ validUntil: event.target.value })} /></label>
          <label className="text-xs font-medium">Tipo de Serviço<Select value={draft.serviceType ?? ""} onChange={(event) => change({ serviceType: event.target.value as ProfessionalQuote["serviceType"] })}><option value="">Selecione</option>{["CLIMATIZATION","ELECTRICAL","PREVENTIVE","CORRECTIVE","INSTALLATION"].map((value) => <option key={value} value={value}>{ptBrLabel(value)}</option>)}</Select></label>
          <label className="text-xs font-medium">Prazo de Execução<Input value={draft.executionDeadline ?? ""} onChange={(event) => change({ executionDeadline: event.target.value })} placeholder="Ex.: 5 dias úteis" /></label>
          <label className="text-xs font-medium md:col-span-2">Endereço do Atendimento<Input value={draft.address ?? ""} onChange={(event) => change({ address: event.target.value })} placeholder="Ex.: Rua Exemplo, 100, Centro" /></label>
          <label className="text-xs font-medium">Garantia<Input value={draft.warranty ?? ""} onChange={(event) => change({ warranty: event.target.value })} placeholder="Ex.: 90 dias para o serviço" /></label>
          <label className="text-xs font-medium">Equipamento<Input value={draft.equipmentDescription ?? ""} onChange={(event) => change({ equipmentDescription: event.target.value })} placeholder="Ex.: Split 18.000 BTUs" /></label>
        </section>
        <section className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold">Itens do Orçamento</h2><div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => addFreeItem("MATERIAL")}><Plus className="size-3" />Material</Button><Button size="sm" variant="secondary" onClick={() => addFreeItem()}><Plus className="size-3" />Item Livre</Button></div></div>
          <div className="flex gap-2"><Select value={selectedService} onChange={(event) => setSelectedService(event.target.value)}><option value="">Serviço do Catálogo</option>{services.map((service) => <option key={service.id} value={service.id}>{service.code} · {service.name} · {formatCurrencyBRLFromCents(service.basePriceCents)}</option>)}</Select><Button size="sm" onClick={addCatalogService} disabled={!selectedService}>Adicionar Serviço</Button></div>
          <Table density="compact" scrollHint><TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead>Tipo</TableHead><TableHead>Quantidade</TableHead><TableHead>Unidade</TableHead><TableHead>Valor Unitário</TableHead><TableHead>Desconto</TableHead><TableHead data-align="right">Total</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader><TableBody>{draft.items.map((item) => <TableRow key={item.id}>
            <TableCell><Input className="min-w-48" value={item.description} onChange={(event) => updateItem(item.id, { description: event.target.value })} /></TableCell>
            <TableCell><Select value={item.category} onChange={(event) => updateItem(item.id, { category: event.target.value as QuoteItemCategory })}>{["SERVICE","MATERIAL","LABOR","TRAVEL","FEE","EXPENSE","DISCOUNT","FREE"].map((value) => <option key={value} value={value}>{ptBrLabel(value)}</option>)}</Select></TableCell>
            <TableCell><Input className="w-24" type="number" min="0" step="0.01" value={item.quantity} onChange={(event) => updateItem(item.id, { quantity: Number(event.target.value) })} /></TableCell>
            <TableCell><Select value={item.unit} onChange={(event) => updateItem(item.id, { unit: event.target.value as QuoteUnit })}>{["UNIT","HOUR","DAY","METER","SQUARE_METER","KILOGRAM","LITER","BOX","ROLL","SET","SERVICE","OTHER"].map((value) => <option key={value} value={value}>{ptBrLabel(value)}</option>)}</Select></TableCell>
            <TableCell><Input className="w-32" defaultValue={(item.unitPriceCents / 100).toFixed(2).replace(".", ",")} onBlur={(event) => updateItem(item.id, { unitPriceCents: parseCurrencyBRToCents(event.target.value) })} /></TableCell>
            <TableCell><Input className="w-28" defaultValue={(item.discountCents / 100).toFixed(2).replace(".", ",")} onBlur={(event) => updateItem(item.id, { discountCents: parseCurrencyBRToCents(event.target.value) })} /></TableCell>
            <TableNumericCell>{formatCurrencyBRLFromCents(item.totalCents)}</TableNumericCell>
            <TableActionsCell><div className="flex"><Button variant="ghost" size="icon" aria-label="Mover item para cima" onClick={() => quoteId ? reorderQuoteItemAction(quoteId, item.id, -1).then(setQuote) : undefined}><ArrowUp className="size-3" /></Button><Button variant="ghost" size="icon" aria-label="Mover item para baixo" onClick={() => quoteId ? reorderQuoteItemAction(quoteId, item.id, 1).then(setQuote) : undefined}><ArrowDown className="size-3" /></Button><Button variant="ghost" size="icon" aria-label="Duplicar item" onClick={() => quoteId ? duplicateQuoteItemAction(quoteId, item.id).then(setQuote) : change({ items: [...draft.items, { ...item, id: crypto.randomUUID(), order: draft.items.length }] })}><Copy className="size-3" /></Button><Button variant="ghost" size="icon" aria-label="Excluir item" onClick={() => quoteId ? removeQuoteItemAction(quoteId, item.id).then(setQuote) : change({ items: draft.items.filter((entry) => entry.id !== item.id) })}><Trash2 className="size-3" /></Button></div></TableActionsCell>
          </TableRow>)}</TableBody></Table>
        </section>
        <section className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2">
          <h2 className="col-span-full text-sm font-semibold">Condições de Pagamento</h2>
          <label className="text-xs font-medium">Condição<Select value={draft.paymentTerms.type} onChange={(event) => change({ paymentTerms: { ...draft.paymentTerms, type: event.target.value as ProfessionalQuote["paymentTerms"]["type"] } })}>{["CASH","ENTRY_BALANCE","INSTALLMENTS","MILESTONES","CUSTOM"].map((value) => <option key={value} value={value}>{ptBrLabel(value)}</option>)}</Select></label>
          <label className="text-xs font-medium">Forma<Select value={draft.paymentTerms.method} onChange={(event) => change({ paymentTerms: { ...draft.paymentTerms, method: event.target.value as ProfessionalQuote["paymentTerms"]["method"] } })}>{["PIX","CASH","CREDIT_CARD","DEBIT_CARD","BOLETO","BANK_TRANSFER","OTHER"].map((value) => <option key={value} value={value}>{ptBrLabel(value)}</option>)}</Select></label>
          {draft.paymentTerms.type === "INSTALLMENTS" ? <><label className="text-xs font-medium">Quantidade de Parcelas<Input type="number" min="1" value={draft.paymentTerms.installmentCount ?? 1} onChange={(event) => change({ paymentTerms: { ...draft.paymentTerms, installmentCount: Number(event.target.value) } })} /></label><label className="text-xs font-medium">Primeiro Vencimento<Input type="date" value={draft.paymentTerms.firstDueDate ?? ""} onChange={(event) => change({ paymentTerms: { ...draft.paymentTerms, firstDueDate: event.target.value } })} /></label></> : null}
          <div className="col-span-full grid gap-2 sm:grid-cols-3">{schedule.map((entry) => <div key={entry.label} className="rounded-lg bg-muted p-2 text-xs"><strong className="block">{entry.label}</strong>{formatCurrencyBRLFromCents(entry.amountCents)}{entry.dueDate ? ` · ${formatDateBR(entry.dueDate)}` : ""}</div>)}</div>
        </section>
        <section className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2"><label className="text-xs font-medium">Observações Internas<textarea className="mt-1 min-h-24 w-full rounded-lg border bg-card p-3 text-sm" value={draft.internalNotes ?? ""} onChange={(event) => change({ internalNotes: event.target.value })} /></label><label className="text-xs font-medium">Observações para o Cliente<textarea className="mt-1 min-h-24 w-full rounded-lg border bg-card p-3 text-sm" value={draft.customerNotes ?? ""} onChange={(event) => change({ customerNotes: event.target.value })} /></label><label className="text-xs font-medium md:col-span-2">Termos<textarea className="mt-1 min-h-24 w-full rounded-lg border bg-card p-3 text-sm" value={draft.terms ?? ""} onChange={(event) => change({ terms: event.target.value })} /></label></section>
      </main>
      <aside className="h-fit space-y-3 rounded-xl border bg-card p-4 xl:sticky xl:top-3">
        <h2 className="text-sm font-semibold">Resumo</h2>
        {[["Subtotal", draft.subtotalCents], ["Descontos", draft.discountCents], ["Acréscimos", draft.surchargeCents], ["Custo Estimado", financial?.costCents ?? 0], ["Lucro Estimado", financial?.profitCents ?? 0], ["Total", draft.totalCents]].map(([label, value]) => <div key={String(label)} className="flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><strong>{formatCurrencyBRLFromCents(Number(value))}</strong></div>)}
        <div className="flex justify-between text-sm"><span>Margem Estimada</span><strong>{formatPercentageFromBasisPoints(financial?.marginBasisPoints ?? 0)}</strong></div>
        {financial?.alerts.map((alert) => <p key={alert} className="rounded-md bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-300">{alert}</p>)}
        <p className="text-xs text-muted-foreground">O salvamento é manual para evitar persistir formulários incompletos ou criar registros duplicados.</p>
      </aside>
    </div>
  </div>;
}
