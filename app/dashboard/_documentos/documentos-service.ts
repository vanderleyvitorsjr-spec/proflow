"use client";
import { filterDocuments, registerDocumentMetadata, type DocumentMetadata } from "./documentos-domain";
import { documentsRepository } from "./documentos-repository";
export const documentsService = {
  list: (filters?: Parameters<typeof filterDocuments>[1]) => filterDocuments(documentsRepository.read().documents, filters ?? {}),
  register(input: Omit<DocumentMetadata, "id" | "generatedAt">) { const next = registerDocumentMetadata(documentsRepository.read(), input); documentsRepository.save(next); return next.documents[0]!; },
  archive(id: string) { const state = documentsRepository.read(), current = state.documents.find((item) => item.id === id); if (!current) throw new Error("Documento não encontrado."); const updated = { ...current, status: "ARCHIVED" as const }; documentsRepository.save({ ...state, documents: state.documents.map((item) => item.id === id ? updated : item) }); return updated; },
};
