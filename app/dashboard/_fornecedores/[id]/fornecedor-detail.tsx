"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Building2, CalendarClock, Mail, MapPin, Phone, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBrazilianPhone, formatCep, formatCpfCnpj, formatCurrencyBRLFromCents, formatDateTimeBR } from "@/lib/br-formatters";
import { getSupplierAction } from "../fornecedores-actions";
import type { SupplierRecord } from "../fornecedores-types";

export function SupplierDetail({ id }: { id: string }) {
  const [supplier, setSupplier] = useState<SupplierRecord | null>(null), [loading, setLoading] = useState(true);
  useEffect(() => { void getSupplierAction(id).then((result) => { if (result.ok) setSupplier(result.data); setLoading(false); }); }, [id]);
  if (loading) return <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground">Carregando fornecedor...</div>;
  if (!supplier) return <EmptyState title="Fornecedor não encontrado" description="O registro solicitado não existe ou não está mais disponível." action={<Button asChild><Link href="/dashboard/fornecedores">Voltar</Link></Button>} />;
  const address = [supplier.street, supplier.number, supplier.complement, supplier.district, supplier.city, supplier.state].filter(Boolean).join(", ");
  return <div className="space-y-4"><div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><Button asChild variant="ghost" size="icon"><Link href="/dashboard/fornecedores" aria-label="Voltar"><ArrowLeft className="size-4" /></Link></Button><div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Building2 className="size-5" /></div><div><h1 className="text-lg font-semibold">{supplier.tradeName}</h1><p className="text-xs text-muted-foreground">{supplier.code} · {supplier.legalName}</p></div></div><Badge variant={supplier.archivedAt ? "destructive" : supplier.status === "ACTIVE" ? "success" : supplier.status === "ATTENTION" ? "warning" : "neutral"}>{supplier.archivedAt ? "Arquivado" : supplier.status === "ACTIVE" ? "Ativo" : supplier.status === "ATTENTION" ? "Requer atenção" : "Inativo"}</Badge></div>
    <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]"><div className="space-y-4"><Card><CardHeader><CardTitle>Dados do fornecedor</CardTitle></CardHeader><CardContent className="grid gap-4 text-sm sm:grid-cols-2"><Info label="CPF/CNPJ" value={formatCpfCnpj(supplier.document) || "Não informado"} /><Info label="Contato" value={supplier.contactName ?? "Não informado"} /><Info label="Telefone" value={formatBrazilianPhone(supplier.phone) || "Não informado"} icon={<Phone className="size-4" />} /><Info label="WhatsApp" value={formatBrazilianPhone(supplier.whatsapp) || "Não informado"} /><Info label="E-mail" value={supplier.email ?? "Não informado"} icon={<Mail className="size-4" />} /><Info label="Endereço" value={address || "Não informado"} icon={<MapPin className="size-4" />} /><Info label="CEP" value={formatCep(supplier.zipCode) || "Não informado"} /><Info label="Inscrição estadual" value={supplier.stateRegistration ?? "Não informado"} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Categorias e condições comerciais</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2">{supplier.categories.map((item) => <Badge key={item} variant="outline">{item}</Badge>)}</div><div className="mt-5 grid gap-4 text-sm sm:grid-cols-2"><Info label="Pagamento" value={supplier.paymentTerms ?? "Não informado"} /><Info label="Forma preferencial" value={supplier.preferredPaymentMethod ?? "Não informado"} /><Info label="Prazo de entrega" value={supplier.deliveryLeadTimeDays !== undefined ? `${supplier.deliveryLeadTimeDays} dias` : "Não informado"} icon={<CalendarClock className="size-4" />} /><Info label="Pedido mínimo" value={supplier.minimumOrderCents !== undefined ? formatCurrencyBRLFromCents(supplier.minimumOrderCents) : "Não informado"} /><Info label="Avaliação" value={supplier.rating ? `${supplier.rating.toLocaleString("pt-BR")} de 5` : "Sem avaliação"} icon={<Star className="size-4" />} /></div></CardContent></Card>
      {supplier.notes ? <Card><CardHeader><CardTitle>Observações</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{supplier.notes}</CardContent></Card> : null}</div>
      <Card><CardHeader><CardTitle>Histórico</CardTitle></CardHeader><CardContent className="space-y-3">{[...supplier.history].reverse().map((entry) => <div key={entry.id} className="rounded-lg border p-3"><div className="text-sm font-medium">{entry.description}</div><div className="mt-1 text-xs text-muted-foreground">{formatDateTimeBR(entry.createdAt)}</div></div>)}</CardContent></Card></div>
  </div>;
}
function Info({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) { return <div><div className="text-xs font-medium text-muted-foreground">{label}</div><div className="mt-1 flex items-center gap-2 font-medium">{icon}{value}</div></div>; }
