import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { AgendaEvent, AgendaView } from "./agenda-data";
import { AgendaEventCard } from "./agenda-event-card";

type AgendaCalendarProps = {
  view: AgendaView;
  currentDate: Date;
  events: AgendaEvent[];
  onReschedule?: (eventId: string, date: string, time: string) => void;
};

const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
});

const fullDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});

const timeSlots = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  const difference = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + difference);
  result.setHours(0, 0, 0, 0);

  return result;
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function isSameDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function getEventsForDate(events: AgendaEvent[], date: Date) {
  return events.filter((event) => isSameDay(new Date(event.startAt), date));
}

function DayView({
  currentDate,
  events,
  onReschedule,
}: {
  currentDate: Date;
  events: AgendaEvent[];
  onReschedule?: (eventId: string, date: string, time: string) => void;
}) {
  const dayEvents = getEventsForDate(events, currentDate);

  return (
    <Card className="overflow-hidden rounded-[var(--radius-card)] border-border bg-card shadow-xs">
      <div className="border-b border-border px-4 py-3">
        <p className="text-base font-semibold capitalize text-foreground">
          {fullDateFormatter.format(currentDate)}
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          {dayEvents.length} compromisso(s) programado(s)
        </p>
      </div>

      <div className="proflow-scrollbar max-h-[48rem] overflow-y-auto">
        {timeSlots.map((slot) => {
          const hour = Number(slot.slice(0, 2));

          const slotEvents = dayEvents.filter(
            (event) => new Date(event.startAt).getHours() === hour,
          );

          return (
            <div
              key={slot}
              className="grid min-h-20 grid-cols-[4rem_minmax(0,1fr)] border-b border-border last:border-b-0"
            >
              <div className="border-r border-border px-2.5 py-3 text-xs font-semibold text-muted-foreground">
                {slot}
              </div>

              <div
                className="p-2"
                onDragOver={(event) => {
                  if (onReschedule) {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                  }
                }}
                onDrop={(event) => {
                  const id = event.dataTransfer.getData(
                    "application/x-proflow-agenda-event",
                  );
                  if (id && onReschedule) {
                    event.preventDefault();
                    onReschedule(id, currentDate.toISOString().slice(0, 10), slot);
                  }
                }}
              >
                {slotEvents.length > 0 ? (
                  <div className="grid gap-2 xl:grid-cols-2">
                    {slotEvents.map((event) => (
                      <AgendaEventCard
                        key={event.id}
                        event={event}
                        draggable={Boolean(onReschedule)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="h-full rounded-xl border border-dashed border-transparent" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function WeekView({
  currentDate,
  events,
  onReschedule,
}: {
  currentDate: Date;
  events: AgendaEvent[];
  onReschedule?: (eventId: string, date: string, time: string) => void;
}) {
  const weekStart = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  return (
    <Card className="overflow-hidden rounded-[var(--radius-card)] border-border bg-card shadow-xs">
      <div className="proflow-scrollbar overflow-x-auto">
        <div className="min-w-[64rem]">
          <div className="grid grid-cols-[4rem_repeat(7,minmax(8rem,1fr))] border-b border-border bg-muted/35">
            <div className="border-r border-border p-3" />

            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "border-r border-border p-3 text-center last:border-r-0",
                  isSameDay(day, currentDate) && "bg-sky-500/10",
                )}
              >
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  {weekdayFormatter.format(day)}
                </p>

                <p className="mt-1 text-lg font-bold text-foreground">{day.getDate()}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[4rem_repeat(7,minmax(8rem,1fr))]">
            <div className="border-r border-border">
              {timeSlots.map((slot) => (
                <div
                  key={slot}
                  className="h-20 border-b border-border px-2.5 py-2.5 text-xs font-semibold text-muted-foreground"
                >
                  {slot}
                </div>
              ))}
            </div>

            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className="border-r border-border last:border-r-0"
              >
                {timeSlots.map((slot) => {
                  const hour = Number(slot.slice(0, 2));

                  const slotEvents = getEventsForDate(events, day).filter(
                    (event) => new Date(event.startAt).getHours() === hour,
                  );

                  return (
                    <div
                      key={`${day.toISOString()}-${slot}`}
                      className="h-20 overflow-hidden border-b border-border p-1"
                      onDragOver={(event) => {
                        if (onReschedule) {
                          event.preventDefault();
                          event.dataTransfer.dropEffect = "move";
                        }
                      }}
                      onDrop={(event) => {
                        const id = event.dataTransfer.getData(
                          "application/x-proflow-agenda-event",
                        );
                        if (id && onReschedule) {
                          event.preventDefault();
                          onReschedule(id, day.toISOString().slice(0, 10), slot);
                        }
                      }}
                    >
                      {slotEvents.map((event) => (
                        <AgendaEventCard
                          key={event.id}
                          event={event}
                          compact
                          draggable={Boolean(onReschedule)}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function MonthView({
  currentDate,
  events,
  onReschedule,
}: {
  currentDate: Date;
  events: AgendaEvent[];
  onReschedule?: (eventId: string, date: string, time: string) => void;
}) {
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  const calendarStart = startOfWeek(firstDayOfMonth);

  const calendarDays = Array.from({ length: 42 }, (_, index) =>
    addDays(calendarStart, index),
  );

  return (
    <Card className="overflow-hidden rounded-[var(--radius-card)] border-border bg-card shadow-xs">
      <div className="grid grid-cols-7 border-b border-border bg-muted/35">
        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((weekday) => (
          <div
            key={weekday}
            className="border-r border-border p-2 text-center text-xs font-bold uppercase text-muted-foreground last:border-r-0"
          >
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calendarDays.map((day) => {
          const dayEvents = getEventsForDate(events, day);
          const belongsToCurrentMonth = day.getMonth() === currentDate.getMonth();

          return (
            <div
              key={day.toISOString()}
              onDragOver={(event) => {
                if (onReschedule) {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }
              }}
              onDrop={(event) => {
                const id = event.dataTransfer.getData(
                  "application/x-proflow-agenda-event",
                );
                if (id && onReschedule) {
                  event.preventDefault();
                  const original = events.find((item) => item.id === id);
                  const time = original?.startAt.slice(11, 16) ?? "08:00";
                  onReschedule(id, day.toISOString().slice(0, 10), time);
                }
              }}
              className={cn(
                "min-h-28 border-b border-r border-border p-1.5 last:border-r-0",
                !belongsToCurrentMonth && "bg-muted/20 opacity-55",
                isSameDay(day, currentDate) && "bg-sky-500/5",
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-foreground",
                    isSameDay(day, currentDate) && "bg-sky-500 text-white",
                  )}
                >
                  {day.getDate()}
                </span>

                {dayEvents.length > 0 && (
                  <span className="text-[0.65rem] font-semibold text-muted-foreground">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <AgendaEventCard
                    key={event.id}
                    event={event}
                    compact
                    draggable={Boolean(onReschedule)}
                  />
                ))}

                {dayEvents.length > 3 && (
                  <p className="px-1 text-[0.65rem] font-semibold text-sky-600 dark:text-sky-400">
                    + {dayEvents.length - 3} evento(s)
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function AgendaCalendar({
  view,
  currentDate,
  events,
  onReschedule,
}: AgendaCalendarProps) {
  if (view === "day") {
    return (
      <DayView currentDate={currentDate} events={events} onReschedule={onReschedule} />
    );
  }

  if (view === "month") {
    return (
      <MonthView currentDate={currentDate} events={events} onReschedule={onReschedule} />
    );
  }

  return (
    <WeekView currentDate={currentDate} events={events} onReschedule={onReschedule} />
  );
}
