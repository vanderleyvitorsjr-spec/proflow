"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  EyeOff,
  LayoutDashboard,
  RefreshCw,
  RotateCcw,
  Settings2,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderHeading,
  PageHeaderIdentity,
} from "@/components/ui/page-header";
import { formatDateTimeBR } from "@/lib/br-formatters";
import type {
  ReportDataset,
  ReportMetric,
  ReportSection,
} from "@/app/dashboard/relatorios/relatorios-types";
import { loadDashboardSnapshot } from "./dashboard-gateway";
import {
  dashboardPreferencesAdapter,
  type DashboardPreferences,
} from "./dashboard-preferences-adapter";

const areaLabels: Record<ReportSection["area"], string> = {
  COMMERCIAL: "Comercial",
  OPERATIONAL: "Operacional",
  FINANCIAL: "Financeiro",
  INVENTORY: "Estoque",
  ASSETS: "Equipamentos",
  PRICING: "Precificação",
};
export function DashboardOverview() {
  const [preferences, setPreferences] = useState<DashboardPreferences | null>(null),
    [dataset, setDataset] = useState<ReportDataset | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [editing, setEditing] = useState(false);
  useEffect(() => {
    queueMicrotask(() => setPreferences(dashboardPreferencesAdapter.load()));
  }, []);
  const load = useCallback(async () => {
    if (!preferences) return;
    setLoading(true);
    const result = await loadDashboardSnapshot(preferences.period);
    if (result.ok) {
      setDataset(result.data);
      setError("");
    } else setError(result.error);
    setLoading(false);
  }, [preferences]);
  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);
  const allMetrics = useMemo(
    () => dataset?.sections.flatMap((section) => section.metrics) ?? [],
    [dataset],
  );
  const visibleMetrics = useMemo(() => {
    const ordered = [
      ...((preferences?.order ?? [])
        .map((id) => allMetrics.find((metric) => metric.id === id))
        .filter(Boolean) as ReportMetric[]),
      ...allMetrics.filter((metric) => !preferences?.order.includes(metric.id)),
    ];
    return ordered.filter((metric) => !preferences?.hidden.includes(metric.id));
  }, [allMetrics, preferences]);
  const update = (next: DashboardPreferences) => {
    setPreferences(next);
    dashboardPreferencesAdapter.save(next);
  };
  function move(id: string, direction: -1 | 1) {
    if (!preferences) return;
    const ids = visibleMetrics.map((metric) => metric.id),
      index = ids.indexOf(id),
      target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    update({ ...preferences, order: ids });
  }
  if (!preferences) return null;
  const unhealthy =
    dataset?.sourceStatus.filter((source) => !source.available || source.partial) ?? [];
  const hero = visibleMetrics.slice(0, 4);
  return (
    <div className="space-y-4">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderIdentity>
            <LayoutDashboard className="h-5 w-5" />
            <PageHeaderHeading
              title="Dashboard"
              description="Visão executiva dos dados reais do ProFlow."
            />
          </PageHeaderIdentity>
          <PageHeaderActions>
            <Select
              className="w-40"
              value={preferences.period}
              onChange={(event) =>
                update({
                  ...preferences,
                  period: event.target.value as DashboardPreferences["period"],
                })
              }
            >
              <option value="TODAY">Hoje</option>
              <option value="LAST_7_DAYS">Últimos 7 dias</option>
              <option value="CURRENT_MONTH">Este mês</option>
            </Select>
            <Button size="sm" variant="secondary" onClick={() => setEditing(!editing)}>
              <Settings2 className="h-4 w-4" />
              Widgets
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => void load()}
              aria-label="Atualizar"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </PageHeaderActions>
        </PageHeaderContent>
      </PageHeader>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card px-4 py-3 text-xs">
        <div className="flex items-center gap-2">
          {unhealthy.length ? (
            <TriangleAlert className="h-4 w-4 text-amber-500" />
          ) : (
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          )}
          <span className="font-semibold">
            {unhealthy.length
              ? `${unhealthy.length} fonte(s) parcial(is)`
              : "Todas as fontes disponíveis"}
          </span>
        </div>
        <span className="text-muted-foreground">
          {dataset
            ? `Atualizado em ${formatDateTimeBR(dataset.generatedAt)} · ${dataset.executionTimeMs} ms`
            : "Aguardando atualização"}
        </span>
      </div>
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
        >
          {error}
        </p>
      ) : null}
      {editing ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
          <span className="text-sm font-semibold">Personalização ativa</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              dashboardPreferencesAdapter.clear();
              setPreferences(dashboardPreferencesAdapter.load());
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar padrão
          </Button>
          {allMetrics
            .filter((metric) => preferences.hidden.includes(metric.id))
            .map((metric) => (
              <Button
                key={metric.id}
                size="sm"
                variant="secondary"
                onClick={() =>
                  update({
                    ...preferences,
                    hidden: preferences.hidden.filter((id) => id !== metric.id),
                  })
                }
              >
                Exibir {metric.title}
              </Button>
            ))}
        </div>
      ) : null}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {hero.map((metric) => (
              <MetricCard
                key={metric.id}
                metric={metric}
                editing={editing}
                preferences={preferences}
                move={move}
                update={update}
                prominent
              />
            ))}
          </section>
          <div className="grid gap-4 xl:grid-cols-2">
            {(dataset?.sections ?? []).map((section) => {
              const metrics = section.metrics.filter(
                (metric) =>
                  visibleMetrics.some((visible) => visible.id === metric.id) &&
                  !hero.some((item) => item.id === metric.id),
              );
              if (!metrics.length) return null;
              return (
                <Card key={section.area}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>{areaLabels[section.area]}</CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {section.description}
                        </p>
                      </div>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/dashboard/relatorios?area=${section.area}`}>
                          Ver relatório
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-2 sm:grid-cols-2">
                    {metrics.slice(0, 6).map((metric) => (
                      <MetricCard
                        key={metric.id}
                        metric={metric}
                        editing={editing}
                        preferences={preferences}
                        move={move}
                        update={update}
                      />
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
function MetricCard({
  metric,
  editing,
  preferences,
  move,
  update,
  prominent = false,
}: {
  metric: ReportMetric;
  editing: boolean;
  preferences: DashboardPreferences;
  move: (id: string, direction: -1 | 1) => void;
  update: (next: DashboardPreferences) => void;
  prominent?: boolean;
}) {
  return (
    <article
      className={`rounded-xl border bg-card p-4 shadow-xs ${prominent ? "min-h-28" : "min-h-24"}`}
    >
      <div className="flex justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{metric.title}</p>
          <p
            className={`${prominent ? "text-2xl" : "text-lg"} mt-1 font-bold tabular-nums`}
          >
            {metric.status === "UNAVAILABLE" ? "Indisponível" : metric.formattedValue}
          </p>
        </div>
        {editing ? (
          <div className="flex">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => move(metric.id, -1)}
              aria-label="Mover para cima"
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => move(metric.id, 1)}
              aria-label="Mover para baixo"
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() =>
                update({ ...preferences, hidden: [...preferences.hidden, metric.id] })
              }
              aria-label="Ocultar"
            >
              <EyeOff className="h-3 w-3" />
            </Button>
          </div>
        ) : null}
      </div>
      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
        {metric.description}
      </p>
      {metric.link ? (
        <Link
          className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
          href={metric.link}
        >
          Abrir origem
        </Link>
      ) : null}
    </article>
  );
}
