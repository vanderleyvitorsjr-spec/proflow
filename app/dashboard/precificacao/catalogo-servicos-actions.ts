import { serviceCatalogService } from "./catalogo-servicos-service";
export const listCatalogServicesAction = () => serviceCatalogService.list();
export const createCatalogServiceAction = (input: Parameters<typeof serviceCatalogService.create>[0]) => serviceCatalogService.create(input);
export const updateCatalogServiceAction = (id: string, changes: Parameters<typeof serviceCatalogService.update>[1], reason?: string) => serviceCatalogService.update(id, changes, reason);
