import { readRemoteModuleState, writeRemoteModuleState } from "@/lib/module-state/remote-module-state";
import type { ServiceCatalogEnvelope } from "./catalogo-servicos-domain";
const empty = (): ServiceCatalogEnvelope => ({ version: 1, nextSequence: 1, services: [], priceHistory: [] });
export const serviceCatalogStorageAdapter = {
  load: () => readRemoteModuleState("catalogo-servicos", empty()),
  save: (value: ServiceCatalogEnvelope) => writeRemoteModuleState("catalogo-servicos", value),
};
