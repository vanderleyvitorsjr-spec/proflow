import type {
  ChartDataset,
  DateRange,
  RankingItem,
  ReportMetric,
  ReportSource,
  ReportTrend,
} from "../relatorios-types";
import { compare } from "./comparison-engine";
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
export type MetricFormat = "currency" | "number" | "percentage" | "hours";
export const formatMetric = (value: number | undefined, format: MetricFormat) =>
  value === undefined
    ? "Indisponível"
    : format === "currency"
      ? money.format(value)
      : format === "percentage"
        ? `${percent.format(value)}%`
        : format === "hours"
          ? `${number.format(value)} h`
          : number.format(value);
export const toReais = (cents: number | undefined) =>
  cents === undefined ? undefined : cents / 100;
export function metric(input: {
  id: string;
  title: string;
  current?: number;
  previous?: number;
  format?: MetricFormat;
  source: ReportSource[];
  description: string;
  inverse?: boolean;
  link?: string;
  partial?: boolean;
}): ReportMetric {
  const change = compare(input.current, input.previous);
  return {
    id: input.id,
    title: input.title,
    value: input.current,
    formattedValue: formatMetric(input.current, input.format ?? "number"),
    previousValue: input.previous,
    absoluteChange: change.absoluteChange,
    percentageChange: change.percentageChange,
    trend: change.trend,
    inverse: input.inverse,
    source: input.source,
    status:
      input.current === undefined
        ? "UNAVAILABLE"
        : input.partial
          ? "PARTIAL"
          : "AVAILABLE",
    description: input.description,
    link: input.link,
  };
}
export const rankingItems = (
  entries: [string, number][],
  format: MetricFormat = "number",
  link?: string,
): RankingItem[] =>
  entries
    .slice(0, 8)
    .map(([label, value], index) => ({
      id: `${index}-${label}`,
      label,
      value,
      formattedValue: formatMetric(value, format),
      link,
    }));
export const chart = (
  id: string,
  title: string,
  labels: string[],
  series: { name: string; values: number[] }[],
  unit: ChartDataset["unit"],
  source: ReportSource[],
  partial = false,
): ChartDataset => ({
  id,
  title,
  labels,
  series,
  unit,
  currency: unit === "currency" ? "BRL" : undefined,
  percentage: unit === "percentage",
  source,
  empty:
    labels.length === 0 ||
    series.every((item) => item.values.every((value) => value === 0)),
  partial,
});
export const monthsInRange = (range: DateRange) => {
  const keys: string[] = [],
    cursor = new Date(`${range.start.slice(0, 7)}-01T12:00:00`),
    end = new Date(`${range.end.slice(0, 7)}-01T12:00:00`);
  while (cursor <= end) {
    keys.push(
      `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`,
    );
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return keys;
};
export const displayTrend = (trend: ReportTrend) =>
  trend === "NOT_COMPARABLE"
    ? "Sem base comparável"
    : trend === "INSUFFICIENT_DATA"
      ? "Dados insuficientes"
      : trend;
