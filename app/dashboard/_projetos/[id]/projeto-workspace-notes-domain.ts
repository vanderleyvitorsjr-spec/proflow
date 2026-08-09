export type WorkspaceNote = {
  id: string;
  serviceOrderId: string;
  text: string;
  pinned: boolean;
  createdAt: string;
};

export type WorkspaceNotesEnvelope = {
  version: 1;
  notes: WorkspaceNote[];
};

export const emptyWorkspaceNotes = (): WorkspaceNotesEnvelope => ({
  version: 1,
  notes: [],
});

export function addWorkspaceNote(
  envelope: WorkspaceNotesEnvelope,
  input: {
    id: string;
    serviceOrderId: string;
    text: string;
    createdAt: string;
  },
): WorkspaceNotesEnvelope {
  const text = input.text.trim();
  if (text.length < 3)
    throw new Error("Escreva uma observação com pelo menos 3 caracteres.");
  return {
    version: 1,
    notes: [
      ...envelope.notes,
      { ...input, text, pinned: false },
    ],
  };
}

export function pinWorkspaceNote(
  envelope: WorkspaceNotesEnvelope,
  noteId: string,
  pinned: boolean,
): WorkspaceNotesEnvelope {
  return {
    version: 1,
    notes: envelope.notes.map((note) =>
      note.id === noteId ? { ...note, pinned } : note,
    ),
  };
}

export function workspaceNotesForOrder(
  envelope: WorkspaceNotesEnvelope,
  serviceOrderId: string,
) {
  return envelope.notes
    .filter((note) => note.serviceOrderId === serviceOrderId)
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        b.createdAt.localeCompare(a.createdAt),
    );
}
