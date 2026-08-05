"use client";
import { scopedBrowserStorageKey } from "@/lib/storage/company-storage-key";
import { emptyClientRelationships, type ClientRelationshipState } from "./cliente-360-domain";
const key = () => scopedBrowserStorageKey("cliente-relacionamentos", 1);
export const clientRelationshipStorage = {
  load(): ClientRelationshipState {
    const raw = localStorage.getItem(key());
    if (!raw) return emptyClientRelationships();
    try { const state = JSON.parse(raw) as ClientRelationshipState; return state.version === 1 ? state : emptyClientRelationships(); }
    catch { return emptyClientRelationships(); }
  },
  save(state: ClientRelationshipState) { localStorage.setItem(key(), JSON.stringify(state)); return state; },
};
