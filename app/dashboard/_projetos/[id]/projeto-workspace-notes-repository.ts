"use client";

import { projetoWorkspaceNotesStorageAdapter } from "./projeto-workspace-notes-storage-adapter";
import type { WorkspaceNotesEnvelope } from "./projeto-workspace-notes-domain";

export const projetoWorkspaceNotesRepository = {
  get: () => projetoWorkspaceNotesStorageAdapter.load(),
  save: (value: WorkspaceNotesEnvelope) =>
    projetoWorkspaceNotesStorageAdapter.save(value),
};
