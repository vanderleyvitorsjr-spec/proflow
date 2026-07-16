import type { PricingStorageAdapter } from "./precificacao-storage-adapter";
import type { PricingStorageState } from "./precificacao-types";
export class PricingRepository {
  constructor(private adapter: PricingStorageAdapter) {}
  read() {
    return this.adapter.read();
  }
  save(state: PricingStorageState) {
    return this.adapter.write(state);
  }
  recoverBackup() {
    return this.adapter.recoverBackup();
  }
}
