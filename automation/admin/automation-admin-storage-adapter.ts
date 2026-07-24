import { ensureSystemWorkflow } from "./automation-admin-seed";
import type {
  AutomationAdminState,
  AutomationHistoryEntry,
  PersistedAutomationWorkflow,
} from "./automation-admin-types";

export interface AutomationAdminStorageAdapter {
  read(): Promise<AutomationAdminState>;
  write(state: AutomationAdminState): Promise<void>;
}

type LegacyState = {
  version?: number;
  workflows?: PersistedAutomationWorkflow[];
  history?: AutomationHistoryEntry[];
};

const STORAGE_KEY = "proflow:automation:admin:v1";

export function normalizeAutomationAdminState(
  value: unknown,
  now: string,
): AutomationAdminState {
  const legacy =
    value && typeof value === "object" ? (value as LegacyState) : {};
  return {
    version: 1,
    workflows: ensureSystemWorkflow(
      Array.isArray(legacy.workflows) ? legacy.workflows : [],
      now,
    ),
    history: Array.isArray(legacy.history) ? legacy.history : [],
  };
}

export class LocalAutomationAdminStorageAdapter
  implements AutomationAdminStorageAdapter
{
  async read(): Promise<AutomationAdminState> {
    const now = new Date().toISOString();
    if (typeof window === "undefined")
      return normalizeAutomationAdminState(undefined, now);
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = normalizeAutomationAdminState(undefined, now);
      await this.write(initial);
      return initial;
    }
    try {
      const normalized = normalizeAutomationAdminState(JSON.parse(raw), now);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      return normalized;
    } catch {
      throw new Error("Não foi possível ler as configurações das automações.");
    }
  }

  async write(state: AutomationAdminState): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      throw new Error("Não foi possível salvar as configurações das automações.");
    }
  }
}

export const automationAdminStorageAdapter =
  new LocalAutomationAdminStorageAdapter();
