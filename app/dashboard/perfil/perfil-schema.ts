import { z } from "zod";
const media = z.object({
  blobId: z.string(),
  name: z.string(),
  type: z.string(),
  size: z.number(),
});
const history = z.object({
  id: z.string(),
  type: z.string(),
  description: z.string(),
  occurredAt: z.string(),
});
export const profileStateSchema = z.object({
  version: z.literal(1),
  revision: z.number().int(),
  profile: z.object({
    id: z.string(),
    displayName: z.string(),
    fullName: z.string(),
    preferredName: z.string().optional(),
    role: z.string(),
    specialties: z.array(z.string()),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    email: z.string().email().or(z.literal("")).optional(),
    document: z.string().optional(),
    professionalRegistration: z.string().optional(),
    bio: z.string().optional(),
    avatarMetadata: media.optional(),
    signatureMetadata: media.optional(),
    teamMemberId: z.string().optional(),
    teamMemberSnapshot: z
      .object({ id: z.string(), name: z.string(), role: z.string() })
      .optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  preferences: z.any(),
  availability: z.any(),
  professionalDocuments: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      title: z.string(),
      number: z.string().optional(),
      issuer: z.string().optional(),
      issuedAt: z.string().optional(),
      expiresAt: z.string().optional(),
      fileMetadata: media.optional(),
      notes: z.string().optional(),
      createdAt: z.string(),
      updatedAt: z.string(),
      archivedAt: z.string().optional(),
      history: z.array(history),
    }),
  ),
  notificationPreferences: z.any(),
  securityMetadata: z.any(),
  history: z.array(history),
});
