"use client";

import { executiveGoalsService } from "./executive-goals-service";
import type { ExecutiveGoal } from "./executive-goals-domain";

export const listExecutiveGoalsAction = () => Promise.resolve(executiveGoalsService.list());
export const createExecutiveGoalAction = (
  input: Parameters<typeof executiveGoalsService.create>[0],
) => Promise.resolve(executiveGoalsService.create(input));
export const updateExecutiveGoalAction = (
  id: string,
  changes: Partial<Pick<ExecutiveGoal, "name" | "targetValue" | "period" | "startDate" | "endDate" | "active">>,
) => Promise.resolve(executiveGoalsService.update(id, changes));
export const deleteExecutiveGoalAction = (id: string) =>
  Promise.resolve(executiveGoalsService.remove(id));
export const duplicateExecutiveGoalAction = (id: string) =>
  Promise.resolve(executiveGoalsService.duplicate(id));
