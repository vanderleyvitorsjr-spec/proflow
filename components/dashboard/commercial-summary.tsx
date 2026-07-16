import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CircleCheckBig,
  Clock3,
  Target,
  UsersRound,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const commercialMetrics = [
  {
    label: "Novos leads",
    value: "24",
    description: "6 recebidos nesta semana",
    icon: UsersRound,
  },
  {
    label: "Orçamentos enviados",
    value: "18",
    description: "R$ 42.850,00 em propostas",
    icon: BriefcaseBusiness,
  },
  {
    label: "Aguardando retorno",
    value: "7",
    description: "3 exigem acompanhamento hoje",
    icon: Clock3,
  },
  {
    label: "Orçamentos aprovados",
    value: "11",
    description: "R$ 26.480,00 convertidos",
    icon: CircleCheckBig,
  },
];

export function CommercialSummary() {
  return (
    <Card className="h-full rounded-[var(--radius-card)] border-border bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border px-3.5 py-2.5">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Funil de vendas
          </p>
          <CardTitle className="mt-0.5 text-base">Comercial</CardTitle>
        </div>

        <Link
          href="/dashboard/crm"
          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 transition-colors hover:text-sky-500 dark:text-sky-400"
        >
          Abrir CRM
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </CardHeader>

      <CardContent className="grid min-h-24 grid-cols-2 gap-0 p-0 sm:grid-cols-5">
        <div className="flex items-center gap-2.5 border-b border-border bg-sky-50/70 p-2.5 sm:border-b-0 sm:border-r dark:bg-sky-500/5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-white">
            <Target className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Conversão</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="proflow-metric text-xl font-bold text-foreground">
                45,80%
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                +6,40%
              </span>
            </div>
          </div>
        </div>

        <div className="col-span-1 grid grid-cols-1 divide-y divide-border sm:col-span-4 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          {commercialMetrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <div
                key={metric.label}
                className="flex min-w-0 flex-col justify-center gap-1.5 p-2.5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>

                <span className="proflow-metric text-lg font-bold tracking-tight text-foreground">
                  {metric.value}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-foreground">{metric.label}</p>
                  <p className="truncate text-[0.65rem] text-muted-foreground">{metric.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default CommercialSummary;
