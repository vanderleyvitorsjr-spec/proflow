import type { StockStorageAdapter } from "./estoque-storage-adapter";
import type { StockStorageState } from "./estoque-types";
export class StockRepository {
  constructor(private storage: StockStorageAdapter) {}
  read() {
    return this.storage.read();
  }
  save(state: StockStorageState) {
    return this.storage.write(state);
  }
  recoverBackup() {
    return this.storage.recoverBackup();
  }
}
