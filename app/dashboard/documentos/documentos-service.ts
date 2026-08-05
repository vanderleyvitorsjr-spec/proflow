"use client";
import { filterDocuments, registerDocumentMetadata, type DocumentMetadata } from "./documentos-domain";
import { documentsRepository } from "./documentos-repository";
export const documentsService = {
  async list(filters?: Parameters<typeof filterDocuments>[1]) {
    return filterDocuments((await documentsRepository.read()).documents, filters ?? {});
  },
  async register(input: Omit<DocumentMetadata, "id" | "generatedAt">) {
    const next = registerDocumentMetadata(await documentsRepository.read(), input);
    await documentsRepository.save(next);
    return next.documents[0]!;
  },
  async archive(id: string) {
    const state = await documentsRepository.read();
    const current = state.documents.find((item) => item.id === id);
    if (!current) throw new Error("Documento não encontrado.");
    const updated = { ...current, status: "ARCHIVED" as const };
    await documentsRepository.save({ ...state, documents: state.documents.map((item) => item.id === id ? updated : item) });
    return updated;
  },
};
