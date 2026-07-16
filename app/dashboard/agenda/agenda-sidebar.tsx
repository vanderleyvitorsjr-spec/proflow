import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/utils";

import type { AgendaEvent, AgendaTeam } from "./agenda-data";

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const teamStatusConfig: Record<
  AgendaTeam["status"],
  {
    label: string;
    variant: "success" | "warning" | "neutral";
    dotClass: string;
  }
> = {
  AVAILABLE: {
    label: "Disponível",
    variant: "success",
    dotClass: "bg-emerald-500",
  },
  BUSY: {
    label: "Em atendimento",
    variant: "warning",
    dotClass: "bg-amber-500",
  },
  OFFLINE: {
    label: "Indisponível",
    variant: "neutral",
    dotClass: "bg-slate-400",
  },
};

type AgendaSidebarProps = {
  events: AgendaEvent[];
  teams: AgendaTeam[];
  currentDate: Date;
};

function isSameDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

export function AgendaSidebar({
  events,
  teams,
  currentDate,
}: AgendaSidebarProps) {
  const todayEvents = events
    .filter((event) =>
      isSameDay(new Date(event.startAt), currentDate),
    )
    .sort(
      (first, second) =>
        new Date(first.startAt).getTime() -
        new Date(second.startAt).getTime(),
    );

  const urgentEvents = events.filter(
    (event) =>
      event.priority === "URGENT" || event.priority === "HIGH",
  );

  const availableTeams = teams.filter(
    (team) => team.status === "AVAILABLE",
  ).length;

  return (
    <aside className="space-y-3 xl:sticky xl:top-3">
      <Card className="rounded-[var(--radius-card)] border-border bg-card shadow-xs">
        <CardHeader className="border-b border-border px-3 py-2.5">
          <SectionHeader
            compact
            eyebrow="Resumo do dia"
            title="Programação"
            actions={
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
              <CalendarClock className="h-5 w-5" aria-hidden="true" />
              </div>
            }
          />
        </CardHeader>

        <CardContent className="grid grid-cols-3 gap-1.5 p-2.5">
          <div className="rounded-lg bg-muted/60 p-2 text-center">
            <p className="text-xl font-bold text-foreground">
              {todayEvents.length}
            </p>
            <p className="mt-1 text-[0.65rem] text-muted-foreground">
              Eventos
            </p>
          </div>

          <div className="rounded-lg bg-muted/60 p-2 text-center">
            <p className="text-xl font-bold text-foreground">
              {urgentEvents.length}
            </p>
            <p className="mt-1 text-[0.65rem] text-muted-foreground">
              Prioridades
            </p>
          </div>

          <div className="rounded-lg bg-muted/60 p-2 text-center">
            <p className="text-xl font-bold text-foreground">
              {availableTeams}
            </p>
            <p className="mt-1 text-[0.65rem] text-muted-foreground">
              Disponíveis
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[var(--radius-card)] border-border bg-card shadow-xs">
        <CardHeader className="border-b border-border px-3 py-2.5">
          <SectionHeader compact title="Próximos atendimentos" />
        </CardHeader>

        <CardContent className="divide-y divide-border px-3 py-0.5">
          {todayEvents.length > 0 ? (
            todayEvents.map((event) => (
              <article
                key={event.id}
                className="flex gap-2 py-2.5 last:pb-2.5"
              >
                <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-foreground">
                  {timeFormatter.format(new Date(event.startAt))}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {event.title}
                  </p>

                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {event.customer}
                  </p>

                  <p className="mt-1 flex items-center gap-1 text-[0.68rem] text-muted-foreground">
                    <Clock3 className="h-3 w-3" aria-hidden="true" />
                    Até {timeFormatter.format(new Date(event.endAt))}
                  </p>
                </div>
              </article>
            ))
          ) : (
            <EmptyState
              size="compact"
              className="my-2 min-h-32 border-0 bg-transparent"
              icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
              title="Nenhum atendimento"
              description="Não existem eventos para esta data."
            />
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[var(--radius-card)] border-border bg-card shadow-xs">
        <CardHeader className="border-b border-border px-3 py-2.5">
          <SectionHeader
            compact
            title="Equipes"
            actions={<UsersRound className="h-5 w-5 text-muted-foreground" aria-hidden="true" />}
          />
        </CardHeader>

        <CardContent className="divide-y divide-border px-3 py-0.5">
          {teams.map((team) => {
            const status = teamStatusConfig[team.status];

            return (
              <article
                key={team.id}
                className="flex items-start gap-2 py-2.5 last:pb-2.5"
              >
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <UserRoundCheck className="h-5 w-5" aria-hidden="true" />

                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card",
                      status.dotClass,
                    )}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {team.name}
                    </p>

                    <Badge variant={status.variant}>
                      {status.label}
                    </Badge>
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {team.specialty}
                  </p>

                  {team.nextAvailability && (
                    <p className="mt-1 text-[0.68rem] text-muted-foreground">
                      Livre em{" "}
                      {dateFormatter.format(
                        new Date(team.nextAvailability),
                      )}{" "}
                      às{" "}
                      {timeFormatter.format(
                        new Date(team.nextAvailability),
                      )}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </CardContent>
      </Card>

      {urgentEvents.length > 0 && (
        <div className="rounded-[var(--radius-card)] border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden="true"
            />

            <div>
              <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Atenção à programação
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-300">
                Existem {urgentEvents.length} atendimento(s) com prioridade
                alta ou urgente.
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
