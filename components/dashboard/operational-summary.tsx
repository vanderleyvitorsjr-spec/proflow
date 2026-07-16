import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  PlayCircle,
  Wrench,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const operationalMetrics = [
  {
    label: "Agendadas",
    value: 18,
    total: 30,
    icon: Clock3,
    barClass: "bg-sky-500",
    iconClass:
      "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  },
  {
    label: "Em andamento",
    value: 6,
    total: 30,
    icon: PlayCircle,
    barClass: "bg-amber-500",
    iconClass:
      "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  },
  {
    label: "Concluídas",
    value: 22,
    total: 30,
    icon: CheckCircle2,
    barClass: "bg-emerald-500",
    iconClass:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  {
    label: "Atrasadas",
    value: 3,
    total: 30,
    icon: CircleAlert,
    barClass: "bg-rose-500",
    iconClass:
      "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
  },
];

export function OperationalSummary() {
  return (
    <Card className="h-full rounded-[var(--radius-card)] border-border bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border px-3.5 py-2.5">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Execução dos serviços
          </p>
          <CardTitle className="mt-0.5 text-base">Operacional</CardTitle>
        </div>

        <Link
          href="/dashboard/ordens"
          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 transition-colors hover:text-sky-500 dark:text-sky-400"
        >
          Ver ordens
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </CardHeader>

      <CardContent className="grid min-h-24 grid-cols-2 gap-0 p-0 sm:grid-cols-5">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-slate-900 p-2.5 text-white sm:border-b-0 sm:border-r dark:bg-slate-950">
          <div>
            <p className="text-xs font-medium text-slate-300">
              Serviços ativos hoje
            </p>
            <p className="proflow-metric mt-1 text-xl font-bold">12</p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500">
            <Wrench className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>

        <div className="col-span-1 grid grid-cols-1 divide-y divide-border sm:col-span-4 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          {operationalMetrics.map((metric) => {
            const Icon = metric.icon;
            const percentage = Math.round((metric.value / metric.total) * 100);

            return (
              <div key={metric.label} className="flex min-w-0 flex-col justify-center p-2.5">
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${metric.iconClass}`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>

                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                    {metric.label}
                  </span>

                  <span className="text-sm font-bold text-foreground">
                    {metric.value}
                  </span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${metric.barClass}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default OperationalSummary;
