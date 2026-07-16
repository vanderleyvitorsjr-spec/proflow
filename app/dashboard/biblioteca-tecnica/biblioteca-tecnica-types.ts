export const technicalContentTypes = ["MANUAL", "DATASHEET", "PROCEDURE", "STANDARD", "DIAGRAM", "CERTIFICATE", "WARRANTY", "TECHNICAL_REPORT", "PHOTO", "VIDEO", "SPREADSHEET", "DRAWING", "OTHER"] as const;
export const technicalStatuses = ["DRAFT", "ACTIVE", "OUTDATED", "EXPIRED", "ARCHIVED"] as const;
export type TechnicalContentType = (typeof technicalContentTypes)[number];
export type TechnicalStatus = (typeof technicalStatuses)[number];
export type TechnicalFileMetadata = { blobId: string; name: string; type: string; size: number };
export type TechnicalLinkSnapshot = { id: string; label: string; link: string };
export type TechnicalHistory = { id: string; type: string; description: string; occurredAt: string };
export type TechnicalDocument = {
  id: string; sequence: number; code: string; title: string; description: string; category: string;
  contentType: TechnicalContentType; status: TechnicalStatus; manufacturer: string; version: string; revision: number;
  tags: string[]; specialties: string[]; equipmentIds: string[]; serviceOrderIds: string[]; clientIds: string[];
  equipmentSnapshots: TechnicalLinkSnapshot[]; serviceOrderSnapshots: TechnicalLinkSnapshot[]; clientSnapshots: TechnicalLinkSnapshot[];
  favorite: boolean; accessCount: number; lastAccessedAt?: string; issuedAt?: string; expiresAt?: string;
  fileMetadata?: TechnicalFileMetadata; externalReference?: string; notes: string; createdAt: string; updatedAt: string;
  archivedAt?: string; history: TechnicalHistory[];
};
export type TechnicalDocumentInput = Omit<TechnicalDocument, "id" | "sequence" | "code" | "revision" | "favorite" | "accessCount" | "lastAccessedAt" | "createdAt" | "updatedAt" | "archivedAt" | "history" | "fileMetadata">;
export type TechnicalLibraryState = { version: 1; revision: number; sequence: number; documents: TechnicalDocument[] };
