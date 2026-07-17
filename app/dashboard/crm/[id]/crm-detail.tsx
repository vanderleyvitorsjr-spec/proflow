"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, BarChart3, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader, PageHeaderActions, PageHeaderContent, PageHeaderHeading, PageHeaderIcon, PageHeaderIdentity } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { clientSchema, type ClientFormInput, type ClientFormValues } from "@/app/dashboard/clientes/cliente-schema";
import { convertCrmLeadAction, getCrmLeadAction } from "@/features/crm/crm-actions";
import { crmStages } from "@/features/crm/crm-data";
import type { CrmLeadRecord } from "@/features/crm/crm-types";
import { ptBrLabel } from "@/lib/pt-br-labels";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" });
const priorities = { LOW: "Baixa", MEDIUM: "Média", HIGH: "Alta", CRITICAL: "Crítica" } as const;
const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits.length === 11 ? digits.replace(/^(\d{2})(\d)(\d{4})(\d{4})$/, "($1) $2 $3-$4") : digits.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
};
const defaultsFromLead = (lead: CrmLeadRecord): ClientFormInput => ({ name: lead.name, document: lead.document, phone: lead.phone, whatsapp: lead.whatsapp, email: lead.email, type: lead.type === "COMPANY" ? "COMPANY" : "RESIDENTIAL", segment: "BOTH", status: "ACTIVE", street: lead.address, number: "", complement: "", district: "", city: lead.city, state: lead.state, zipCode: lead.zipCode, notes: `Convertido do CRM. Interesse: ${lead.serviceInterest}. ${lead.notes}` });

