"use client";

import { readRemoteModuleState, writeRemoteModuleState } from "@/lib/module-state/remote-module-state";
import { emptyWorkspaceOperations, type WorkspaceOperationsEnvelope } from "./workspace-operations-domain";

export const workspaceOperationsStorageAdapter = {
  async load(): Promise<WorkspaceOperationsEnvelope> {
    const value = await readRemoteModuleState<Partial<WorkspaceOperationsEnvelope>>(
      "workspace-operacional",
      emptyWorkspaceOperations(),
    );
    return value.version === 1
      ? ({ ...emptyWorkspaceOperations(), ...value } as WorkspaceOperationsEnvelope)
      : emptyWorkspaceOperations();
  },

  async save(value: WorkspaceOperationsEnvelope) {
    await writeRemoteModuleState("workspace-operacional", value);
  },
};
