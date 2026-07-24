"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Clock3,
  PackageX,
  RefreshCw,
  ShieldCheck,
  UsersRound,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MetricItem,
  MetricStrip,
} from "@/components/ui/metric-strip";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderHeading,
  PageHeaderIdentity,
} from "@/components/ui/page-header";
import {
  formatCurrencyBRLFromReais,
  formatDateTimeBR,
  formatTimeBR,
  normalizeProperName,
} from "@/lib/br-formatters";
import { loadOperationalCenterSnapshot } from "./central-operacional-gateway";
import { ptBrLabel } from "@/lib/pt-br-labels";
import { OperationalInsights } from "@/components/ui/operational-insights";
import { ActionCenter } from "@/components/ui/action-center";
import type {
  OperationalAlert,
  OperationalCenterSnapshot,
} from "./central-operacional-types";
import { FinancialSuggestions } from "./financial-suggestions";

const alertStyles: Record<OperationalAlert["level"], string> = {
  INFO: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-100",
  WARNING:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100",
  CRITICAL:
    "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100",
};

export function CentralOperacionalPage() {
  const [snapshot, setSnapshot] = useState<OperationalCenterSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSnapshot(await loadOperationalCenterSnapshot());
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível carregar a Central Operacional.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  const unhealthy =
    snapshot?.sourceStatus.filter((source) => !source.available || source.partial) ?? [];

  return (
    <div className="space-y-4">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderIdentity>
            <CircleDot className="h-5 w-5" />
            <PageHeaderHeading
              title="Central Operacional"
              description="Acompanhe equipes, Ordens, Agenda, Estoque e Equipamentos em um único lugar."
            />
          </PageHeaderIdentity>
          <PageHeaderActions>
            <Button asChild size="sm" variant="secondary">
              <Link href="/dashboard/ordens">Abrir Ordens</Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link href="/dashboard/agenda">Abrir Agenda</Link>
            </Button>
            <Button size="icon" variant="ghost" onClick={() => void load()} aria-label="Atualizar">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </PageHeaderActions>
        </PageHeaderContent>
      </PageHeader>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card px-4 py-3 text-xs">
        <div className="flex items-center gap-2">
          {unhealthy.length ? (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          ) : (
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          )}
          <span className="font-semibold">
            {unhealthy.length
              ? `${unhealthy.length} fonte(s) indisponível(is) ou parcial(is)`
              : "Todas as fontes operacionais disponíveis"}
          </span>
        </div>
        <span className="text-muted-foreground">
          {snapshot
            ? `Atualizado em ${formatDateTimeBR(snapshot.generatedAt)}`
            : "Aguardando atualização"}
        </span>
      </div>

      {error ? (
        <p role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      {loading && !snapshot ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : snapshot ? (
        <>
          <MetricStrip>
            <MetricItem label="OS de hoje" value={String(snapshot.orders.today.length)} />
            <MetricItem label="Em execução" value={String(snapshot.orders.inProgress.length)} />
            <MetricItem label="OS atrasadas" value={String(snapshot.orders.overdue.length)} />
            <MetricItem label="Técnicos ocupados" value={String(snapshot.agenda.technicians.filter((item) => item.status === "BUSY").length)} />
            <MetricItem label="Estoque crítico" value={String(snapshot.stock.lowCount + snapshot.stock.outCount)} />
            <MetricItem label="Em manutenção" value={String(snapshot.equipment.inMaintenanceCount)} />
          </MetricStrip>

          <OperationalInsights insights={snapshot.insights} />
          <ActionCenter insights={snapshot.insights} />
          <FinancialSuggestions
            suggestions={snapshot.financialSuggestions}
            onChanged={load}
          />

          <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Operação de hoje</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">Ordens organizadas por horário e prioridade operacional.</p>
                  </div>
                  <Badge variant="secondary">{snapshot.orders.today.length} atendimento(s)</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {snapshot.orders.today.length ? (
                  snapshot.orders.today.map((order) => (
                    <Link key={order.id} href={`/dashboard/ordens/${order.id}`} className="grid gap-2 rounded-xl border p-3 transition-colors hover:bg-muted/50 sm:grid-cols-[5rem_1fr_auto] sm:items-center">
                      <div className="font-mono text-sm font-semibold tabular-nums">{formatTimeBR(order.scheduledTime)}</div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{order.orderNumber} · {order.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{normalizeProperName(order.clientName)} · {normalizeProperName(order.technician || "Sem responsável")}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <Badge variant="outline">{ptBrLabel(order.status)}</Badge>
                        <p className="mt-1 text-xs font-medium tabular-nums">{formatCurrencyBRLFromReais(order.estimatedValue)}</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <EmptyLine icon={CalendarClock} title="Nenhuma OS para hoje" description="A Agenda e as Ordens estão livres para o período atual." />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Equipe em campo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {snapshot.agenda.technicians.length ? (
                  snapshot.agenda.technicians.map((technician) => (
                    <div key={technician.id} className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{technician.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {technician.currentEvent
                            ? `${technician.currentEvent.title} até ${formatTimeBR(technician.currentEvent.endAt)}`
                            : technician.nextEvent
                              ? `Próximo: ${formatTimeBR(technician.nextEvent.startAt)}`
                              : "Sem compromisso futuro"}
                        </p>
                      </div>
                      <Badge variant={technician.status === "BUSY" ? "default" : "secondary"}>
                        {technician.status === "BUSY" ? "Em atendimento" : technician.status === "UPCOMING" ? "Próximo" : "Disponível"}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <EmptyLine icon={UsersRound} title="Equipe sem agenda" description="Nenhum responsável foi encontrado nos compromissos de hoje." />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle>Próximos compromissos</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2">
                {snapshot.agenda.upcoming.length ? (
                  snapshot.agenda.upcoming.map((event) => (
                    <Link key={event.id} href={event.origin === "SERVICE_ORDER" && event.orderId ? `/dashboard/ordens/${event.orderId}` : `/dashboard/agenda/${event.id}`} className="rounded-xl border p-3 transition-colors hover:bg-muted/50">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{event.title}</p>
                        <Badge variant="outline">{ptBrLabel(event.priority)}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDateTimeBR(event.startAt)}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{normalizeProperName(event.customer)} · {normalizeProperName(event.technician)}</p>
                    </Link>
                  ))
                ) : (
                  <div className="sm:col-span-2"><EmptyLine icon={Clock3} title="Sem próximos compromissos" description="Nenhum evento futuro foi encontrado." /></div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle>Assistente operacional</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {snapshot.alerts.length ? snapshot.alerts.map((alert) => (
                  <Link key={alert.id} href={alert.link} className={`block rounded-xl border p-3 text-sm transition-opacity hover:opacity-80 ${alertStyles[alert.level]}`}>
                    <p className="font-semibold">{alert.title}</p>
                    <p className="mt-1 text-xs opacity-80">{alert.description}</p>
                  </Link>
                )) : (
                  <EmptyLine icon={CheckCircle2} title="Operação em ordem" description="Nenhuma pendência crítica foi identificada." />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatusCard icon={PackageX} title="Estoque" value={`${snapshot.stock.outCount} sem estoque`} description={`${snapshot.stock.lowCount} abaixo do mínimo · ${snapshot.stock.activeReservations} com reserva`} href="/dashboard/estoque" />
            <StatusCard icon={Wrench} title="Equipamentos" value={`${snapshot.equipment.inMaintenanceCount} em manutenção`} description={`${snapshot.equipment.overdueMaintenanceCount} vencidas · ${snapshot.equipment.expiringWarrantyCount} garantias vencendo`} href="/dashboard/equipamentos" />
            <StatusCard icon={AlertTriangle} title="Pendências" value={`${snapshot.orders.withoutTechnician.length} sem técnico`} description={`${snapshot.orders.overdue.length} Ordens atrasadas`} href="/dashboard/ordens" />
            <StatusCard icon={CalendarClock} title="Agenda" value={`${snapshot.agenda.today.length} compromisso(s)`} description={`${snapshot.agenda.upcoming.length} próximos listados`} href="/dashboard/agenda" />
          </div>
        </>
      ) : null}
    </div>
  );
}

function EmptyLine({ icon: Icon, title, description }: { icon: typeof Clock3; title: string; description: string }) {
  return <div className="flex items-start gap-3 rounded-xl border border-dashed p-4"><Icon className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-muted-foreground">{description}</p></div></div>;
}

function StatusCard({ icon: Icon, title, value, description, href }: { icon: typeof Clock3; title: string; value: string; description: string; href: string }) {
  return <Card><CardContent className="flex items-start gap-3 p-4"><div className="rounded-lg border bg-muted/50 p-2"><Icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="text-xs font-medium text-muted-foreground">{title}</p><p className="mt-1 text-sm font-bold tabular-nums">{value}</p><p className="mt-1 text-xs text-muted-foreground">{description}</p><Link href={href} className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">Abrir módulo</Link></div></CardContent></Card>;
}
