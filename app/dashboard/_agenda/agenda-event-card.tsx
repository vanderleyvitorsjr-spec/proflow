import Link from "next/link";
import { CalendarClock, ClipboardList, MapPin, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type {
  AgendaEvent,
  AgendaEventPriority,
  AgendaEventStatus,
  AgendaEventType,
} from "./agenda-data";

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

const typeConfig: Record<
  AgendaEventType,
  {
    label: string;
    className: string;
  }
> = {
  INSTALLATION: {
    label: "Instalação",
    className:
      "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
  },
  PREVENTIVE: {
    label: "Preventiva",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  CORRECTIVE: {
    label: "Corretiva",
    className:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
  },
  ELECTRICAL: {
    label: "Elétrica",
    className:
      "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300",
  },
  TECHNICAL_VISIT: {
    label: "Visita técnica",
    className:
      "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
  },
  BUDGET: {
    label: "Orçamento",
    className:
      "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800 dark:border-fuchsia-500/20 dark:bg-fuchsia-500/10 dark:text-fuchsia-300",
  },
  MEETING: {
    label: "Reunião",
    className:
      "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
};

const statusConfig: Record<
  AgendaEventStatus,
  {
    label: string;
    variant: "default" | "success" | "warning" | "neutral" | "destructive" | "info";
  }
> = {
  CONFIRMED: {
    label: "Confirmado",
    variant: "success",
  },
  IN_TRANSIT: {
    label: "Em deslocamento",
    variant: "info",
  },
  IN_PROGRESS: {
    label: "Em andamento",
    variant: "warning",
  },
  PENDING: {
    label: "Pendente",
    variant: "neutral",
  },
  COMPLETED: {
    label: "Concluído",
    variant: "success",
  },
  CANCELED: {
    label: "Cancelado",
    variant: "destructive",
  },
};

const priorityConfig: Record<
  AgendaEventPriority,
  {
    label: string;
    className: string;
  }
> = {
  LOW: {
    label: "Baixa",
    className: "text-slate-500",
  },
  NORMAL: {
    label: "Normal",
    className: "text-sky-600 dark:text-sky-400",
  },
  HIGH: {
    label: "Alta",
    className: "text-amber-600 dark:text-amber-400",
  },
  URGENT: {
    label: "Urgente",
    className: "text-rose-600 dark:text-rose-400",
  },
};

function formatTime(value: string) {
  return timeFormatter.format(new Date(value));
}

type AgendaEventCardProps = {
  event: AgendaEvent;
  compact?: boolean;
  draggable?: boolean;
};

export function AgendaEventCard({
  event,
  compact = false,
  draggable = false,
}: AgendaEventCardProps) {
  const eventType = typeConfig[event.type];
  const status = statusConfig[event.status];
  const priority = priorityConfig[event.priority];

  return (
    <Link
      href={`/dashboard/agenda/${event.id}`}
      draggable={draggable}
      onDragStart={(dragEvent) => {
        dragEvent.dataTransfer.setData("application/x-proflow-agenda-event", event.id);
        dragEvent.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "rounded-lg border p-2 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-sm",
        eventType.className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[0.68rem] font-bold">
            <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
            {formatTime(event.startAt)} – {formatTime(event.endAt)}
          </div>

          <h4 className="mt-1 line-clamp-2 text-xs font-bold">{event.title}</h4>

          <p className="mt-1 truncate text-xs opacity-80">{event.customer}</p>
        </div>

        {!compact && <Badge variant={status.variant}>{status.label}</Badge>}
      </div>

      {!compact && (
        <>
          <div className="mt-2 space-y-1 border-t border-current/10 pt-2 text-[0.68rem] opacity-80">
            <p className="flex items-center gap-1.5">
              <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="truncate">{event.technician}</span>
            </p>

            <p className="flex items-start gap-1.5">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>
                {event.city}, {event.state}
              </span>
            </p>

            {event.serviceOrderNumber && (
              <Link
                href={`/dashboard/ordens`}
                className="flex items-center gap-1.5 font-semibold hover:underline"
              >
                <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
                {event.serviceOrderNumber}
              </Link>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[0.68rem] font-bold">{eventType.label}</span>

            <span className={cn("text-[0.68rem] font-bold", priority.className)}>
              Prioridade {priority.label.toLowerCase()}
            </span>
          </div>
        </>
      )}
    </Link>
  );
}
