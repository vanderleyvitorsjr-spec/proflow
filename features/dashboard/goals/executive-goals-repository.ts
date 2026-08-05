"use client";

import { executiveGoalsStorageAdapter } from "./executive-goals-storage-adapter";
import type { ExecutiveGoalsEnvelope } from "./executive-goals-domain";

export const executiveGoalsRepository = {
  get: () => executiveGoalsStorageAdapter.load(),
  save: (value: ExecutiveGoalsEnvelope) => executiveGoalsStorageAdapter.save(value),
};
