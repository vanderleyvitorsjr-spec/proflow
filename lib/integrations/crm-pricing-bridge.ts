"use client";

import { pricingStorageAdapter } from "@/app/dashboard/precificacao/precificacao-storage-adapter";

export async function syncPricingAfterCrmConversion(input: {
  crmLeadId: string;
  clientId: string;
  clientName: string;
  clientUpdatedAt: string;
}) {
  const state = await pricingStorageAdapter.read();
  let changed = false;
  const now = new Date().toISOString();
  const simulations = state.simulations.map((simulation) => {
    if (simulation.archivedAt || simulation.crmLeadId !== input.crmLeadId) return simulation;
    if (simulation.clientId && simulation.clientId !== input.clientId) return simulation;
    changed = true;
    return {
      ...simulation,
      clientId: input.clientId,
      clientSnapshot: {
        id: input.clientId,
        name: input.clientName,
        updatedAt: input.clientUpdatedAt,
      },
      crmSnapshot: simulation.crmSnapshot
        ? {
            ...simulation.crmSnapshot,
            converted: true,
            clientId: input.clientId,
            updatedAt: now,
          }
        : simulation.crmSnapshot,
      updatedAt: now,
      history: [
        ...simulation.history,
        {
          id: crypto.randomUUID(),
          type: "COMMERCIAL_LINKS_UPDATED" as const,
          description: "Cliente vinculado automaticamente após conversão do lead no CRM.",
          createdAt: now,
        },
      ],
    };
  });
  if (changed) await pricingStorageAdapter.write({ ...state, simulations });
  return changed;
}
