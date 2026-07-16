import { safeRatio } from "./aggregation-engine";
export const conversion = (converted?: number, cohort?: number) => {
  const value = safeRatio(converted, cohort);
  return value === undefined ? undefined : value * 100;
};
export const averageTicket = (value?: number, count?: number) => safeRatio(value, count);
export const margin = (result?: number, revenue?: number) => {
  const value = safeRatio(result, revenue);
  return value === undefined ? undefined : value * 100;
};
export const delinquency = (overdue?: number, received?: number) =>
  overdue === undefined || received === undefined
    ? undefined
    : safeRatio(overdue, overdue + received);
export const productivity = (completed?: number, scheduled?: number) => {
  const value = safeRatio(completed, scheduled);
  return value === undefined ? undefined : value * 100;
};
export const deadlineCompliance = (onTime?: number, completed?: number) => {
  const value = safeRatio(onTime, completed);
  return value === undefined ? undefined : value * 100;
};
export const inventoryTurnover = (
  consumptionCost?: number,
  averageInventoryValue?: number,
) => safeRatio(consumptionCost, averageInventoryValue);
export const depreciationValue = (acquisition?: number, current?: number) =>
  acquisition === undefined || current === undefined
    ? undefined
    : Math.max(0, acquisition - current);
export const profit = (price?: number, cost?: number) =>
  price === undefined || cost === undefined ? undefined : price - cost;
export const result = (income?: number, expense?: number, investment = 0) =>
  income === undefined || expense === undefined
    ? undefined
    : income - expense - investment;
