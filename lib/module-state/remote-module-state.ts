"use client";

import { legacyStorageKey, scopedBrowserStorageKey } from "@/lib/storage/company-storage-key";

type ReadResponse<T> = { found: boolean; revision: number; payload: T | null };
const revisions = new Map<string, number>();

async function request<T>(module: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/module-state/${encodeURIComponent(module)}`, {
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "Não foi possível acessar os dados da empresa.");
  return data as T;
}

function readLegacy<T>(module: string): T | null {
  if (typeof window === "undefined") return null;
  let scoped: string | null = null;
  try { scoped = scopedBrowserStorageKey(module); } catch { scoped = null; }
  for (const key of [scoped, legacyStorageKey(module)].filter(Boolean) as string[]) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;
    try { return JSON.parse(raw) as T; } catch { /* tenta a próxima chave */ }
  }
  return null;
}

export async function readRemoteModuleState<T>(module: string, fallback: T): Promise<T> {
  const remote = await request<ReadResponse<T>>(module);
  revisions.set(module, remote.revision);
  if (remote.found && remote.payload !== null) return remote.payload;

  const legacy = readLegacy<T>(module);
  const initial = legacy ?? structuredClone(fallback);
  await writeRemoteModuleState(module, initial);
  return initial;
}

export async function writeRemoteModuleState<T>(module: string, payload: T): Promise<T> {
  const result = await request<{ payload: T; revision: number }>(module, {
    method: "PUT",
    body: JSON.stringify({ payload, expectedRevision: revisions.get(module) }),
  });
  revisions.set(module, result.revision);
  return result.payload;
}

export async function recoverRemoteModuleState<T>(module: string): Promise<T> {
  const result = await request<{ payload: T; revision: number }>(module, {
    method: "PUT",
    body: JSON.stringify({ recover: true }),
  });
  revisions.set(module, result.revision);
  return result.payload;
}
