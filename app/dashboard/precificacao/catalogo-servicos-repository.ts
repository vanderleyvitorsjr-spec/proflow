import { serviceCatalogStorageAdapter } from "./catalogo-servicos-storage-adapter";
import type { CatalogService, ServiceCatalogEnvelope } from "./catalogo-servicos-domain";
export const serviceCatalogRepository = {
  read: () => serviceCatalogStorageAdapter.load(),
  save: (value: ServiceCatalogEnvelope) => serviceCatalogStorageAdapter.save(value),
  async upsert(service: CatalogService, state?: ServiceCatalogEnvelope) {
    const current = state ?? await serviceCatalogStorageAdapter.load();
    const services = current.services.some((item) => item.id === service.id)
      ? current.services.map((item) => item.id === service.id ? service : item)
      : [service, ...current.services];
    await this.save({ ...current, services });
    return service;
  },
};
