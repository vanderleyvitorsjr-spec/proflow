"use client";

import { scopedBrowserStorageKey } from "@/lib/storage/company-storage-key";
import {
  emptyWorkspaceNotes,
  type WorkspaceNotesEnvelope,
} from "./projeto-workspace-notes-domain";

const storageKey = () => scopedBrowserStorageKey("workspace-observacoes", 1);

export const projetoWorkspaceNotesStorageAdapter = {
  load(): WorkspaceNotesEnvelope {
    const raw = window.localStorage.getItem(storageKey());
    if (!raw) return emptyWorkspaceNotes();
    try {
      const value = JSON.parse(raw) as Partial<WorkspaceNotesEnvelope>;
      return value.version === 1 && Array.isArray(value.notes)
        ? { version: 1, notes: value.notes }
        : emptyWorkspaceNotes();
    } catch {
      return emptyWorkspaceNotes();
    }
  },
  save(value: WorkspaceNotesEnvelope) {
    window.localStorage.setItem(storageKey(), JSON.stringify(value));
  },
};
