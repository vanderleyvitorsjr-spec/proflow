"use client";
import { documentsStorageAdapter } from "./documentos-storage-adapter";
import type { DocumentsEnvelope } from "./documentos-domain";
export const documentsRepository = {
  read: () => documentsStorageAdapter.load(),
  async save(value: DocumentsEnvelope) { await documentsStorageAdapter.save(value); return value; },
};
