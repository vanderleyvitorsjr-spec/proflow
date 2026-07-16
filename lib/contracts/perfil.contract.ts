export type UserProfilePublicReference = {
  id: string;
  displayName: string;
  role: string;
  specialties: string[];
  teamMemberId?: string;
  updatedAt: string;
};
export type UserAvailabilityPublicReference = {
  status: "AVAILABLE" | "BUSY" | "AWAY" | "OFFLINE" | "ON_LEAVE";
  workingDays: number[];
  startTime: string;
  endTime: string;
  timezone: string;
};
export type UserPreferencePublicSettings = {
  theme: "light" | "dark" | "system";
  density: "compact" | "comfortable";
  fontSize: "normal" | "large";
  contrast: "normal" | "high";
  reducedMotion: boolean;
  homePage: string;
  tableRows: number;
  openDetails: "same-tab" | "new-tab";
  preserveFilters: boolean;
  moduleViews: Record<string, string>;
  timezone: string;
};
export type UserProfessionalDocumentReference = {
  id: string;
  type: string;
  title: string;
  expiresAt?: string;
  archived: boolean;
  valid: boolean;
};
