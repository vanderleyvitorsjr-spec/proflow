"use client";

import { copyLegacyBrowserDataToCompany, scopedBrowserStorageKey } from "@/lib/storage/company-storage-key";
import { remoteFirstRead, mirroredRemoteWrite } from "@/lib/storage/remote-module-state";
import { emptyClientRelationships, type ClientRelationshipState } from "./cliente-360-domain";

const MODULE = "cliente-relacionamentos";
const key = () => scopedBrowserStorageKey(MODULE, 1);

function readLocal(): ClientRelationshipState {
  copyLegacyBrowserDataToCompany(MODULE, 1);
  const raw = localStorage.getItem(key());
  if (!raw) return emptyClientRelationships();
  try {
    const state = JSON.parse(raw) as ClientRelationshipState;
    return state.version === 1 ? state : emptyClientRelationships();
  } catch {
    return emptyClientRelationships();
  }
}

function writeLocal(state: ClientRelationshipState) {
  localStorage.setItem(key(), JSON.stringify(state));
}

export const clientRelationshipStorage = {
  async load(): Promise<ClientRelationshipState> {
    return remoteFirstRead(MODULE, readLocal, writeLocal);
  },
  async save(state: ClientRelationshipState): Promise<ClientRelationshipState> {
    await mirroredRemoteWrite(MODULE, state, writeLocal);
    return state;
  },
};
