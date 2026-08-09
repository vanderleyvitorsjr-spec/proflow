"use client";
import { workspaceOperationsStorageAdapter } from "./workspace-operations-storage-adapter";
import type { WorkspaceOperationsEnvelope } from "./workspace-operations-domain";
export const workspaceOperationsRepository = { get: () => workspaceOperationsStorageAdapter.load(), save: (value: WorkspaceOperationsEnvelope) => workspaceOperationsStorageAdapter.save(value) };
