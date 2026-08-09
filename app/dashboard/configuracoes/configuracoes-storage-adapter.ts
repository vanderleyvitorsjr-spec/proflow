"use client";

import {
  copyLegacyBrowserDataToCompany,
  scopedBrowserBackupKey,
  scopedBrowserStorageKey,
} from "@/lib/storage/company-storage-key";
import { readRemoteModuleState, writeRemoteModuleState } from "@/lib/storage/remote-module-state";

import { defaultConfigState } from "./configuracoes-data";
import { ConfigurationError } from "./configuracoes-errors";
import { configStateSchema } from "./configuracoes-schema";
import type { ConfigState } from "./configuracoes-types";

const KEY = () => scopedBrowserStorageKey("configuracoes");
const BACKUP = () => scopedBrowserBackupKey("configuracoes");

const parse = (raw: string | null) => {
  if (!raw) return null;
  try {
    return configStateSchema.safeParse(JSON.parse(raw));
  } catch {
    return null;
  }
};

function readLocal(): ConfigState {
  copyLegacyBrowserDataToCompany("configuracoes");
  const raw = localStorage.getItem(KEY());
  if (!raw) {
    const initial = defaultConfigState();
    localStorage.setItem(KEY(), JSON.stringify(initial));
    return initial;
  }
  const main = parse(raw);
  if (main?.success) return main.data as ConfigState;
  const backup = parse(localStorage.getItem(BACKUP()));
  if (backup?.success) {
    localStorage.setItem(KEY(), JSON.stringify(backup.data));
    return backup.data as ConfigState;
  }
  throw new ConfigurationError(
    "CORRUPTED",
    "As configurações e o backup estão corrompidos. Recupere por importação válida.",
  );
}

function writeLocal(next: ConfigState, current?: ConfigState) {
  if (current) localStorage.setItem(BACKUP(), JSON.stringify(current));
  localStorage.setItem(KEY(), JSON.stringify(next));
}

export const configurationStorageAdapter = {
  async read(): Promise<ConfigState> {
    try {
      const remote = await readRemoteModuleState<ConfigState>("configuracoes");
      if (remote.data) {
        const parsed = configStateSchema.safeParse(remote.data);
        if (parsed.success) {
          writeLocal(parsed.data as ConfigState);
          return parsed.data as ConfigState;
        }
      }
    } catch {
      // Continua com o espelho local em indisponibilidade temporária.
    }
    const local = readLocal();
    try { await writeRemoteModuleState("configuracoes", local); } catch { /* mantém espelho */ }
    return local;
  },

  async write(state: ConfigState, expectedRevision: number): Promise<ConfigState> {
    const current = await this.read();
    if (current.revision !== expectedRevision) {
      throw new ConfigurationError(
        "REVISION_CONFLICT",
        "As configurações foram alteradas em outra sessão. Recarregue antes de salvar.",
      );
    }
    const next = configStateSchema.parse({
      ...state,
      revision: current.revision + 1,
    }) as ConfigState;
    try {
      await writeRemoteModuleState("configuracoes", next);
      writeLocal(next, current);
      return next;
    } catch {
      throw new ConfigurationError(
        "STORAGE_UNAVAILABLE",
        "Não foi possível salvar e sincronizar as configurações com o servidor.",
      );
    }
  },

  async recover(): Promise<ConfigState> {
    copyLegacyBrowserDataToCompany("configuracoes");
    const backup = parse(localStorage.getItem(BACKUP()));
    if (!backup?.success) {
      throw new ConfigurationError("CORRUPTED", "Backup válido não encontrado.");
    }
    const recovered = backup.data as ConfigState;
    try {
      await writeRemoteModuleState("configuracoes", recovered);
      localStorage.setItem(KEY(), JSON.stringify(recovered));
      return recovered;
    } catch {
      throw new ConfigurationError(
        "STORAGE_UNAVAILABLE",
        "O backup é válido, mas não foi possível sincronizá-lo com o servidor.",
      );
    }
  },
};
