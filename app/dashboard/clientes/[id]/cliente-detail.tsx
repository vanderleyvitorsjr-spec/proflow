"use client";

import Link from "next/link";
import { ArrowLeft, Building2, CalendarDays, Mail, MapPin, Phone, UserRound, Wrench } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, PageHeaderActions, PageHeaderContent, PageHeaderHeading, PageHeaderIcon, PageHeaderIdentity } from "@/components/ui/page-header";

import { getClientAction } from "../actions";
import type { ClientRecord } from "../clientes-data";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" });
const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const statusLabels = { ACTIVE: "Ativo", RECURRING: "Recorrente", ATTENTION: "Requer atenção", INACTIVE: "Inativo" } as const;

function formatPhone(value?: string) {
  const digits = value?.replace(/\D/g, "") ?? "";
  if (digits.length === 11) return digits.replace(/^(\d{2})(\d)(\d{4})(\d{4})$/, "($1) $2 $3-$4");
  if (digits.length === 10) return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  return value || "Não informado";
}

export function ClientDetail({ id }: { id: string }) {
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getClientAction(id)
      .then((record) => { if (active) setClient(record); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Não foi possível carregar o cliente."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <div className="space-y-3" aria-label="Carregando cliente"><div className="h-24 animate-pulse rounded-xl bg-muted" /><div className="h-72 animate-pulse rounded-xl bg-muted" /></div>;

  if (!client || error) {
    return <EmptyState title="Cliente não encontrado" description={error || "O cliente pode ter sido excluído ou não existe neste dispositivo."} action={<Button asChild variant="secondary"><Link href="/dashboard/clientes">Voltar para Clientes</Link></Button>} />;
  }

  return (
    <div className="space-y-3">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderIdentity><PageHeaderIcon><UserRound className="h-5 w-5" /></PageHeaderIcon><PageHeaderHeading title={client.name} description="Ficha completa do cliente e resumo operacional." /></PageHeaderIdentity>
          <PageHeaderActions><Button asChild variant="secondary" size="sm"><Link href="/dashboard/clientes"><ArrowLeft className="h-4 w-4" />Voltar</Link></Button></PageHeaderActions>
        </PageHeaderContent>
      </PageHeader>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardHeader className="border-b px-4 py-3"><h2 className="text-sm font-semibold">Dados cadastrais</h2></CardHeader>
          <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
            <div><p className="text-xs text-muted-foreground">Nome</p><p className="mt-1 font-medium">{client.name}</p></div>
            <div><p className="text-xs text-muted-foreground">Situação</p><Badge className="mt-1">{statusLabels[client.status]}</Badge></div>
            <div className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Telefone</p><p className="mt-1 text-sm">{formatPhone(client.phone)}</p></div></div>
            <div className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">E-mail</p><p className="mt-1 text-sm">{client.email || "Não informado"}</p></div></div>
            <div className="flex gap-2 sm:col-span-2"><MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Endereço</p><p className="mt-1 text-sm">{[client.street, client.number, client.district, client.city, client.state].filter(Boolean).join(", ")}</p></div></div>
            <div className="flex gap-2 sm:col-span-2"><CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Cliente desde</p><p className="mt-1 text-sm">{dateFormatter.format(new Date(client.createdAt))}</p></div></div>
            {client.notes ? <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Observações</p><p className="mt-1 whitespace-pre-wrap text-sm">{client.notes}</p></div> : null}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Card><CardContent className="space-y-3 p-4"><div className="flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" /><strong>{client.activeServiceOrders} OS ativas</strong></div><div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /><strong>{client.installedEquipment} equipamentos</strong></div><p className="border-t pt-3 text-lg font-semibold">{currencyFormatter.format(client.lifetimeValue)}</p><p className="text-xs text-muted-foreground">Valor acumulado</p></CardContent></Card>
          <EmptyState size="compact" title="Sem atividade vinculada" description="Novas Ordens de Serviço, contratos e equipamentos aparecerão aqui quando os módulos forem integrados." />
        </div>
      </div>
    </div>
  );
}
