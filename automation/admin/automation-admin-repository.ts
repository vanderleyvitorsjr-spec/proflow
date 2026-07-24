import type { AutomationAdminStorageAdapter } from "./automation-admin-storage-adapter";
import type {
  AutomationAdminState,
  AutomationHistoryEntry,
  PersistedAutomationWorkflow,
} from "./automation-admin-types";

export class AutomationAdminRepository {
  constructor(private readonly storage: AutomationAdminStorageAdapter) {}

  read(): Promise<AutomationAdminState> {
    return this.storage.read();
  }

  async saveWorkflow(
    workflow: PersistedAutomationWorkflow,
  ): Promise<PersistedAutomationWorkflow> {
    const state = await this.storage.read();
    await this.storage.write({
      ...state,
      workflows: state.workflows.some((item) => item.id === workflow.id)
        ? state.workflows.map((item) => (item.id === workflow.id ? workflow : item))
        : [workflow, ...state.workflows],
    });
    return workflow;
  }

  async removeWorkflow(id: string): Promise<void> {
    const state = await this.storage.read();
    await this.storage.write({
      ...state,
      workflows: state.workflows.filter((item) => item.id !== id),
    });
  }

  async appendHistory(entry: AutomationHistoryEntry): Promise<void> {
    const state = await this.storage.read();
    await this.storage.write({
      ...state,
      history: [entry, ...state.history].slice(0, 500),
    });
  }
}
