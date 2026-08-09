"use client";
import { documentsService } from "./documentos-service";
export const listDocumentsAction = (filters?: Parameters<typeof documentsService.list>[0]) => Promise.resolve(documentsService.list(filters));
export const registerDocumentMetadataAction = (input: Parameters<typeof documentsService.register>[0]) => Promise.resolve(documentsService.register(input));
export const archiveDocumentAction = (id: string) => Promise.resolve(documentsService.archive(id));
