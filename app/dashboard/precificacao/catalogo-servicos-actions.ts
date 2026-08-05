"use client";
import { serviceCatalogService } from "./catalogo-servicos-service";
export const listCatalogServicesAction = () => Promise.resolve(serviceCatalogService.list());
export const createCatalogServiceAction = (input: Parameters<typeof serviceCatalogService.create>[0]) => Promise.resolve(serviceCatalogService.create(input));
export const updateCatalogServiceAction = (id: string, changes: Parameters<typeof serviceCatalogService.update>[1], reason?: string) => Promise.resolve(serviceCatalogService.update(id, changes, reason));
