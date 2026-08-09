export type RemoteModuleState<T> = {
  data: T | null;
  revision: number;
  updatedAt: string | null;
};

export async function readRemoteModuleState<T>(module: string): Promise<RemoteModuleState<T>> {
  if (typeof window === "undefined") return { data: null, revision: 0, updatedAt: null };
  const response = await fetch(`/api/module-state/${encodeURIComponent(module)}`, {
    method: "GET",
    cache: "no-store",
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error("Não foi possível sincronizar os dados com o servidor.");
  return (await response.json()) as RemoteModuleState<T>;
}

export async function writeRemoteModuleState<T>(module: string, data: T): Promise<RemoteModuleState<T>> {
  if (typeof window === "undefined") return { data, revision: 0, updatedAt: null };
  const response = await fetch(`/api/module-state/${encodeURIComponent(module)}`, {
    method: "PUT",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  if (!response.ok) throw new Error("Não foi possível salvar os dados no servidor.");
  return (await response.json()) as RemoteModuleState<T>;
}

export async function remoteFirstRead<T>(
  module: string,
  readLocal: () => T,
  writeLocal: (value: T) => void,
): Promise<T> {
  try {
    const remote = await readRemoteModuleState<T>(module);
    if (remote.data !== null) {
      writeLocal(remote.data);
      return remote.data;
    }
  } catch {
    // O espelho local mantém o sistema utilizável durante uma indisponibilidade temporária.
  }
  const local = readLocal();
  try { await writeRemoteModuleState(module, local); } catch { /* mantém o backup local */ }
  return local;
}

export async function mirroredRemoteWrite<T>(
  module: string,
  data: T,
  writeLocal: (value: T) => void,
): Promise<void> {
  await writeRemoteModuleState(module, data);
  writeLocal(data);
}
