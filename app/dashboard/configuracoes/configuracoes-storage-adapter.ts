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
    if (main?.success) {
      const state = main.data as ConfigState;
      // Migração leve de configurações existentes: versões anteriores do ProFlow
      // não incluíam T.I. na Ordem de Serviço, estoque e tipos de equipamento.
      // Fazemos a inclusão sem remover personalizações que o usuário já salvou.
      const categories = state.operationalSettings.serviceOrder.categories;
      const stockCategories = state.operationalSettings.stock.categories;
      const equipmentTypes = state.operationalSettings.equipment.types;
      let changed = false;

      if (!categories.includes("IT")) {
        categories.splice(Math.min(2, categories.length), 0, "IT");
        changed = true;
      }
      if (!stockCategories.includes("IT")) {
        stockCategories.push("IT");
        changed = true;
      }
      for (const type of ["SERVER", "PRINTER", "NETWORK_DEVICE"] as const) {
        if (!equipmentTypes.includes(type)) {
          equipmentTypes.push(type);
          changed = true;
        }
      }

      // Migração dos padrões antigos de precificação que estavam elevando o preço.
      // Só alteramos valores que ainda são exatamente os defaults antigos, preservando
      // qualquer personalização feita pelo usuário.
      if (state.pricingSettings.minimumMarginBasisPoints === 2000) {
        state.pricingSettings.minimumMarginBasisPoints = 1500;
        changed = true;
      }
      if (state.pricingSettings.recommendedMarginBasisPoints === 3500) {
        state.pricingSettings.recommendedMarginBasisPoints = 2000;
        changed = true;
      }
      if (state.pricingSettings.premiumMarginBasisPoints === 5000) {
        state.pricingSettings.premiumMarginBasisPoints = 2500;
        changed = true;
      }
      if (state.pricingSettings.costPerKmCents === 0) {
        state.pricingSettings.costPerKmCents = 250;
        changed = true;
      }

      if (changed) localStorage.setItem(KEY(), JSON.stringify(state));
      return state;
    }

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
