import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CircleCheckBig,
  PackageX,
  ShieldAlert,
  WalletCards,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const todaySchedule = [
  {
    time: "08:00",
    title: "Instalação Split 18.000 BTUs",
    customer: "Pousada Atlântica",
    address: "Av. Beira-Mar, Porto Seguro",
    technician: "Júnior Vitor",
    category: "Instalação",
    categoryClass:
      "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  },
  {
    time: "10:30",
    title: "Manutenção preventiva",
    customer: "Hotel Mares",
    address: "Centro, Porto Seguro",
    technician: "Carlos Almeida",
    category: "Preventiva",
    categoryClass:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  {
    time: "14:00",
    title: "Inspeção de quadro elétrico",
    customer: "Construtora Atlântica",
    address: "Orla Norte, Porto Seguro",
    technician: "Rafael Santos",
    category: "Elétrica",
    categoryClass:
      "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  },
];

const alerts = [
  {
    title: "Estoque abaixo do mínimo",
    description: "Tubulação de cobre 1/4 possui apenas 8 metros.",
    icon: PackageX,
    iconClass:
      "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
    priority: "Urgente",
  },
  {
    title: "Garantias próximas do vencimento",
    description: "4 garantias vencem nos próximos 15 dias.",
    icon: ShieldAlert,
    iconClass:
      "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    priority: "Atenção",
  },
  {
    title: "Contas a receber vencidas",
    description: "R$ 2.850,00 aguardam regularização.",
    icon: WalletCards,
    iconClass:
      "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    priority: "Financeiro",
  },
  {
    title: "Orçamento aprovado",
    description: "Camilla Vitor aprovou o orçamento nº ORC-2026-0148.",
    icon: CircleCheckBig,
    iconClass:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    priority: "Concluído",
  },
];

export function AlertsPanel() {
  return (
    <Card className="overflow-hidden rounded-[var(--radius-card)] border-border bg-card shadow-xs">
      <CardContent className="grid p-0 lg:grid-cols-[11rem_repeat(4,minmax(0,1fr))]">
        <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/35 px-3 py-2.5 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
            <div><p className="text-xs font-semibold text-foreground">Central de alertas</p><p className="text-[0.65rem] text-muted-foreground">{alerts.length} atualizações</p></div>
          </div>
          <Link href="/dashboard/agenda" aria-label="Ver agenda"><ArrowRight className="h-4 w-4 text-muted-foreground" /></Link>
        </div>
        {alerts.map((alert) => {
          const Icon = alert.icon;
          return (
            <article key={alert.title} className="flex min-w-0 items-center gap-2 border-b border-border px-2.5 py-2.5 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${alert.iconClass}`}><Icon className="h-4 w-4" aria-hidden="true" /></div>
              <div className="min-w-0"><p className="truncate text-xs font-semibold text-foreground">{alert.title}</p><p className="truncate text-[0.65rem] text-muted-foreground">{alert.description}</p></div>
            </article>
          );
        })}
      </CardContent>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border bg-background/60 px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-[0.68rem] font-semibold text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" /> Agenda:</span>
        {todaySchedule.map((appointment) => <span key={`${appointment.time}-${appointment.title}`} className="text-[0.68rem] text-muted-foreground"><strong className="text-foreground">{appointment.time}</strong> {appointment.title}</span>)}
      </div>
    </Card>
  );
}

export default AlertsPanel;
