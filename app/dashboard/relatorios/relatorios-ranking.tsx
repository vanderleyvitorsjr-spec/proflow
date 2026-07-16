import {
  Building2,
  MapPin,
  Medal,
  Star,
  UserRoundCheck,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type {
  CityPerformance,
  RankingRecord,
  TechnicianPerformance,
} from "./relatorios-data";

type RelatoriosRankingProps = {
  services: RankingRecord[];
  customers: RankingRecord[];
  technicians: TechnicianPerformance[];
  cities: CityPerformance[];
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
});

const percentageFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function RankingList({
  title,
  subtitle,
  records,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  records: RankingRecord[];
  icon: typeof Wrench;
}) {
  return (
    <Card className="rounded-[var(--radius-card)] border-border bg-card shadow-xs">
      <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {subtitle}
          </p>

          <CardTitle className="mt-1 text-lg">
            {title}
          </CardTitle>
        </div>

        <div className="rounded-xl bg-sky-50 p-2.5 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </CardHeader>

      <CardContent className="divide-y divide-border p-4 pt-1">
        {records.map((record, index) => (
          <article
            key={record.id}
            className="py-4 first:pt-4 last:pb-0"
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
                  index === 0
                    ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {index === 0 ? (
                  <Medal className="h-4 w-4" aria-hidden="true" />
                ) : (
                  index + 1
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {record.name}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {record.description}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">
                      {currencyFormatter.format(record.revenue)}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {record.quantity} registro(s)
                    </p>
                  </div>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-sky-500"
                    style={{ width: `${record.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}

export function RelatoriosRanking({
  services,
  customers,
  technicians,
  cities,
}: RelatoriosRankingProps) {
  return (
    <section className="space-y-3">
      <div className="grid gap-3 xl:grid-cols-2">
        <RankingList
          title="Serviços mais relevantes"
          subtitle="Receita e quantidade"
          records={services}
          icon={Wrench}
        />

        <RankingList
          title="Clientes com maior receita"
          subtitle="Carteira de clientes"
          records={customers}
          icon={Building2}
        />
      </div>

      <Card className="overflow-hidden rounded-[var(--radius-card)] border-border bg-card shadow-xs">
        <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Produtividade
            </p>

            <CardTitle className="mt-1 text-lg">
              Desempenho das equipes
            </CardTitle>
          </div>

          <UserRoundCheck
            className="h-5 w-5 text-violet-600"
            aria-hidden="true"
          />
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[68rem] border-collapse [&_td]:!px-3 [&_td]:!py-2.5 [&_th]:!px-3 [&_th]:!py-2.5">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Equipe
                </th>

                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  OS concluídas
                </th>

                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Tempo médio
                </th>

                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Receita
                </th>

                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Satisfação
                </th>

                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Produtividade
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {technicians.map((technician) => (
                <tr
                  key={technician.id}
                  className="transition-colors hover:bg-muted/35"
                >
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-foreground">
                      {technician.name}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {technician.specialty}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm font-bold text-foreground">
                    {technician.completedOrders}
                  </td>

                  <td className="px-5 py-4 text-sm text-foreground">
                    {numberFormatter.format(
                      technician.averageTimeHours,
                    )}{" "}
                    h
                  </td>

                  <td className="px-5 py-4 text-sm font-bold text-foreground">
                    {currencyFormatter.format(technician.revenue)}
                  </td>

                  <td className="px-5 py-4">
                    <Badge variant="success">
                      <Star
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                      {percentageFormatter.format(
                        technician.satisfaction,
                      )}
                      %
                    </Badge>
                  </td>

                  <td className="px-5 py-4">
                    <div className="w-36">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          Índice
                        </span>

                        <strong className="text-foreground">
                          {technician.productivity}%
                        </strong>
                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-violet-500"
                          style={{
                            width: `${technician.productivity}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="overflow-hidden rounded-[var(--radius-card)] border-border bg-card shadow-xs">
        <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Cobertura geográfica
            </p>

            <CardTitle className="mt-1 text-lg">
              Desempenho por cidade
            </CardTitle>
          </div>

          <MapPin
            className="h-5 w-5 text-rose-600"
            aria-hidden="true"
          />
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[60rem] border-collapse [&_td]:!px-3 [&_td]:!py-2.5 [&_th]:!px-3 [&_th]:!py-2.5">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Cidade
                </th>

                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Ordens
                </th>

                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Clientes
                </th>

                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Receita
                </th>

                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Ticket médio
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {cities.map((city) => (
                <tr
                  key={city.id}
                  className="transition-colors hover:bg-muted/35"
                >
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-foreground">
                      {city.city}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {city.state}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm font-bold text-foreground">
                    {city.serviceOrders}
                  </td>

                  <td className="px-5 py-4 text-sm text-foreground">
                    {city.customers}
                  </td>

                  <td className="px-5 py-4 text-sm font-bold text-foreground">
                    {currencyFormatter.format(city.revenue)}
                  </td>

                  <td className="px-5 py-4 text-sm font-semibold text-foreground">
                    {currencyFormatter.format(city.averageTicket)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
