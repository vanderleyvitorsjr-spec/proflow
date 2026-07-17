"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderHeading,
  PageHeaderIdentity,
  PageHeaderToolbar,
} from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTimeBR } from "@/lib/br-formatters";
import {
  archiveNotificationAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
  refreshNotificationsAction,
  restoreNotificationAction,
  snoozeNotificationAction,
} from "./notificacoes-actions";
import type { NotificationItem, NotificationState } from "./notificacoes-types";

const priorityLabels: Record<string, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

const typeLabels: Record<string, string> = {
  COMMERCIAL: "Comercial",
  OPERATIONAL: "Operacional",
  FINANCIAL: "Financeiro",
  INVENTORY: "Estoque",
  ASSET: "Equipamentos",
  SYSTEM: "Sistema",
};

export function NotificationsPage() {
  const [state, setState] = useState<(NotificationState & { partial?: boolean }) | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ACTIVE");
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    const next = await refreshNotificationsAction();
    setState(next);
    setRefreshing(false);
  };

  useEffect(() => {
    queueMicrotask(() => void load());
  }, []);

  const items = useMemo(
    () =>
      (state?.items ?? []).filter(
        (item) =>
          (filter === "ARCHIVED" ? item.archivedAt : !item.archivedAt) &&
          (!item.snoozedUntil || item.snoozedUntil <= new Date().toISOString()) &&
          `${item.title} ${item.description}`
            .toLocaleLowerCase("pt-BR")
            .includes(search.toLocaleLowerCase("pt-BR")),
      ),
    [state, search, filter],
  );

  const unreadCount = items.filter((item) => !item.readAt).length;
  const update = (value: NotificationState) =>
    setState({ ...value, partial: state?.partial });

  return (
    <div className="space-y-3">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderIdentity>
            <Bell className="h-5 w-5" />
            <PageHeaderHeading
              title="Central de Notificações"
              description="Alertas derivados, pendências e ocorrências dos módulos do ProFlow."
            />
          </PageHeaderIdentity>
          <PageHeaderActions>
            <Button
              size="sm"
              variant="secondary"
              disabled={!state || unreadCount === 0}
              onClick={() => update(markAllNotificationsReadAction())}
            >
              <CheckCheck className="h-4 w-4" />
              Marcar todas como lidas
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => void load()}
              aria-label="Atualizar notificações"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </PageHeaderActions>
        </PageHeaderContent>
        <PageHeaderToolbar className="grid gap-2 sm:grid-cols-[1fr_12rem_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar notificações..."
            />
          </div>
          <Select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="ACTIVE">Ativas</option>
            <option value="ARCHIVED">Arquivadas</option>
          </Select>
          <Badge variant="secondary" className="justify-center whitespace-nowrap">
            {state ? `${items.length} registro(s)` : "Carregando"}
          </Badge>
        </PageHeaderToolbar>
      </PageHeader>

      {state?.partial ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          Atualização parcial: uma ou mais fontes estão temporariamente indisponíveis.
        </p>
      ) : null}

      {!state ? (
        <div className="space-y-2" aria-label="Carregando notificações">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-xl border bg-card p-4">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="mt-2 h-5 w-2/3" />
              <Skeleton className="mt-2 h-4 w-full" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-5 w-5" />}
          title="Nenhuma notificação encontrada"
          description="Não há ocorrências para os filtros selecionados."
        />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <NotificationCard key={item.id} item={item} update={update} />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationCard({
  item,
  update,
}: {
  item: NotificationItem;
  update: (state: NotificationState) => void;
}) {
  return (
    <article
      className={`rounded-xl border bg-card p-4 transition-colors ${
        !item.readAt ? "border-primary/40 bg-primary/[0.025]" : ""
      }`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">
              {priorityLabels[item.priority] ?? item.priority}
            </Badge>
            <Badge variant="outline">{typeLabels[item.type] ?? item.type}</Badge>
            {!item.readAt ? <Badge>Não lida</Badge> : null}
          </div>
          <h2 className="font-semibold">{item.title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {item.description}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {formatDateTimeBR(item.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-1 lg:max-w-sm lg:justify-end">
          {item.link ? (
            <Button
              asChild
              size="sm"
              onClick={() => update(markNotificationReadAction(item.id))}
            >
              <Link href={item.link}>Abrir origem</Link>
            </Button>
          ) : null}
          {!item.readAt ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => update(markNotificationReadAction(item.id))}
            >
              Marcar como lida
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              update(
                snoozeNotificationAction(
                  item.id,
                  new Date(Date.now() + 86_400_000).toISOString(),
                ),
              )
            }
          >
            Lembrar amanhã
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              update(
                item.archivedAt
                  ? restoreNotificationAction(item.id)
                  : archiveNotificationAction(item.id),
              )
            }
          >
            {item.archivedAt ? "Restaurar" : "Arquivar"}
          </Button>
        </div>
      </div>
    </article>
  );
}
