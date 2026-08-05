import { readRemoteModuleState, writeRemoteModuleState } from "@/lib/module-state/remote-module-state";
import type { AgendaIndependentEvent, AgendaOsLink } from "./agenda-types";

export type AgendaStorageState = { events: AgendaIndependentEvent[]; osLinks: AgendaOsLink[] };
export interface AgendaStorageAdapter {
  read(): Promise<AgendaStorageState>;
  write(state: AgendaStorageState): Promise<void>;
}

const initial: AgendaStorageState = { events: [], osLinks: [] };

export class RemoteAgendaStorageAdapter implements AgendaStorageAdapter {
  read() {
    return readRemoteModuleState<AgendaStorageState>("agenda", initial);
  }

  async write(state: AgendaStorageState) {
    await writeRemoteModuleState("agenda", state);
  }
}

export const agendaStorageAdapter: AgendaStorageAdapter = new RemoteAgendaStorageAdapter();
