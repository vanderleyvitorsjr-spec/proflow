import { normalizeCatalogService, type CatalogService } from "./catalogo-servicos-domain";
import { serviceCatalogRepository } from "./catalogo-servicos-repository";
export const serviceCatalogService = {
  list: async () => (await serviceCatalogRepository.read()).services,
  async create(input: Omit<CatalogService, "id" | "code" | "createdAt" | "updatedAt">) {
    const state = await serviceCatalogRepository.read(), now = new Date().toISOString();
    const created = normalizeCatalogService({
      ...input, id: crypto.randomUUID(), code: `SRV-${String(state.nextSequence).padStart(5, "0")}`,
      createdAt: now, updatedAt: now,
    });
    await serviceCatalogRepository.save({ ...state, nextSequence: state.nextSequence + 1, services: [created, ...state.services] });
    return created;
  },
  async update(id: string, changes: Partial<CatalogService>, reason = "Atualização do serviço", responsible?: string) {
    const state = await serviceCatalogRepository.read(), current = state.services.find((item) => item.id === id);
    if (!current) throw new Error("Serviço não encontrado.");
    const updated = normalizeCatalogService({ ...current, ...changes, id, code: current.code, updatedAt: new Date().toISOString() });
    const changed = current.basePriceCents !== updated.basePriceCents || current.estimatedCostCents !== updated.estimatedCostCents || current.desiredMarginBasisPoints !== updated.desiredMarginBasisPoints;
    await serviceCatalogRepository.save({
      ...state,
      services: state.services.map((item) => item.id === id ? updated : item),
      priceHistory: changed ? [...state.priceHistory, {
        id: crypto.randomUUID(), serviceId: id, previousPriceCents: current.basePriceCents,
        newPriceCents: updated.basePriceCents, previousCostCents: current.estimatedCostCents,
        newCostCents: updated.estimatedCostCents, previousMarginBasisPoints: current.desiredMarginBasisPoints,
        newMarginBasisPoints: updated.desiredMarginBasisPoints, responsible, reason, createdAt: updated.updatedAt,
      }] : state.priceHistory,
    });
    return updated;
  },
  history: async (serviceId: string) => (await serviceCatalogRepository.read()).priceHistory.filter((item) => item.serviceId === serviceId),
};
