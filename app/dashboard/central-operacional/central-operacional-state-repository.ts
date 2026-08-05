"use client";

import { centralOperationalStateStorageAdapter } from "./central-operacional-state-storage-adapter";
import type { OperationalStateEnvelope } from "./central-operacional-state";

export const centralOperationalStateRepository = {
  get: () => centralOperationalStateStorageAdapter.load(),
  save: (value: OperationalStateEnvelope) =>
    centralOperationalStateStorageAdapter.save(value),
};
