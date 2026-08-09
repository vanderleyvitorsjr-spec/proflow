"use client";
import { scopedBrowserStorageKey } from "@/lib/storage/company-storage-key";
import { emptyWorkspaceOperations, type WorkspaceOperationsEnvelope } from "./workspace-operations-domain";
const key = () => scopedBrowserStorageKey("workspace-operacional", 1);
export const workspaceOperationsStorageAdapter = {
  load(): WorkspaceOperationsEnvelope {
    const raw = localStorage.getItem(key());
    if (!raw) return emptyWorkspaceOperations();
    try {
      const value = JSON.parse(raw) as Partial<WorkspaceOperationsEnvelope>;
      return value.version === 1 ? { ...emptyWorkspaceOperations(), ...value } as WorkspaceOperationsEnvelope : emptyWorkspaceOperations();
    } catch { return emptyWorkspaceOperations(); }
  },
  save(value: WorkspaceOperationsEnvelope) { localStorage.setItem(key(), JSON.stringify(value)); },
};
