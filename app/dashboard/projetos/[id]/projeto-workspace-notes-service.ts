"use client";

import {
  addWorkspaceNote,
  pinWorkspaceNote,
  workspaceNotesForOrder,
} from "./projeto-workspace-notes-domain";
import { projetoWorkspaceNotesRepository } from "./projeto-workspace-notes-repository";

export const projetoWorkspaceNotesService = {
  listAll() {
    return projetoWorkspaceNotesRepository.get().notes;
  },
  list(serviceOrderId: string) {
    return workspaceNotesForOrder(
      projetoWorkspaceNotesRepository.get(),
      serviceOrderId,
    );
  },
  add(serviceOrderId: string, text: string) {
    const now = new Date().toISOString();
    const next = addWorkspaceNote(projetoWorkspaceNotesRepository.get(), {
      id: `workspace-note-${crypto.randomUUID()}`,
      serviceOrderId,
      text,
      createdAt: now,
    });
    projetoWorkspaceNotesRepository.save(next);
    return workspaceNotesForOrder(next, serviceOrderId);
  },
  pin(serviceOrderId: string, noteId: string, pinned: boolean) {
    const next = pinWorkspaceNote(
      projetoWorkspaceNotesRepository.get(),
      noteId,
      pinned,
    );
    projetoWorkspaceNotesRepository.save(next);
    return workspaceNotesForOrder(next, serviceOrderId);
  },
};
