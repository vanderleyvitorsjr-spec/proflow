"use client";

import {
  readRemoteModuleState,
  recoverRemoteModuleState,
  writeRemoteModuleState,
} from "@/lib/module-state/remote-module-state";

import { defaultConfigState } from "./configuracoes-data";
import { ConfigurationError } from "./configuracoes-errors";
import { configStateSchema } from "./configuracoes-schema";
import type { ConfigState } from "./configuracoes-types";

function normalize(value: unknown): ConfigState {
  const defaults = defaultConfigState();
  const candidate = typeof value === "object" && value !== null
    ? { ...value, company: { ...defaults.company, ...((value as Partial<ConfigState>).company ?? {}) } }
    : defaults;
  const parsed = configStateSchema.safeParse(candidate);
  if (!parsed.success)
    throw new ConfigurationError("CORRUPTED", "As configurações da empresa estão inválidas.");
  return parsed.data as ConfigState;
}

export const configurationStorageAdapter = {
  async read(): Promise<ConfigState> {
    return normalize(await readRemoteModuleState("configuracoes", defaultConfigState()));
  },

  async write(state: ConfigState, expectedRevision: number): Promise<ConfigState> {
    const current = await this.read();
    if (current.revision !== expectedRevision)
      throw new ConfigurationError(
        "REVISION_CONFLICT",
        "As configurações foram alteradas em outra sessão. Recarregue antes de salvar.",
      );
    const next = normalize({ ...state, revision: current.revision + 1 });
    return normalize(await writeRemoteModuleState("configuracoes", next));
  },

  async recover(): Promise<ConfigState> {
    return normalize(await recoverRemoteModuleState("configuracoes"));
  },
};
