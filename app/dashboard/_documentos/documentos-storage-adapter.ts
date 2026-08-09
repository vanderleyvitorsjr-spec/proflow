"use client";
import { scopedBrowserStorageKey } from "@/lib/storage/company-storage-key";
import { emptyDocuments, type DocumentsEnvelope } from "./documentos-domain";
const key = () => scopedBrowserStorageKey("documentos", 1);
export const documentsStorageAdapter = {
  load(): DocumentsEnvelope { const raw = localStorage.getItem(key()); if (!raw) return emptyDocuments(); try { const value = JSON.parse(raw) as DocumentsEnvelope; return value.version === 1 && Array.isArray(value.documents) ? value : emptyDocuments(); } catch { return emptyDocuments(); } },
  save(value: DocumentsEnvelope) { localStorage.setItem(key(), JSON.stringify(value)); },
};
