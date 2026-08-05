"use client";
import { serviceCatalogStorageAdapter } from "./catalogo-servicos-storage-adapter";
import type { CatalogService, ServiceCatalogEnvelope } from "./catalogo-servicos-domain";
export const serviceCatalogRepository = {
  read: () => serviceCatalogStorageAdapter.load(),
  save: (value: ServiceCatalogEnvelope) => { serviceCatalogStorageAdapter.save(value); return value; },
  upsert(service: CatalogService, state = serviceCatalogStorageAdapter.load()) {
    const services = state.services.some((item) => item.id === service.id)
      ? state.services.map((item) => item.id === service.id ? service : item)
      : [service, ...state.services];
    this.save({ ...state, services });
    return service;
  },
};
