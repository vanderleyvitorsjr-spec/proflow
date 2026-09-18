"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageHeader, PageHeaderActions, PageHeaderContent, PageHeaderHeading, PageHeaderIdentity } from "@/components/ui/page-header";
import { formatCurrencyBRLFromCents, formatDateBR, formatPercentageFromBasisPoints, parseCurrencyBRToCents } from "@/lib/br-formatters";
import { paymentConditionLabel, ptBrLabel } from "@/lib/pt-br-labels";
import { listClientsAction } from "@/app/dashboard/clientes/actions";
import { listCatalogServicesAction } from "@/app/dashboard/precificacao/catalogo-servicos-actions";
import type { CatalogService } from "@/app/dashboard/precificacao/catalogo-servicos-domain";
import { listStockPricingReferencesAction } from "@/app/dashboard/estoque/estoque-actions";
import type { StockPricingReference } from "@/lib/contracts/estoque.contract";
import { createQuoteAction, getQuoteAction, updateQuoteAction } from "./orcamentos-actions";
import { OrcamentoItensEditor } from "./orcamento-itens-editor";
import {
  calculateQuote, quoteFinancialSummary, quotePaymentSchedule, validateQuoteItem,
  type ProfessionalQuote,
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
  const [materials, setMaterials] = useState<StockPricingReference[]>([]);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void Promise.all([listClientsAction(), listCatalogServicesAction(), listStockPricingReferencesAction(), quoteId ? getQuoteAction(quoteId) : Promise.resolve(undefined)])
      .then(([clientList, serviceList, materialResult, current]) => {
        setClients(clientList.filter((item) => !item.deletedAt));
        setServices(serviceList.filter((item) => item.active));
        if (materialResult.ok) setMaterials(materialResult.data.filter((item) => !item.archived));
        if (quoteId && current) setQuote(current);
      });
  }, [quoteId]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "Existem alterações não salvas. Deseja sair sem salvar?";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const financial = useMemo(() => quote ? quoteFinancialSummary(quote) : undefined, [quote]);
  const schedule = useMemo(() => {
    if (!quote) return [];
    try { return quotePaymentSchedule(quote.totalCents, quote.paymentTerms); } catch { return []; }
  }, [quote]);

  function change(changes: Partial<ProfessionalQuote>) {
    setQuote((current) => {
      if (!current) return current;
      const next = { ...current, ...changes };
      return changes.items || changes.discountCents !== undefined || changes.surchargeCents !== undefined || changes.taxCents !== undefined
        ? { ...next, ...calculateQuote(next.items, next.discountCents, next.surchargeCents, next.taxCents) }
        : next;
    });
    setDirty(true);
  }
  function validateItems() {
    const errors = quote?.items.flatMap(validateQuoteItem) ?? [];
    if (errors.length) { setMessage(errors[0]!); return false; }
    return true;
  }
  async function save() {
    if (!quote || submitting || !validateItems()) return;
    setSubmitting(true); setMessage("");
    try {
      const saved = await updateQuoteAction(quote.id, quote); setQuote(saved); setDirty(false);
      setMessage("Alterações salvas.");
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Não foi possível salvar o orçamento."); }
    finally { setSubmitting(false); }
  }
  async function createDraft() {
    if (submitting || !validateItems()) return;
    const client = clients.find((item) => item.id === quote?.clientId);
    if (!client || !quote?.title.trim()) { setMessage("Selecione o cliente e informe o título."); return; }
    setSubmitting(true); setMessage("");
    try {
      const address = [client.street, client.number, client.complement, client.district].filter(Boolean).join(", ");
      const created = await createQuoteAction({ ...quote,
        clientId: client.id, clientName: client.name, clientDocument: client.document,
        clientPhone: client.phone, clientEmail: client.email, zipCode: client.zipCode, address: quote.address || address,
        city: quote.city || client.city, state: quote.state || client.state,
        issuedAt: quote.issuedAt || today(),
      });
      setDirty(false); router.push(`/dashboard/orcamentos/${created.id}/editar`);
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Não foi possível criar o rascunho."); setSubmitting(false); }
  }

  if (!quote && quoteId) return <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Carregando Orçamento...</div>;
  const draft = quote ?? newQuoteDraft();
  const itemsLocked = Boolean(quoteId && draft.status !== "DRAFT");

  return <div className="space-y-3">
    <PageHeader><PageHeaderContent><PageHeaderIdentity><PageHeaderHeading title={draft.number} description={`Versão ${draft.version} · ${ptBrLabel(draft.status)} · ${dirty ? "Alterações Não Salvas" : quoteId ? "Rascunho Salvo" : "Novo Rascunho"}`} /></PageHeaderIdentity><PageHeaderActions>
      {quoteId ? <Button asChild size="sm" variant="secondary"><Link href={`/dashboard/orcamentos/${quoteId}/visualizar`}><Eye className="size-4" />Visualizar</Link></Button> : null}
      <Button size="sm" disabled={submitting} onClick={() => void (quoteId ? save() : createDraft())}><Save className="size-4" />{submitting ? "Salvando..." : quoteId ? "Salvar alterações" : "Criar Rascunho"}</Button>
    </PageHeaderActions></PageHeaderContent></PageHeader>
    {message ? <p role="status" className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">{message}</p> : null}
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <main className="space-y-3">
        <section className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2">
          <h2 className="col-span-full text-sm font-semibold">Dados Gerais e Cliente</h2>
          <label className="text-xs font-medium">Cliente<Select value={draft.clientId} onChange={(event) => { const client = clients.find((item) => item.id === event.target.value); const address = client ? [client.street, client.number, client.complement, client.district].filter(Boolean).join(", ") : ""; change({ clientId: event.target.value, clientName: client?.name ?? "", clientDocument: client?.document, clientPhone: client?.phone, address, city: client?.city, state: client?.state }); }}><option value="">Selecione o Cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name} · {client.city}/{client.state}</option>)}</Select>{!clients.length ? <span className="mt-1 block text-muted-foreground">Nenhum cliente cadastrado. Cadastre um cliente antes de criar o orçamento.</span> : null}</label>
          <label className="text-xs font-medium">Responsável<Input value={draft.responsible ?? ""} onChange={(event) => change({ responsible: event.target.value })} placeholder="Ex.: Técnico Responsável" /></label>
          <label className="text-xs font-medium md:col-span-2">Título<Input value={draft.title} onChange={(event) => change({ title: event.target.value })} placeholder="Ex.: Instalação de Ar-Condicionado Split" /></label>
          <label className="text-xs font-medium md:col-span-2">Descrição<textarea className="mt-1 min-h-24 w-full rounded-lg border bg-card p-3 text-sm" value={draft.description ?? ""} onChange={(event) => change({ description: event.target.value })} /></label>
          <label className="text-xs font-medium">Data de Emissão<Input type="date" value={draft.issuedAt?.slice(0, 10) ?? ""} onChange={(event) => change({ issuedAt: event.target.value })} /></label>
          <label className="text-xs font-medium">Válido Até<Input type="date" value={draft.validUntil?.slice(0, 10) ?? ""} onChange={(event) => change({ validUntil: event.target.value })} /></label>
          <label className="text-xs font-medium">Tipo de Serviço<Select value={draft.serviceType ?? ""} onChange={(event) => change({ serviceType: event.target.value as ProfessionalQuote["serviceType"] })}><option value="">Selecione</option>{["CLIMATIZATION","ELECTRICAL","IT","PREVENTIVE","CORRECTIVE","INSTALLATION"].map((value) => <option key={value} value={value}>{ptBrLabel(value)}</option>)}</Select></label>
          <label className="text-xs font-medium">Prazo de Execução<Input value={draft.executionDeadline ?? ""} onChange={(event) => change({ executionDeadline: event.target.value })} placeholder="Ex.: 5 dias úteis" /></label>
          <label className="text-xs font-medium md:col-span-2">Endereço do Atendimento<Input value={draft.address ?? ""} onChange={(event) => change({ address: event.target.value })} placeholder="Ex.: Rua Exemplo, 100, Centro" /></label>
          <label className="text-xs font-medium">Garantia<Input value={draft.warranty ?? ""} onChange={(event) => change({ warranty: event.target.value })} placeholder="Ex.: 90 dias para o serviço" /></label>
          <label className="text-xs font-medium">Equipamento<Input value={draft.equipmentDescription ?? ""} onChange={(event) => change({ equipmentDescription: event.target.value })} placeholder="Ex.: Split 18.000 BTUs" /></label>
        </section>
        <OrcamentoItensEditor items={draft.items} services={services} materials={materials} locked={itemsLocked} onChange={(items) => change({ items })} onMessage={setMessage} />
        <section className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2">
          <h2 className="col-span-full text-sm font-semibold">Condições de Pagamento</h2>
          <label className="text-xs font-medium">Condição<Select value={draft.paymentTerms.type} onChange={(event) => change({ paymentTerms: { ...draft.paymentTerms, type: event.target.value as ProfessionalQuote["paymentTerms"]["type"] } })}>{["CASH","ENTRY_BALANCE","INSTALLMENTS","MILESTONES","CUSTOM"].map((value) => <option key={value} value={value}>{paymentConditionLabel(value)}</option>)}</Select></label>
          <label className="text-xs font-medium">Forma<Select value={draft.paymentTerms.method} onChange={(event) => change({ paymentTerms: { ...draft.paymentTerms, method: event.target.value as ProfessionalQuote["paymentTerms"]["method"] } })}>{["PIX","CASH","CREDIT_CARD","DEBIT_CARD","BOLETO","BANK_TRANSFER","OTHER"].map((value) => <option key={value} value={value}>{ptBrLabel(value)}</option>)}</Select></label>
          {draft.paymentTerms.type === "CASH" ? <label className="text-xs font-medium">Data prevista<Input type="date" value={draft.paymentTerms.firstDueDate ?? ""} onChange={(event) => change({ paymentTerms: { ...draft.paymentTerms, firstDueDate: event.target.value } })} /></label> : null}
          {draft.paymentTerms.type === "ENTRY_BALANCE" ? <><label className="text-xs font-medium">Entrada (R$)<Input type="number" min="0" step="0.01" value={((draft.paymentTerms.entryAmountCents ?? 0) / 100).toFixed(2)} onChange={(event) => change({ paymentTerms: { ...draft.paymentTerms, entryAmountCents: Math.round(Number(event.target.value || 0) * 100) } })} /></label><label className="text-xs font-medium">Data da entrada<Input type="date" value={draft.paymentTerms.firstDueDate ?? ""} onChange={(event) => change({ paymentTerms: { ...draft.paymentTerms, firstDueDate: event.target.value } })} /></label><label className="text-xs font-medium">Vencimento do saldo<Input type="date" value={draft.paymentTerms.balanceDueDate ?? ""} onChange={(event) => change({ paymentTerms: { ...draft.paymentTerms, balanceDueDate: event.target.value } })} /></label></> : null}
          {draft.paymentTerms.type === "INSTALLMENTS" ? <><label className="text-xs font-medium">Quantidade de Parcelas<Input type="number" min="1" value={draft.paymentTerms.installmentCount ?? 1} onChange={(event) => change({ paymentTerms: { ...draft.paymentTerms, installmentCount: Number(event.target.value) } })} /></label><label className="text-xs font-medium">Primeiro Vencimento<Input type="date" value={draft.paymentTerms.firstDueDate ?? ""} onChange={(event) => change({ paymentTerms: { ...draft.paymentTerms, firstDueDate: event.target.value } })} /></label><label className="text-xs font-medium">Intervalo em dias<Input type="number" min="1" value={draft.paymentTerms.intervalDays ?? 30} onChange={(event) => change({ paymentTerms: { ...draft.paymentTerms, intervalDays: Number(event.target.value) } })} /></label></> : null}
          {draft.paymentTerms.type === "CUSTOM" ? <label className="text-xs font-medium md:col-span-2">Condição personalizada<textarea className="mt-1 min-h-20 w-full rounded-lg border bg-card p-3 text-sm" value={draft.paymentTerms.notes ?? ""} onChange={(event) => change({ paymentTerms: { ...draft.paymentTerms, notes: event.target.value } })} placeholder="Descreva prazos, valores e regras combinadas." /></label> : null}
          <div className="col-span-full grid gap-2 sm:grid-cols-3">{schedule.map((entry) => <div key={entry.label} className="rounded-lg bg-muted p-2 text-xs"><strong className="block">{entry.label}</strong>{formatCurrencyBRLFromCents(entry.amountCents)}{entry.dueDate ? ` · ${formatDateBR(entry.dueDate)}` : ""}</div>)}</div>
        </section>
        <section className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2"><label className="text-xs font-medium">Observações Internas<textarea className="mt-1 min-h-24 w-full rounded-lg border bg-card p-3 text-sm" value={draft.internalNotes ?? ""} onChange={(event) => change({ internalNotes: event.target.value })} /></label><label className="text-xs font-medium">Observações para o Cliente<textarea className="mt-1 min-h-24 w-full rounded-lg border bg-card p-3 text-sm" value={draft.customerNotes ?? ""} onChange={(event) => change({ customerNotes: event.target.value })} /></label><label className="text-xs font-medium md:col-span-2">Termos<textarea className="mt-1 min-h-24 w-full rounded-lg border bg-card p-3 text-sm" value={draft.terms ?? ""} onChange={(event) => change({ terms: event.target.value })} /></label></section>
      </main>
      <aside className="h-fit space-y-3 rounded-xl border bg-card p-4 xl:sticky xl:top-3">
        <h2 className="text-sm font-semibold">Resumo</h2>
        <label className="block text-xs font-medium">Desconto<Input className="mt-1" value={(draft.discountCents / 100).toFixed(2).replace(".", ",")} onChange={(event) => change({ discountCents: parseCurrencyBRToCents(event.target.value) })} /></label>
        <label className="block text-xs font-medium">Acréscimo<Input className="mt-1" value={(draft.surchargeCents / 100).toFixed(2).replace(".", ",")} onChange={(event) => change({ surchargeCents: parseCurrencyBRToCents(event.target.value) })} /></label>
        {[["Subtotal", draft.subtotalCents], ["Descontos", draft.discountCents + (draft.itemDiscountCents ?? 0)], ["Acréscimos", draft.surchargeCents], ["Custo Estimado", financial?.costCents ?? 0], ["Lucro Estimado", financial?.profitCents ?? 0], ["Total", draft.totalCents]].map(([label, value]) => <div key={String(label)} className="flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><strong>{formatCurrencyBRLFromCents(Number(value))}</strong></div>)}
        <div className="flex justify-between text-sm"><span>Margem Estimada</span><strong>{formatPercentageFromBasisPoints(financial?.marginBasisPoints ?? 0)}</strong></div>
        {financial?.alerts.map((alert) => <p key={alert} className="rounded-md bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-300">{alert}</p>)}
        <p className="text-xs text-muted-foreground">O salvamento é manual para evitar persistir formulários incompletos ou criar registros duplicados.</p>
      </aside>
    </div>
  </div>;
}
