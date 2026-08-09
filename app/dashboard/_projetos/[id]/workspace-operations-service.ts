"use client";
import { normalizeProperName } from "@/lib/br-formatters";
import { workspaceOperationsRepository } from "./workspace-operations-repository";
import { addOrderCost, addOrderMaterial, addOrderTeamMember, removeOrderTeamMember, updateOrderCostStatus, updateOrderMaterialStatus, updateTeamHours, type OrderCost, type OrderCostStatus, type OrderMaterial, type OrderMaterialStatus, type OrderTeamMember, type WorkspaceOperationsEnvelope } from "./workspace-operations-domain";
const now = () => new Date().toISOString();
const persist = (value: WorkspaceOperationsEnvelope) => { workspaceOperationsRepository.save(value); return value; };
export const workspaceOperationsService = {
  get: () => workspaceOperationsRepository.get(),
  addTeam(member: OrderTeamMember) { return persist(addOrderTeamMember(this.get(), { ...member, memberName: normalizeProperName(member.memberName) }, now())); },
  removeTeam(id: string) { return persist(removeOrderTeamMember(this.get(), id, now())); },
  hours(id: string, value: number) { return persist(updateTeamHours(this.get(), id, value, now())); },
  addMaterial(material: OrderMaterial) { return persist(addOrderMaterial(this.get(), { ...material, name: normalizeProperName(material.name) }, now())); },
  materialStatus(id: string, status: OrderMaterialStatus, confirmed: boolean) { return persist(updateOrderMaterialStatus(this.get(), id, status, confirmed, now())); },
  addCost(cost: OrderCost) { return persist(addOrderCost(this.get(), { ...cost, description: normalizeProperName(cost.description), responsible: normalizeProperName(cost.responsible), supplier: cost.supplier ? normalizeProperName(cost.supplier) : undefined }, now())); },
  costStatus(id: string, status: OrderCostStatus) { return persist(updateOrderCostStatus(this.get(), id, status, now())); },
};
