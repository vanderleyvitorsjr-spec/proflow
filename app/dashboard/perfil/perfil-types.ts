import type {
  UserAvailabilityPublicReference,
  UserPreferencePublicSettings,
} from "@/lib/contracts/perfil.contract";
export type ProfileMedia = { blobId: string; name: string; type: string; size: number };
export type ProfileHistoryEntry = {
  id: string;
  type: string;
  description: string;
  occurredAt: string;
};
export type UserProfile = {
  id: string;
  displayName: string;
  fullName: string;
  preferredName?: string;
  role: string;
  specialties: string[];
  phone?: string;
  whatsapp?: string;
  email?: string;
  document?: string;
  professionalRegistration?: string;
  bio?: string;
  avatarMetadata?: ProfileMedia;
  signatureMetadata?: ProfileMedia;
  teamMemberId?: string;
  teamMemberSnapshot?: { id: string; name: string; role: string };
  createdAt: string;
  updatedAt: string;
};
export type ProfessionalDocument = {
  id: string;
  type: string;
  title: string;
  number?: string;
  issuer?: string;
  issuedAt?: string;
  expiresAt?: string;
  fileMetadata?: ProfileMedia;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  history: ProfileHistoryEntry[];
};
export type NotificationCategory =
  | "CRM"
  | "AGENDA"
  | "ORDERS"
  | "FINANCIAL"
  | "STOCK"
  | "EQUIPMENT"
  | "PRICING"
  | "LIBRARY"
  | "SYSTEM";
export type ProfileState = {
  version: 1;
  revision: number;
  profile: UserProfile;
  preferences: UserPreferencePublicSettings & {
    dateFormat: "DD/MM/YYYY";
    timeFormat: "24h" | "12h";
    language: "pt-BR";
    reportArea: string;
    dashboardWidget: string;
  };
  availability: UserAvailabilityPublicReference & {
    breakStart: string;
    breakEnd: string;
    notes: string;
    unavailableDates: string[];
    leaveDates: string[];
  };
  professionalDocuments: ProfessionalDocument[];
  notificationPreferences: Record<
    NotificationCategory,
    {
      enabled: boolean;
      minimumPriority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
      showInHeader: boolean;
      sound: boolean;
      snooze: boolean;
      dailyDigest: boolean;
    }
  >;
  securityMetadata: { futureTwoFactorPreferred: boolean; lastLocalAccessAt?: string };
  history: ProfileHistoryEntry[];
};
