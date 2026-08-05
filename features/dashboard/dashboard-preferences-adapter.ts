"use client";
import {
  legacyStorageKey,
  scopedBrowserStorageKey,
} from "@/lib/storage/company-storage-key";

export type DashboardPreferences = {
  hidden: string[];
  order: string[];
  sizes: Record<string, "small" | "medium" | "large">;
  period: "TODAY" | "LAST_7_DAYS" | "CURRENT_MONTH";
};

const defaults: DashboardPreferences = {
  hidden: [],
  order: [],
  sizes: {},
  period: "CURRENT_MONTH",
};
const key = () => scopedBrowserStorageKey("dashboard-preferences", 1);

export const dashboardPreferencesAdapter = {
  load(): DashboardPreferences {
    try {
      const raw =
        localStorage.getItem(key()) ??
        localStorage.getItem(legacyStorageKey("dashboard-preferences", 1)) ??
        "{}";
      return { ...defaults, ...JSON.parse(raw) };
    } catch {
      return defaults;
    }
  },
  save(value: DashboardPreferences) {
    localStorage.setItem(key(), JSON.stringify(value));
  },
  clear() {
    localStorage.removeItem(key());
  },
};
