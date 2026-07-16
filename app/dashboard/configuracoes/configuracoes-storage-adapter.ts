"use client";
import { configStateSchema } from "./configuracoes-schema";
import { defaultConfigState } from "./configuracoes-data";
import { ConfigurationError } from "./configuracoes-errors";
import type { ConfigState } from "./configuracoes-types";
const KEY = "proflow:configuracoes:v1",
  BACKUP = `${KEY}:backup`;
const parse = (raw: string | null) =>
  raw ? configStateSchema.safeParse(JSON.parse(raw)) : null;
export const configurationStorageAdapter = {
  async read(): Promise<ConfigState> {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const initial = defaultConfigState();
      localStorage.setItem(KEY, JSON.stringify(initial));
      return initial;
    }
    try {
      const main = parse(raw);
      if (main?.success) return main.data as ConfigState;
      const backup = parse(localStorage.getItem(BACKUP));
      if (backup?.success) return backup.data as ConfigState;
    } catch {
      /* handled below */
    }
    throw new ConfigurationError(
      "CORRUPTED",
      "As configurações e o backup estão corrompidos. Recupere por importação válida.",
    );
  },
  async write(state: ConfigState, expectedRevision: number): Promise<ConfigState> {
    const current = await this.read();
    if (current.revision !== expectedRevision)
      throw new ConfigurationError(
        "REVISION_CONFLICT",
        "As configurações foram alteradas em outra aba. Recarregue antes de salvar.",
      );
    const next = configStateSchema.parse({
      ...state,
      revision: current.revision + 1,
    }) as ConfigState;
    localStorage.setItem(BACKUP, JSON.stringify(current));
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  },
  async recover(): Promise<ConfigState> {
    const backup = parse(localStorage.getItem(BACKUP));
    if (!backup?.success)
      throw new ConfigurationError("CORRUPTED", "Backup válido não encontrado.");
    localStorage.setItem(KEY, JSON.stringify(backup.data));
    return backup.data as ConfigState;
  },
};
