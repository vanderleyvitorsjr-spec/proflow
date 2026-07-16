export const sumMoney = (values: number[]) =>
  values.reduce((sum, value) => sum + value, 0);
export const averageMoney = (values: number[]) =>
  values.length ? Math.round(sumMoney(values) / values.length) : undefined;
export const weightedAverage = (values: { value: number; weight: number }[]) => {
  const weight = values.reduce((sum, item) => sum + item.weight, 0);
  return weight
    ? values.reduce((sum, item) => sum + item.value * item.weight, 0) / weight
    : undefined;
};
export const averageDuration = (values: (number | undefined)[]) => {
  const valid = values.filter((value): value is number => value !== undefined);
  return valid.length
    ? valid.reduce((sum, value) => sum + value, 0) / valid.length
    : undefined;
};
export function countBy<T>(values: T[], key: (value: T) => string) {
  const result: Record<string, number> = {};
  for (const value of values)
    result[key(value) || "Não informado"] =
      (result[key(value) || "Não informado"] ?? 0) + 1;
  return result;
}
export function groupBy<T>(values: T[], key: (value: T) => string) {
  const result = new Map<string, T[]>();
  for (const value of values) {
    const group = key(value) || "Não informado";
    result.set(group, [...(result.get(group) ?? []), value]);
  }
  return result;
}
export const ranking = (record: Record<string, number>) =>
  Object.entries(record).sort((a, b) => b[1] - a[1]);
export const topN = <T>(values: T[], count: number, score: (value: T) => number) =>
  [...values].sort((a, b) => score(b) - score(a)).slice(0, count);
export const bottomN = <T>(values: T[], count: number, score: (value: T) => number) =>
  [...values].sort((a, b) => score(a) - score(b)).slice(0, count);
export const uniqueCount = <T>(values: T[], key: (value: T) => string) =>
  new Set(values.map(key).filter(Boolean)).size;
export const safeRatio = (
  numerator: number | undefined,
  denominator: number | undefined,
) =>
  numerator === undefined || denominator === undefined || denominator === 0
    ? undefined
    : numerator / denominator;