function ConversionForm({ lead, onDone }: { lead: CrmLeadRecord; onDone: (updated: CrmLeadRecord) => void }) {
  const [saving, setSaving] = useState(false), [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<ClientFormInput, unknown, ClientFormValues>({ resolver: zodResolver(clientSchema), defaultValues: defaultsFromLead(lead) });
  async function submit(values: ClientFormValues) { setSaving(true); setError(null); try { onDone(await convertCrmLeadAction(lead.id, values)); } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível converter o lead."); } finally { setSaving(false); } }
  return <form onSubmit={handleSubmit(submit)} className="grid gap-3 md:grid-cols-2">{error ? <div role="alert" className="md:col-span-2 rounded-lg border border-rose-500/30 p-3 text-sm text-rose-600">{error}</div> : null}<Field label="Nome" htmlFor="convert-name" error={errors.name?.message} className="md:col-span-2"><Input id="convert-name" {...register("name")} /></Field><Field label="CPF/CNPJ" htmlFor="convert-doc" error={errors.document?.message}><Input id="convert-doc" {...register("document")} /></Field><Field label="Telefone" htmlFor="convert-phone" error={errors.phone?.message}><Input id="convert-phone" {...register("phone")} /></Field><Field label="E-mail" htmlFor="convert-email" error={errors.email?.message}><Input id="convert-email" {...register("email")} /></Field><Field label="Tipo" htmlFor="convert-type"><Select id="convert-type" {...register("type")}><option value="RESIDENTIAL">Residencial</option><option value="COMPANY">Empresa</option><option value="CONDOMINIUM">Condomínio</option></Select></Field><Field label="Endereço" htmlFor="convert-street" error={errors.street?.message} className="md:col-span-2"><Input id="convert-street" {...register("street")} /></Field><Field label="Cidade" htmlFor="convert-city" error={errors.city?.message}><Input id="convert-city" {...register("city")} /></Field><Field label="UF" htmlFor="convert-state" error={errors.state?.message}><Input id="convert-state" {...register("state")} /></Field><input type="hidden" {...register("whatsapp")} /><input type="hidden" {...register("segment")} /><input type="hidden" {...register("status")} /><input type="hidden" {...register("number")} /><input type="hidden" {...register("complement")} /><input type="hidden" {...register("district")} /><input type="hidden" {...register("zipCode")} /><input type="hidden" {...register("notes")} /><div className="md:col-span-2 flex justify-end"><Button type="submit" disabled={saving}><UserPlus className="h-4 w-4" />{saving ? "Convertendo..." : "Confirmar conversão"}</Button></div></form>;
}

export function CrmDetail({ id }: { id: string }) {
  const [lead, setLead] = useState<CrmLeadRecord | null>(null), [loading, setLoading] = useState(true), [convert, setConvert] = useState(false), [error, setError] = useState<string | null>(null);
  useEffect(() => { let active = true; void getCrmLeadAction(id).then((record) => { if (active) setLead(record); }).catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar o lead."); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [id]);
  if (loading) return <CrmDetailLoading />;
  if (!lead) return <EmptyState title="Lead não encontrado" description={error ?? "O registro pode ter sido arquivado."} action={<Button asChild><Link href="/dashboard/crm">Voltar ao CRM</Link></Button>} />;
  const stage = crmStages.find((item) => item.id === lead.stageId);
  return <div className="space-y-3"><PageHeader><PageHeaderContent><PageHeaderIdentity><PageHeaderIcon><BarChart3 className="h-5 w-5" /></PageHeaderIcon><PageHeaderHeading title={lead.name} description={lead.serviceInterest} /></PageHeaderIdentity><PageHeaderActions><Button asChild variant="secondary"><Link href="/dashboard/crm"><ArrowLeft className="h-4 w-4" />Voltar</Link></Button>{lead.convertedClientId ? <Button asChild><Link href={`/dashboard/clientes/${lead.convertedClientId}`}>Abrir cliente</Link></Button> : <Button onClick={() => setConvert(true)}><UserPlus className="h-4 w-4" />Converter em cliente</Button>}</PageHeaderActions></PageHeaderContent></PageHeader>
    <div className="grid gap-3 lg:grid-cols-[2fr_1fr]"><Card><CardHeader><CardTitle>Dados da oportunidade</CardTitle></CardHeader><CardContent className="grid gap-4 text-sm sm:grid-cols-2"><Info label="Etapa" value={stage?.title ?? lead.stageId} /><Info label="Prioridade" value={priorities[lead.priority]} /><Info label="Origem" value={lead.source} /><Info label="Responsável" value={lead.salesOwner} /><Info label="Valor estimado" value={money.format(lead.estimatedValue)} /><Info label="Data de contato" value={new Intl.DateTimeFormat("pt-BR").format(new Date(`${lead.contactDate}T12:00:00`))} /><Info label="Telefone" value={formatPhone(lead.phone)} /><Info label="E-mail" value={lead.email || "Não informado"} /><Info label="Localização" value={`${lead.city}, ${lead.state}`} /><Info label="Observações" value={lead.notes || "Sem observações"} /></CardContent></Card><Card><CardHeader><CardTitle>Histórico</CardTitle></CardHeader><CardContent className="space-y-3">{lead.history.slice().reverse().map((item) => <div key={item.id} className="border-l-2 border-sky-500 pl-3"><Badge variant="outline">{ptBrLabel(item.type)}</Badge><p className="mt-1 text-sm">{item.description}</p><time className="text-xs text-muted-foreground">{date.format(new Date(item.createdAt))}</time></div>)}</CardContent></Card></div>
    {convert ? <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/55 p-4"><section role="dialog" aria-modal="true" aria-labelledby="convert-title" className="w-full max-w-2xl rounded-xl border bg-card p-5"><div className="mb-4 flex justify-between"><div><h2 id="convert-title" className="font-semibold">Converter em cliente</h2><p className="text-xs text-muted-foreground">Revise os dados antes de criar o cliente.</p></div><Button variant="secondary" onClick={() => setConvert(false)}>Fechar</Button></div><ConversionForm lead={lead} onDone={(updated) => { setLead(updated); setConvert(false); }} /></section></div> : null}
  </div>;
}
function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>; }
function CrmDetailLoading() { return <div className="h-72 animate-pulse rounded-xl bg-muted" />; }
