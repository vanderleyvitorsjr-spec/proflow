import type { ProfessionalDocumentType } from "../../../components/documents/professional-document-domain";
export interface DocumentMetadata {
  id: string; type: ProfessionalDocumentType; entity: string; entityId: string;
  number?: string; version?: number; title: string; status: "AVAILABLE" | "ARCHIVED";
  origin: string; responsible?: string; generatedAt: string; link: string;
}
export interface DocumentsEnvelope { version: 1; documents: DocumentMetadata[] }
export const emptyDocuments = (): DocumentsEnvelope => ({ version: 1, documents: [] });
export function registerDocumentMetadata(state: DocumentsEnvelope, input: Omit<DocumentMetadata, "id" | "generatedAt">, now = new Date().toISOString()) {
  const key = `${input.type}:${input.entity}:${input.entityId}:${input.version ?? 1}`;
  const existing = state.documents.find((item) => `${item.type}:${item.entity}:${item.entityId}:${item.version ?? 1}` === key);
  const document: DocumentMetadata = existing ? { ...existing, ...input, generatedAt: now } : { ...input, id: crypto.randomUUID(), generatedAt: now };
  return { version: 1 as const, documents: existing ? state.documents.map((item) => item.id === existing.id ? document : item) : [document, ...state.documents] };
}
export function filterDocuments(items: DocumentMetadata[], filters: { search?: string; type?: ProfessionalDocumentType | "ALL" }) {
  const search = filters.search?.trim().toLocaleLowerCase("pt-BR");
  return items.filter((item) => (!filters.type || filters.type === "ALL" || item.type === filters.type) && (!search || `${item.number ?? ""} ${item.title} ${item.entity}`.toLocaleLowerCase("pt-BR").includes(search)));
}
