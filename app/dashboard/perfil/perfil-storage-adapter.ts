"use client";
import { profileStateSchema } from "./perfil-schema";
import type { ProfileState } from "./perfil-types";
const KEY = "proflow:perfil:v1",
  BACKUP = `${KEY}:backup`;
const now = () => new Date().toISOString();
const categories = [
  "CRM",
  "AGENDA",
  "ORDERS",
  "FINANCIAL",
  "STOCK",
  "EQUIPMENT",
  "PRICING",
  "LIBRARY",
  "SYSTEM",
] as const;
export const defaultProfileState = (): ProfileState => ({
  version: 1,
  revision: 0,
  profile: {
    id: crypto.randomUUID(),
    displayName: "Usuário local",
    fullName: "",
    role: "",
    specialties: [],
    createdAt: now(),
    updatedAt: now(),
  },
  preferences: {
    theme: "system",
    density: "comfortable",
    fontSize: "normal",
    contrast: "normal",
    reducedMotion: false,
    homePage: "/dashboard",
    tableRows: 25,
    openDetails: "same-tab",
    preserveFilters: true,
    moduleViews: {},
    timezone: "America/Bahia",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    language: "pt-BR",
    reportArea: "ALL",
    dashboardWidget: "",
  },
  availability: {
    status: "AVAILABLE",
    workingDays: [1, 2, 3, 4, 5],
    startTime: "08:00",
    endTime: "18:00",
    timezone: "America/Bahia",
    breakStart: "12:00",
    breakEnd: "13:00",
    notes: "",
    unavailableDates: [],
    leaveDates: [],
  },
  professionalDocuments: [],
  notificationPreferences: Object.fromEntries(
    categories.map((x) => [
      x,
      {
        enabled: true,
        minimumPriority: "NORMAL",
        showInHeader: true,
        sound: false,
        snooze: true,
        dailyDigest: false,
      },
    ]),
  ) as ProfileState["notificationPreferences"],
  securityMetadata: { futureTwoFactorPreferred: false },
  history: [],
});
export const profileStorage = {
  load(): ProfileState {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultProfileState();
    const parsed = profileStateSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data as ProfileState;
    const backup = localStorage.getItem(BACKUP);
    if (backup) {
      const recovered = profileStateSchema.safeParse(JSON.parse(backup));
      if (recovered.success) return recovered.data as ProfileState;
    }
    throw new Error("Perfil e backup locais estão corrompidos.");
  },
  save(state: ProfileState, expected: number) {
    const current = localStorage.getItem(KEY);
    if (current) {
      const parsed = profileStateSchema.parse(JSON.parse(current));
      if (parsed.revision !== expected)
        throw new Error(
          "O Perfil foi alterado em outra aba. Recarregue antes de salvar.",
        );
      localStorage.setItem(BACKUP, current);
    }
    localStorage.setItem(KEY, JSON.stringify(profileStateSchema.parse(state)));
  },
};
