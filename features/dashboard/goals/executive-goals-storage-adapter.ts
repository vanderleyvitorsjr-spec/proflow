"use client";

import { scopedBrowserStorageKey } from "@/lib/storage/company-storage-key";
import { emptyExecutiveGoals, type ExecutiveGoalsEnvelope } from "./executive-goals-domain";

const key = () => scopedBrowserStorageKey("metas-executivas", 1);
export const executiveGoalsStorageAdapter = {
  load(): ExecutiveGoalsEnvelope {
    const raw = localStorage.getItem(key());
    if (!raw) return emptyExecutiveGoals();
    try {
      const parsed = JSON.parse(raw) as Partial<ExecutiveGoalsEnvelope>;
      return parsed.version === 1 && Array.isArray(parsed.goals)
        ? { version: 1, goals: parsed.goals }
        : emptyExecutiveGoals();
    } catch {
      return emptyExecutiveGoals();
    }
  },
  save(value: ExecutiveGoalsEnvelope) {
    localStorage.setItem(key(), JSON.stringify(value));
  },
};
