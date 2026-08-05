"use client";

import { readRemoteModuleState, writeRemoteModuleState } from "@/lib/module-state/remote-module-state";
import { emptyDocuments, type DocumentsEnvelope } from "./documentos-domain";

export const documentsStorageAdapter = {
  async load(): Promise<DocumentsEnvelope> {
    const value = await readRemoteModuleState<DocumentsEnvelope>("documentos", emptyDocuments());
    return value.version === 1 && Array.isArray(value.documents) ? value : emptyDocuments();
  },
  async save(value: DocumentsEnvelope) {
    await writeRemoteModuleState("documentos", value);
  },
};
