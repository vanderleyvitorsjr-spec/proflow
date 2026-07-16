import type { EquipmentStorageAdapter } from "./equipamentos-storage-adapter";
import type { EquipmentAsset, EquipmentStorageState } from "./equipamentos-types";
export class EquipmentRepository {
  constructor(private storage: EquipmentStorageAdapter) {}
  read() {
    return this.storage.read();
  }
  save(state: EquipmentStorageState) {
    return this.storage.write(state);
  }
  async find(id: string, includeArchived = true) {
    return (
      (await this.read()).assets.find(
        (a) => a.id === id && (includeArchived || !a.archivedAt),
      ) ?? null
    );
  }
  async saveAsset(asset: EquipmentAsset, isNew = false) {
    const state = await this.read(),
      exists = state.assets.some((a) => a.id === asset.id);
    return this.save({
      ...state,
      nextSequence: isNew ? state.nextSequence + 1 : state.nextSequence,
      assets: exists
        ? state.assets.map((a) => (a.id === asset.id ? asset : a))
        : [asset, ...state.assets],
    });
  }
}
