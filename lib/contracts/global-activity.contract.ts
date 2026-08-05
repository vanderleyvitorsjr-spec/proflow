export type GlobalActivityStatus = "RECORDED" | "SNOOZED" | "RESOLVED" | "REOPENED" | "HIDDEN";
export type GlobalActivity={id:string;source:string;sourceId:string;sourceLabel:string;type:string;title:string;description?:string;occurredAt:string;actorName?:string;responsibleName?:string;clientId?:string;serviceOrderId?:string;priority?:string;entity?:string;entityId?:string;origin?:string;status?:GlobalActivityStatus;metadata?:Record<string,string|number|boolean>;link?:string};
export type GlobalSearchResult={id:string;source:string;title:string;description:string;link:string;keywords:string};

export function uniqueGlobalActivities(items: GlobalActivity[]) {
  return [...new Map(items.map((item) => [item.id, item])).values()].sort((a, b) =>
    b.occurredAt.localeCompare(a.occurredAt),
  );
}

export function filterGlobalActivities(
  items: GlobalActivity[],
  filters: { search?: string; source?: string; startDate?: string; endDate?: string; responsible?: string },
) {
  const search = filters.search?.trim().toLocaleLowerCase("pt-BR");
  return items.filter((item) =>
    (!filters.source || filters.source === "ALL" || item.source === filters.source) &&
    (!filters.startDate || item.occurredAt.slice(0, 10) >= filters.startDate) &&
    (!filters.endDate || item.occurredAt.slice(0, 10) <= filters.endDate) &&
    (!filters.responsible || item.responsibleName === filters.responsible) &&
    (!search || `${item.title} ${item.description ?? ""} ${item.sourceLabel}`.toLocaleLowerCase("pt-BR").includes(search)),
  );
}

export function activityDateGroup(value: string, now = new Date()) {
  const date = new Date(value);
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const yesterday = new Date(start); yesterday.setDate(yesterday.getDate() - 1);
  const week = new Date(start); week.setDate(week.getDate() - 7);
  if (date >= start) return "Hoje";
  if (date >= yesterday) return "Ontem";
  if (date >= week) return "Esta Semana";
  return new Intl.DateTimeFormat("pt-BR").format(date);
}
