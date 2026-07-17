"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, Bell, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTimeBR } from "@/lib/br-formatters";
import { globalSearch } from "@/lib/integrations/global-search-gateway";
import { loadGlobalActivities } from "@/lib/integrations/global-activity-gateway";
import { refreshNotificationsAction } from "@/app/dashboard/notificacoes/notificacoes-actions";
import type {
  GlobalActivity,
  GlobalSearchResult,
} from "@/lib/contracts/global-activity.contract";

export function GlobalCommandCenter() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [activities, setActivities] = useState<GlobalActivity[]>([]);
  const [unread, setUnread] = useState(0);
  const [partial, setPartial] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setTimelineOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    void refreshNotificationsAction().then((state) =>
      setUnread(
        state.items.filter(
          (item) =>
            !item.readAt &&
            !item.archivedAt &&
            (!item.snoozedUntil || item.snoozedUntil <= new Date().toISOString()),
        ).length,
      ),
    );
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setSearching(true);
      void globalSearch(query).then((response) => {
        if (!active) return;
        setResults(response.items);
        setPartial(response.partial);
        setSearching(false);
      });
    }, 180);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query, searchOpen]);

  async function openTimeline() {
    setTimelineOpen(true);
    setLoadingTimeline(true);
    const response = await loadGlobalActivities();
    setActivities(response.items);
    setPartial(response.partial);
    setLoadingTimeline(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="hidden h-9 w-full max-w-md items-center gap-2 rounded-md border bg-surface-subtle px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted lg:flex"
      >
        <Search className="h-4 w-4" />
        Pesquisar clientes, OS, equipamentos...
        <kbd className="ml-auto rounded border bg-background px-1.5 py-0.5 text-[10px]">
          Ctrl K
        </kbd>
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => void openTimeline()}
        aria-label="Abrir timeline global"
      >
        <Activity className="h-5 w-5" />
      </Button>
      <Button
        asChild
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`${unread} notificações não lidas`}
      >
        <Link className="relative" href="/dashboard/notificacoes">
          <Bell className="h-5 w-5" />
          {unread > 0 ? (
            <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-rose-600 px-1 text-center text-[10px] leading-4 text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </Link>
      </Button>

      {searchOpen ? (
        <Overlay title="Pesquisa global" close={() => setSearchOpen(false)}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Digite para pesquisar..."
            />
          </div>
          {partial ? (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
              Alguns módulos não responderam. Os resultados exibidos podem estar
              incompletos.
            </p>
          ) : null}
          <div className="proflow-scrollbar mt-3 max-h-[60dvh] overflow-y-auto pr-1">
            {searching ? (
              <div className="space-y-2" aria-label="Pesquisando">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="rounded-lg border p-3">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="mt-2 h-4 w-2/3" />
                    <Skeleton className="mt-2 h-3 w-full" />
                  </div>
                ))}
              </div>
            ) : results.length ? (
              <div className="space-y-1">
                {results.map((result) => (
                  <Link
                    key={`${result.source}:${result.id}`}
                    href={result.link}
                    onClick={() => setSearchOpen(false)}
                    className="block rounded-lg border border-transparent p-3 transition-colors hover:border-border hover:bg-muted"
                  >
                    <span className="text-xs font-medium text-muted-foreground">
                      {result.source}
                    </span>
                    <p className="font-semibold">{result.title}</p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {result.description}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                size="compact"
                icon={<Search className="h-5 w-5" />}
                title={query ? "Nenhum resultado encontrado" : "Comece sua pesquisa"}
                description={
                  query
                    ? "Tente outro nome, código, telefone ou termo relacionado."
                    : "Pesquise em clientes, ordens, equipamentos e outros módulos do ProFlow."
                }
              />
            )}
          </div>
        </Overlay>
      ) : null}

      {timelineOpen ? (
        <Overlay title="Timeline global" close={() => setTimelineOpen(false)}>
          {partial ? (
            <p className="mb-2 text-xs text-amber-700 dark:text-amber-300">
              A timeline está parcial porque uma ou mais fontes não responderam.
            </p>
          ) : null}
          <div className="proflow-scrollbar max-h-[70dvh] overflow-y-auto pr-1">
            {loadingTimeline ? (
              <div className="space-y-3" aria-label="Carregando timeline">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="border-l-2 pl-3">
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="mt-2 h-4 w-2/3" />
                    <Skeleton className="mt-2 h-3 w-full" />
                  </div>
                ))}
              </div>
            ) : activities.length ? (
              <ol className="space-y-3">
                {activities.map((activity) => (
                  <li key={activity.id} className="border-l-2 border-primary/30 pl-3">
                    <p className="text-xs text-muted-foreground">
                      {activity.sourceLabel} · {formatDateTimeBR(activity.occurredAt)}
                    </p>
                    {activity.link ? (
                      <Link
                        href={activity.link}
                        onClick={() => setTimelineOpen(false)}
                        className="font-semibold hover:underline"
                      >
                        {activity.title}
                      </Link>
                    ) : (
                      <p className="font-semibold">{activity.title}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState
                size="compact"
                icon={<Activity className="h-5 w-5" />}
                title="Nenhuma atividade recente"
                description="As movimentações dos módulos aparecerão aqui conforme forem registradas."
              />
            )}
          </div>
        </Overlay>
      ) : null}
    </>
  );
}

function Overlay({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-start overflow-y-auto bg-slate-950/55 p-3 pt-[max(1rem,8dvh)] sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="mx-auto w-full max-w-2xl rounded-xl border bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
      >
        <div className="mb-3 flex items-center gap-3">
          <h2 className="font-bold">{title}</h2>
          <Button
            className="ml-auto"
            size="icon"
            variant="ghost"
            onClick={close}
            aria-label={`Fechar ${title.toLowerCase()}`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </section>
    </div>
  );
}
