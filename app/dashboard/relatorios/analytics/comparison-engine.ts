import type { ReportTrend } from "../relatorios-types";
export type Comparison = {
  current?: number;
  previous?: number;
  absoluteChange?: number;
  percentageChange?: number;
  trend: ReportTrend;
};
export function compare(current?: number, previous?: number, tolerance = 0): Comparison {
  if (current === undefined || previous === undefined)
    return { current, previous, trend: "INSUFFICIENT_DATA" };
  const absoluteChange = current - previous;
  if (previous === 0)
    return {
      current,
      previous,
      absoluteChange,
      trend: current === 0 ? "STABLE" : "NOT_COMPARABLE",
    };
  const percentageChange = (absoluteChange / Math.abs(previous)) * 100;
  return {
    current,
    previous,
    absoluteChange,
    percentageChange,
    trend:
      Math.abs(absoluteChange) <= tolerance
        ? "STABLE"
        : absoluteChange > 0
          ? "UP"
          : "DOWN",
  };
}
