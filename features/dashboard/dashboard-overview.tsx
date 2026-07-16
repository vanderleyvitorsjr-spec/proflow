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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderHeading,
  PageHeaderIdentity,
} from "@/components/ui/page-header";
import type {
  ReportDataset,
  ReportMetric,
} from "@/app/dashboard/relatorios/relatorios-types";
import { loadDashboardSnapshot } from "./dashboard-gateway";
import {
  dashboardPreferencesAdapter,
  type DashboardPreferences,
} from "./dashboard-preferences-adapter";
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
  const metrics = useMemo(() => {
    const all = dataset?.sections.flatMap((section) => section.metrics) ?? [];
    const ordered = [
      ...((preferences?.order ?? [])
        .map((id) => all.find((m) => m.id === id))
        .filter(Boolean) as ReportMetric[]),
      ...all.filter((m) => !preferences?.order.includes(m.id)),
    ];
    return ordered.filter((m) => !preferences?.hidden.includes(m.id));
  }, [dataset, preferences]);
  const update = (next: DashboardPreferences) => {
    setPreferences(next);
    dashboardPreferencesAdapter.save(next);
  };
  function move(id: string, direction: -1 | 1) {
    if (!preferences) return;
    const ids = metrics.map((m) => m.id),
      index = ids.indexOf(id),
      target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    update({ ...preferences, order: ids });
  }
  if (!preferences) return null;
  return (
    <div className="space-y-3">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderIdentity>
            <LayoutDashboard className="h-5 w-5" />
            <PageHeaderHeading
              title="Dashboard"
              description="Visão executiva baseada nos dados persistidos dos módulos."
            />
          </PageHeaderIdentity>
          <PageHeaderActions>
            <Select
              className="w-40"
              value={preferences.period}
              onChange={(e) =>
                update({
                  ...preferences,
                  period: e.target.value as DashboardPreferences["period"],
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
              <RefreshCw className="h-4 w-4" />
            </Button>
          </PageHeaderActions>
        </PageHeaderContent>
      </PageHeader>
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700"
        >
          {error}
        </p>
      )}
      {dataset?.sourceStatus.some((s) => !s.available || s.partial) && (
        <p className="text-xs text-amber-700">
          Algumas fontes estão parciais ou indisponíveis; os demais widgets continuam
          atualizados.
        </p>
      )}
      {editing && (
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
          {(dataset?.sections.flatMap((s) => s.metrics) ?? [])
            .filter((m) => preferences.hidden.includes(m.id))
            .map((m) => (
              <Button
                key={m.id}
                size="sm"
                variant="secondary"
                onClick={() =>
                  update({
                    ...preferences,
                    hidden: preferences.hidden.filter((id) => id !== m.id),
                  })
                }
              >
                Exibir {m.title}
              </Button>
            ))}
        </div>
      )}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metrics.map((metric) => (
            <article
              key={metric.id}
              className={`rounded-xl border bg-card p-4 ${preferences.sizes[metric.id] === "large" ? "col-span-2" : preferences.sizes[metric.id] === "medium" ? "lg:col-span-2" : ""}`}
            >
              <div className="flex justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">{metric.title}</p>
                  <p className="mt-1 text-xl font-bold">
                    {metric.status === "UNAVAILABLE"
                      ? "Indisponível"
                      : metric.formattedValue}
                  </p>
                </div>
                {editing && (
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
                        update({
                          ...preferences,
                          hidden: [...preferences.hidden, metric.id],
                        })
                      }
                      aria-label="Ocultar"
                    >
                      <EyeOff className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{metric.description}</p>
              {metric.link && (
                <Link
                  className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
                  href={metric.link}
                >
                  Abrir origem
                </Link>
              )}
              {editing && (
                <Select
                  className="mt-2"
                  value={preferences.sizes[metric.id] ?? "small"}
                  onChange={(e) =>
                    update({
                      ...preferences,
                      sizes: {
                        ...preferences.sizes,
                        [metric.id]: e.target.value as "small" | "medium" | "large",
                      },
                    })
                  }
                >
                  <option value="small">Pequeno</option>
                  <option value="medium">Médio</option>
                  <option value="large">Grande</option>
                </Select>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
