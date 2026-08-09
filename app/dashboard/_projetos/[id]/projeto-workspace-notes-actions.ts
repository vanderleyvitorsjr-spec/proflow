"use client";

import { projetoWorkspaceNotesService } from "./projeto-workspace-notes-service";

export const listProjetoWorkspaceNotesAction = (serviceOrderId: string) =>
  Promise.resolve(projetoWorkspaceNotesService.list(serviceOrderId));
export const listAllProjetoWorkspaceNotesAction = () =>
  Promise.resolve(projetoWorkspaceNotesService.listAll());

export const addProjetoWorkspaceNoteAction = (
  serviceOrderId: string,
  text: string,
) => Promise.resolve(projetoWorkspaceNotesService.add(serviceOrderId, text));

export const pinProjetoWorkspaceNoteAction = (
  serviceOrderId: string,
  noteId: string,
  pinned: boolean,
) =>
  Promise.resolve(
    projetoWorkspaceNotesService.pin(serviceOrderId, noteId, pinned),
  );
