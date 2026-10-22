import { readRemoteModuleState, writeRemoteModuleState } from "@/lib/module-state/remote-module-state";
import type { CrmLeadRecord } from "./crm-types";

export interface CrmStorageAdapter {
  list(): Promise<CrmLeadRecord[]>;
  replace(records: CrmLeadRecord[]): Promise<void>;
}

export class RemoteCrmStorageAdapter implements CrmStorageAdapter {
  list() {
    return readRemoteModuleState<CrmLeadRecord[]>("crm", []);
  }

  async replace(records: CrmLeadRecord[]) {
    await writeRemoteModuleState("crm", records);
  }
}

export const crmStorageAdapter: CrmStorageAdapter = new RemoteCrmStorageAdapter();
