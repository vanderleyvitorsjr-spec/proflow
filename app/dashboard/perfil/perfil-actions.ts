"use client";
import { ProfileRepository } from "./perfil-repository";
import { ProfileService } from "./perfil-service";
import { profileBlobAdapter } from "./perfil-blob-adapter";
import type { ProfileState, ProfessionalDocument } from "./perfil-types";
const service = new ProfileService(new ProfileRepository());
export const getProfileAction = () => service.list();
export const saveProfileSectionAction = <K extends keyof ProfileState>(
  key: K,
  value: ProfileState[K],
) => service.saveSection(key, value);
export const saveProfessionalDocumentAction = (
  input: Omit<ProfessionalDocument, "id" | "createdAt" | "updatedAt" | "history">,
  id?: string,
) => service.saveDocument(input, id);
export const exportProfileAction = () => service.export();
export const importProfileAction = (raw: string) => service.import(raw);
export async function saveProfileMediaAction(
  kind: "avatarMetadata" | "signatureMetadata",
  file: File,
) {
  const state = service.list(),
    old = state.profile[kind],
    metadata = await profileBlobAdapter.put(
      file,
      kind === "avatarMetadata" ? 5 * 1024 * 1024 : 3 * 1024 * 1024,
    );
  if (old) await profileBlobAdapter.remove(old.blobId);
  return service.saveSection("profile", {
    ...state.profile,
    [kind]: metadata,
    updatedAt: new Date().toISOString(),
  });
}
export async function openProfileMediaAction(id: string) {
  const blob = await profileBlobAdapter.get(id);
  return blob ? URL.createObjectURL(blob) : null;
}
export async function removeProfileMediaAction(
  kind: "avatarMetadata" | "signatureMetadata",
) {
  const state = service.list(),
    old = state.profile[kind];
  if (old) await profileBlobAdapter.remove(old.blobId);
  return service.saveSection("profile", {
    ...state.profile,
    [kind]: undefined,
    updatedAt: new Date().toISOString(),
  });
}
export const getActiveProfilePublicAction = () => {
  const s = service.list();
  return {
    id: s.profile.id,
    displayName: s.profile.displayName,
    role: s.profile.role,
    specialties: s.profile.specialties,
    teamMemberId: s.profile.teamMemberId,
    updatedAt: s.profile.updatedAt,
  };
};
export const getProfilePreferencesPublicAction = () => service.list().preferences;
export const getProfileAvailabilityPublicAction = () => service.list().availability;
export const listValidProfessionalDocumentsPublicAction = () =>
  service
    .list()
    .professionalDocuments.filter(
      (x) =>
        !x.archivedAt &&
        (!x.expiresAt || x.expiresAt >= new Date().toISOString().slice(0, 10)),
    )
    .map((x) => ({
      id: x.id,
      type: x.type,
      title: x.title,
      expiresAt: x.expiresAt,
      archived: false,
      valid: true,
    }));
export const getProfileRevisionPublicAction = () => service.list().revision;
