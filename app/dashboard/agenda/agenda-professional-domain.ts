export type AgendaDomainEvent = {
  id: string;
  title: string;
  technician: string;
  startAt: string;
  endAt: string;
  status: string;
  priority?: string;
};

export type AgendaConflict = {
  firstEventId: string;
  secondEventId: string;
  technician: string;
  reason: string;
};

export function detectAgendaConflicts(
  events: AgendaDomainEvent[],
): AgendaConflict[] {
  const active = events.filter((event) => event.status !== "CANCELED");
  const conflicts: AgendaConflict[] = [];
  for (let index = 0; index < active.length; index += 1) {
    const first = active[index]!;
    for (let cursor = index + 1; cursor < active.length; cursor += 1) {
      const second = active[cursor]!;
      if (
        first.technician.trim().toLocaleLowerCase("pt-BR") !==
        second.technician.trim().toLocaleLowerCase("pt-BR")
      )
        continue;
      if (
        new Date(first.startAt).getTime() < new Date(second.endAt).getTime() &&
        new Date(first.endAt).getTime() > new Date(second.startAt).getTime()
      ) {
        conflicts.push({
          firstEventId: first.id,
          secondEventId: second.id,
          technician: first.technician,
          reason: `${first.technician} possui compromissos sobrepostos.`,
        });
      }
    }
  }
  return conflicts;
}

export function filterAgendaByPeriod(
  events: AgendaDomainEvent[],
  start: Date,
  end: Date,
) {
  const startTime = start.getTime();
  const endTime = end.getTime();
  return events.filter((event) => {
    const eventStart = new Date(event.startAt).getTime();
    const eventEnd = new Date(event.endAt).getTime();
    return eventStart < endTime && eventEnd > startTime;
  });
}

export function filterAgendaByTechnician(
  events: AgendaDomainEvent[],
  technician: string,
) {
  const normalized = technician.trim().toLocaleLowerCase("pt-BR");
  if (!normalized || normalized === "all") return events;
  return events.filter(
    (event) => event.technician.trim().toLocaleLowerCase("pt-BR") === normalized,
  );
}

export function summarizeAgendaDay(events: AgendaDomainEvent[], date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const dayEvents = filterAgendaByPeriod(events, start, end);
  return {
    total: dayEvents.length,
    completed: dayEvents.filter((event) => event.status === "COMPLETED").length,
    pending: dayEvents.filter(
      (event) => !["COMPLETED", "CANCELED"].includes(event.status),
    ).length,
    urgent: dayEvents.filter((event) => event.priority === "URGENT").length,
    conflicts: detectAgendaConflicts(dayEvents).length,
  };
}

export function moveAgendaDate(
  value: string,
  targetDate: string,
  targetTime?: string,
) {
  const source = new Date(value);
  const [year, month, day] = targetDate.split("-").map(Number);
  if (!year || !month || !day || Number.isNaN(source.getTime())) return value;
  const [hour, minute] = (targetTime ?? value.slice(11, 16)).split(":").map(Number);
  source.setFullYear(year, month - 1, day);
  source.setHours(hour ?? 0, minute ?? 0, 0, 0);
  return source.toISOString();
}
