import type { DateRange, ReportFilter, ReportPeriodPreset } from "../relatorios-types";
const iso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const validDate = (value?: string) =>
  Boolean(value && !Number.isNaN(new Date(`${value.slice(0, 10)}T12:00:00`).getTime()));
export const inPeriod = (value: string | undefined, range: DateRange) =>
  Boolean(
    value &&
    validDate(value) &&
    value.slice(0, 10) >= range.start &&
    value.slice(0, 10) <= range.end,
  );
export function rangeForPreset(
  preset: ReportPeriodPreset,
  now = new Date(),
  custom?: DateRange,
): DateRange {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    start = new Date(end);
  if (preset === "CUSTOM" && custom && validDate(custom.start) && validDate(custom.end))
    return custom.start <= custom.end ? custom : { start: custom.end, end: custom.start };
  if (preset === "LAST_7_DAYS") start.setDate(start.getDate() - 6);
  else if (preset === "LAST_30_DAYS") start.setDate(start.getDate() - 29);
  else if (preset === "CURRENT_MONTH") start.setDate(1);
  else if (preset === "PREVIOUS_MONTH") {
    start.setMonth(start.getMonth() - 1, 1);
    end.setDate(0);
  } else if (preset === "CURRENT_QUARTER")
    start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1);
  else if (preset === "CURRENT_YEAR") start.setMonth(0, 1);
  return { start: iso(start), end: iso(end) };
}
export function previousEquivalent(range: DateRange): DateRange {
  const start = new Date(`${range.start}T12:00:00`),
    end = new Date(`${range.end}T12:00:00`),
    days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  const previousEnd = new Date(start);
  previousEnd.setDate(previousEnd.getDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - days + 1);
  return { start: iso(previousStart), end: iso(previousEnd) };
}
export function comparisonRange(
  filters: ReportFilter,
  period: DateRange,
): DateRange | undefined {
  if (filters.comparison === "NONE") return undefined;
  if (
    filters.comparison === "CUSTOM" &&
    validDate(filters.comparisonStartDate) &&
    validDate(filters.comparisonEndDate)
  )
    return rangeForPreset("CUSTOM", new Date(), {
      start: filters.comparisonStartDate,
      end: filters.comparisonEndDate,
    });
  return previousEquivalent(period);
}
export const durationMinutes = (start?: string, end?: string) => {
  const a = start ? new Date(start).getTime() : NaN,
    b = end ? new Date(end).getTime() : NaN;
  return Number.isFinite(a) && Number.isFinite(b) && b >= a ? (b - a) / 60000 : undefined;
};
export const monthKey = (value: string) => value.slice(0, 7);
export const dayKey = (value: string) => (validDate(value) ? value.slice(0, 10) : "");
export const yearKey = (value: string) => (validDate(value) ? value.slice(0, 4) : "");
export const quarterKey = (value: string) => {
  if (!validDate(value)) return "";
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return `${date.getFullYear()}-T${Math.floor(date.getMonth() / 3) + 1}`;
};
export const weekKey = (value: string) => {
  if (!validDate(value)) return "";
  const date = new Date(`${value.slice(0, 10)}T12:00:00`), first = new Date(date.getFullYear(), 0, 1);
  const week = Math.ceil(((date.getTime() - first.getTime()) / 86400000 + first.getDay() + 1) / 7);
  return `${date.getFullYear()}-S${String(week).padStart(2, "0")}`;
};
export function groupDates<T>(values: T[], date: (value: T) => string, granularity: "day" | "week" | "month" | "quarter" | "year") {
  const key = granularity === "day" ? dayKey : granularity === "week" ? weekKey : granularity === "month" ? monthKey : granularity === "quarter" ? quarterKey : yearKey;
  return values.reduce<Record<string, T[]>>((groups, item) => { const group = key(date(item)); if (group) groups[group] = [...(groups[group] ?? []), item]; return groups; }, {});
}
export const monthLabel = (key: string) =>
  new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(
    new Date(`${key}-15T12:00:00`),
  );
