"use client";
import { documentsService } from "./documentos-service";
export const listDocumentsAction = (filters?: Parameters<typeof documentsService.list>[0]) => documentsService.list(filters);
export const registerDocumentMetadataAction = (input: Parameters<typeof documentsService.register>[0]) => documentsService.register(input);
export const archiveDocumentAction = (id: string) => documentsService.archive(id);
