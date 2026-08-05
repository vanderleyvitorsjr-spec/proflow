"use client";

import { normalizeProperName } from "@/lib/br-formatters";
import { workspaceOperationsRepository } from "./workspace-operations-repository";
import {
  addOrderCost,
  addOrderMaterial,
  addOrderTeamMember,
  removeOrderTeamMember,
  updateOrderCostStatus,
  updateOrderMaterialStatus,
  updateOrderMaterialIntegration,
  updateTeamHours,
  type OrderCost,
  type OrderCostStatus,
  type OrderMaterial,
  type OrderMaterialStatus,
  type OrderTeamMember,
  type WorkspaceOperationsEnvelope,
} from "./workspace-operations-domain";

const now = () => new Date().toISOString();

async function persist(value: WorkspaceOperationsEnvelope) {
  await workspaceOperationsRepository.save(value);
  return value;
}

export const workspaceOperationsService = {
  get: () => workspaceOperationsRepository.get(),

  async addTeam(member: OrderTeamMember) {
    const current = await this.get();
    return persist(
      addOrderTeamMember(
        current,
        { ...member, memberName: normalizeProperName(member.memberName) },
        now(),
      ),
    );
  },

  async removeTeam(id: string) {
    return persist(removeOrderTeamMember(await this.get(), id, now()));
  },

  async hours(id: string, value: number) {
    return persist(updateTeamHours(await this.get(), id, value, now()));
  },

  async addMaterial(material: OrderMaterial) {
    return persist(
      addOrderMaterial(
        await this.get(),
        { ...material, name: normalizeProperName(material.name) },
        now(),
      ),
    );
  },

  async materialStatus(id: string, status: OrderMaterialStatus, confirmed: boolean) {
    return persist(
      updateOrderMaterialStatus(await this.get(), id, status, confirmed, now()),
    );
  },

  async materialIntegration(
    id: string,
    patch: Parameters<typeof updateOrderMaterialIntegration>[2],
    description: string,
  ) {
    return persist(
      updateOrderMaterialIntegration(await this.get(), id, patch, description, now()),
    );
  },

  async addCost(cost: OrderCost) {
    return persist(
      addOrderCost(
        await this.get(),
        {
          ...cost,
          description: normalizeProperName(cost.description),
          responsible: normalizeProperName(cost.responsible),
          supplier: cost.supplier ? normalizeProperName(cost.supplier) : undefined,
        },
        now(),
      ),
    );
  },

  async costStatus(id: string, status: OrderCostStatus) {
    return persist(updateOrderCostStatus(await this.get(), id, status, now()));
  },
};
