"use client";

import {
  copyLegacyBrowserDataToCompany,
  scopedBrowserBackupKey,
  scopedBrowserStorageKey,
} from "@/lib/storage/company-storage-key";

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

export const configurationStorageAdapter = {
  async read(): Promise<ConfigState> {
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
  },

  async write(
    state: ConfigState,
    expectedRevision: number,
  ): Promise<ConfigState> {
    const current = await this.read();

    if (current.revision !== expectedRevision) {
      throw new ConfigurationError(
        "REVISION_CONFLICT",
        "As configurações foram alteradas em outra aba. Recarregue antes de salvar.",
      );
    }

    const next = configStateSchema.parse({
      ...state,
      revision: current.revision + 1,
    }) as ConfigState;

    localStorage.setItem(BACKUP(), JSON.stringify(current));
    localStorage.setItem(KEY(), JSON.stringify(next));

    return next;
  },

  async recover(): Promise<ConfigState> {
    copyLegacyBrowserDataToCompany("configuracoes");

    const backup = parse(localStorage.getItem(BACKUP()));

    if (!backup?.success) {
      throw new ConfigurationError(
        "CORRUPTED",
        "Backup válido não encontrado.",
      );
    }

    localStorage.setItem(KEY(), JSON.stringify(backup.data));
    return backup.data as ConfigState;
  },
};
