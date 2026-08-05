"use client";

import { normalizeProperName } from "@/lib/br-formatters";
import {
  createGoal,
  duplicateGoal,
  updateGoal,
  type ExecutiveGoal,
} from "./executive-goals-domain";
import { executiveGoalsRepository } from "./executive-goals-repository";

const persist = (goals: ExecutiveGoal[]) => {
  executiveGoalsRepository.save({ version: 1, goals });
  return goals;
};
export const executiveGoalsService = {
  list: () => executiveGoalsRepository.get().goals,
  create(input: Parameters<typeof createGoal>[0]) {
    const now = new Date().toISOString();
    const goal = createGoal({ ...input, name: normalizeProperName(input.name) }, now);
    return persist([...this.list(), goal]);
  },
  update(id: string, changes: Parameters<typeof updateGoal>[1]) {
    const goals = this.list();
    const current = goals.find((goal) => goal.id === id);
    if (!current) throw new Error("Meta não encontrada.");
    const normalized = changes.name
      ? { ...changes, name: normalizeProperName(changes.name) }
      : changes;
    return persist(goals.map((goal) =>
      goal.id === id ? updateGoal(current, normalized, new Date().toISOString()) : goal,
    ));
  },
  remove(id: string) {
    return persist(this.list().filter((goal) => goal.id !== id));
  },
  duplicate(id: string) {
    const goals = this.list();
    const current = goals.find((goal) => goal.id === id);
    if (!current) throw new Error("Meta não encontrada.");
    return persist([
      ...goals,
      duplicateGoal(current, `goal-${crypto.randomUUID()}`, new Date().toISOString()),
    ]);
  },
};
