import { readRemoteModuleState, writeRemoteModuleState } from "@/lib/module-state/remote-module-state";
import type { ClientRecord } from "./clientes-data";

export interface ClientsStorageAdapter {
  list(): Promise<ClientRecord[]>;
  replace(records: ClientRecord[]): Promise<void>;
}

export class RemoteClientsStorageAdapter implements ClientsStorageAdapter {
  list() {
    return readRemoteModuleState<ClientRecord[]>("clientes", []);
  }

  async replace(records: ClientRecord[]) {
    await writeRemoteModuleState("clientes", records);
  }
}

export const clientsStorageAdapter: ClientsStorageAdapter = new RemoteClientsStorageAdapter();
