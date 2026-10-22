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

export type RemoteModuleStateOptions<T> = {
  /** Chaves antigas do navegador a importar na primeira leitura, além da chave da empresa. */
  legacyKeys?: readonly string[];
  /**
   * Junta ao estado do servidor os registros que só existem neste navegador
   * (dados criados antes de o módulo ir para o servidor, em outro aparelho).
   * Deve somente ACRESCENTAR registros ausentes; retorna null quando não há nada novo.
   * Roda uma única vez por navegador e módulo.
   */
  mergeLegacy?: (remote: T, local: unknown) => T | null;
};

function mergeMarkerKey(module: string) {
  let scoped: string;
  try { scoped = scopedBrowserStorageKey(module); } catch { return null; }
  return `${scoped}:merged-to-server`;
}

async function mergeLegacyOnce<T>(module: string, remote: T, options: RemoteModuleStateOptions<T>): Promise<T | null> {
  if (typeof window === "undefined" || !options.mergeLegacy) return null;
  const marker = mergeMarkerKey(module);
  if (!marker) return null;
  try { if (window.localStorage.getItem(marker)) return null; } catch { return null; }
  const local = readLegacy<unknown>(module, options.legacyKeys ?? []);
  let merged: T | null = null;
  if (local !== null) {
    try { merged = options.mergeLegacy(remote, local); } catch { merged = null; }
    if (merged !== null) merged = await writeRemoteModuleState(module, merged);
  }
  // Só marca depois de gravar: se a gravação falhar, tenta de novo na próxima abertura.
  try { window.localStorage.setItem(marker, new Date().toISOString()); } catch { /* sem armazenamento local */ }
  return merged;
}

export async function readRemoteModuleState<T>(
  module: string,
  fallback: T,
  options: RemoteModuleStateOptions<T> = {},
): Promise<T> {
  const remote = await request<ReadResponse<T>>(module);
  revisions.set(module, remote.revision);
  if (remote.found && remote.payload !== null) {
    return (await mergeLegacyOnce(module, remote.payload, options)) ?? remote.payload;
  }

  const legacy = readLegacy<T>(module, options.legacyKeys ?? []);
  const initial = legacy ?? structuredClone(fallback);
  await writeRemoteModuleState(module, initial);
  const marker = mergeMarkerKey(module);
  if (marker && legacy !== null) {
    try { window.localStorage.setItem(marker, new Date().toISOString()); } catch { /* sem armazenamento local */ }
  }
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

/** Junção para listas simples: acrescenta itens locais cujo id não existe no servidor. */
export function mergeById<T extends { id: string }>(remote: T[], local: unknown): T[] | null {
  if (!Array.isArray(remote) || !Array.isArray(local)) return null;
  const known = new Set(remote.map((item) => item.id));
  const added = (local as T[]).filter((item) => item && typeof item.id === "string" && !known.has(item.id));
  return added.length ? [...remote, ...added] : null;
}
