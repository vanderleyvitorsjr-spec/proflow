"use client";
import { scopedBrowserStorageKey } from "@/lib/storage/company-storage-key";
import type { NotificationState } from "./notificacoes-types";
const key = () => scopedBrowserStorageKey("notificacoes", 1);
const backup = () => `${key()}:backup`;
const initial: NotificationState = { version: 1, revision: 0, items: [], preferences: { enabledTypes: [] } };
export const notificationStorage = {
  load(): NotificationState {
    try { return { ...initial, ...JSON.parse(localStorage.getItem(key()) ?? "{}") }; }
    catch { const saved = localStorage.getItem(backup()); return saved ? JSON.parse(saved) : initial; }
  },
  save(state: NotificationState) {
    const current = localStorage.getItem(key());
    if (current) localStorage.setItem(backup(), current);
    localStorage.setItem(key(), JSON.stringify(state));
  },
};
