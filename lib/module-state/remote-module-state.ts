"use client";

import { scopedBrowserStorageKey } from "@/lib/storage/company-storage-key";

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

function readLegacy<T>(module: string, extraKeys: readonly string[]): T | null {
  if (typeof window === "undefined") return null;
  let scoped: string | null = null;
  try { scoped = scopedBrowserStorageKey(module); } catch { scoped = null; }
  // Por padrão, somente a chave isolada da empresa autenticada é importada. A
  // chave global antiga (sem empresa) não é lida: num navegador compartilhado
  // ela pode conter dados de outra empresa. Chaves extras só entram quando o
  // módulo as declara explicitamente (catálogos sem dados sensíveis).
  const keys = [scoped, ...extraKeys].filter(Boolean) as string[];
  for (const key of keys) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;
    try { return JSON.parse(raw) as T; } catch { /* tenta a próxima chave */ }
  }
  return null;
}

export type RemoteModuleStateOptions = {
  /** Chaves antigas do navegador a importar na primeira leitura, além da chave da empresa. */
  legacyKeys?: readonly string[];
};

export async function readRemoteModuleState<T>(
  module: string,
  fallback: T,
  options: RemoteModuleStateOptions = {},
): Promise<T> {
  const remote = await request<ReadResponse<T>>(module);
  revisions.set(module, remote.revision);
  if (remote.found && remote.payload !== null) return remote.payload;

  const legacy = readLegacy<T>(module, options.legacyKeys ?? []);
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
