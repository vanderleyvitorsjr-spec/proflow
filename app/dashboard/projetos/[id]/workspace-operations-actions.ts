"use client";

import {
  consumeStockReservationAction,
  createStockReservationAction,
  returnStockConsumptionAction,
} from "@/app/dashboard/estoque/estoque-actions";
import { workspaceOperationsService } from "./workspace-operations-service";
import type {
  OrderCost,
  OrderCostStatus,
  OrderMaterial,
  OrderMaterialStatus,
  OrderTeamMember,
} from "./workspace-operations-domain";

export const getWorkspaceOperationsAction = () => workspaceOperationsService.get();
export const addOrderTeamMemberAction = (value: OrderTeamMember) => workspaceOperationsService.addTeam(value);
export const removeOrderTeamMemberAction = (id: string) => workspaceOperationsService.removeTeam(id);
export const updateOrderTeamHoursAction = (id: string, hours: number) => workspaceOperationsService.hours(id, hours);
export const addOrderMaterialAction = (value: OrderMaterial) => workspaceOperationsService.addMaterial(value);

async function ensureReservation(material: OrderMaterial) {
  if (material.stockReservationId) return material.stockReservationId;
  if (!material.stockItemId) throw new Error("Selecione um item real do Estoque antes de movimentar.");

  const result = await createStockReservationAction({
    itemId: material.stockItemId,
    serviceOrderId: material.serviceOrderId,
    purpose: `Reserva para ${material.name}`,
    quantity: material.plannedQuantity,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.data.reservation.id;
}

export async function updateOrderMaterialStatusAction(
  id: string,
  status: OrderMaterialStatus,
  confirmed: boolean,
) {
  const state = await workspaceOperationsService.get();
  const material = state.materials.find((item) => item.id === id);
  if (!material) throw new Error("Material não encontrado.");
  if (material.status === status) return state;

  if (!["RESERVED", "USED", "RETURNED"].includes(status)) {
    return workspaceOperationsService.materialStatus(id, status, confirmed);
  }

  if (!confirmed) throw new Error("Confirme explicitamente a movimentação de Estoque.");

  if (status === "RESERVED") {
    const reservationId = await ensureReservation(material);
    return workspaceOperationsService.materialIntegration(
      id,
      { status, stockReservationId: reservationId, stockMovementConfirmed: true },
      `${material.name} foi reservado no Estoque.`,
    );
  }

  if (status === "USED") {
    if (material.consumptionMovementId) {
      return workspaceOperationsService.materialIntegration(
        id,
        { status, usedQuantity: material.plannedQuantity, stockMovementConfirmed: true },
        `${material.name} já possuía consumo confirmado.`,
      );
    }

    const reservationId = await ensureReservation(material);
    const result = await consumeStockReservationAction({
      reservationId,
      quantity: material.plannedQuantity,
      reason: `Consumo confirmado no Workspace: ${material.name}`,
      administrative: false,
    });
    if (!result.ok) throw new Error(result.error.message);

    return workspaceOperationsService.materialIntegration(
      id,
      {
        status,
        stockReservationId: reservationId,
        consumptionMovementId: result.data.id,
        usedQuantity: material.plannedQuantity,
        returnedQuantity: 0,
        stockMovementConfirmed: true,
      },
      `${material.name} foi consumido na Ordem.`,
    );
  }

  if (!material.consumptionMovementId) {
    throw new Error("Confirme o consumo do material antes de registrar a devolução.");
  }
  const alreadyReturned = material.returnedQuantity ?? 0;
  const quantityToReturn = material.usedQuantity - alreadyReturned;
  if (quantityToReturn <= 0) throw new Error("Todo o material consumido já foi devolvido.");

  const result = await returnStockConsumptionAction(
    material.consumptionMovementId,
    quantityToReturn,
    `Devolução confirmada no Workspace: ${material.name}`,
  );
  if (!result.ok) throw new Error(result.error.message);

  return workspaceOperationsService.materialIntegration(
    id,
    {
      status,
      returnedQuantity: alreadyReturned + quantityToReturn,
      stockMovementConfirmed: true,
    },
    `${material.name} foi devolvido ao Estoque.`,
  );
}

export const addOrderCostAction = (value: OrderCost) => workspaceOperationsService.addCost(value);
export const updateOrderCostStatusAction = (id: string, status: OrderCostStatus) => workspaceOperationsService.costStatus(id, status);
