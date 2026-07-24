"use client";

import { listAgendaEventsAction } from "@/app/dashboard/agenda/agenda-actions";
import { listEquipmentStateAction } from "@/app/dashboard/equipamentos/equipamentos-actions";
import { listFinancialStateAction } from "@/app/dashboard/financeiro/financeiro-actions";
import { getOrdemAction, updateOrdemChecklistAction } from "@/app/dashboard/ordens/ordens-actions";
import type { OrdemRecord } from "@/app/dashboard/ordens/ordens-types";
import type { OrdemChecklistItem } from "@/app/dashboard/ordens/ordens-types";
import { listPricingReportAction } from "@/app/dashboard/precificacao/precificacao-actions";
import { listStockAction } from "@/app/dashboard/estoque/estoque-actions";
import { loadOperationalCenterSnapshot } from "@/app/dashboard/central-operacional/central-operacional-gateway";
import { listAutomationHistoryAction } from "@/automation/admin/automation-admin-actions";
import type { AutomationHistoryEntry } from "@/automation/admin/automation-admin-types";
import type { AgendaDisplayEvent } from "@/app/dashboard/agenda/agenda-types";
import type { EquipmentAsset, MaintenanceRecord } from "@/app/dashboard/equipamentos/equipamentos-types";
import type { FinancialTransaction } from "@/app/dashboard/financeiro/financeiro-types";
import type { StockMovement, StockReservation, StockSnapshot } from "@/app/dashboard/estoque/estoque-types";
import type { OperationalInsight } from "@/lib/operational-insights";
import {
  calculateOperationalProgress,
  calculateProfitability,
  consolidateCosts,
  type ConsolidatedCost,
  type Profitability,
  type ProgressBreakdown,
} from "./projeto-workspace-domain";

export type ProjetoWorkspaceSnapshot = {
  order: OrdemRecord;
  agenda: AgendaDisplayEvent[];
  financial: {
    transactions: FinancialTransaction[];
    revenueCents: number;
    expenseCents: number;
    receivedCents: number;
    paidCents: number;
  };
  stock: {
    snapshots: StockSnapshot[];
    reservations: StockReservation[];
    movements: StockMovement[];
  };
  equipment: {
    assets: EquipmentAsset[];
    maintenance: MaintenanceRecord[];
  };
  pricing?: {
    costCents: number;
    profitCents: number;
    marginBasisPoints: number;
  };
  progress: ProgressBreakdown;
  costs: ConsolidatedCost[];
  profitability: Profitability;
  insights: OperationalInsight[];
  automations: AutomationHistoryEntry[];
  partial: string[];
};

function activePaymentCents(transaction: FinancialTransaction) {
  return transaction.installments.reduce(
    (total, installment) =>
      total +
      installment.payments.reduce(
        (sum, payment) => sum + (payment.reversedAt ? 0 : payment.amountCents),
        0,
      ),
    0,
  );
}

export async function loadProjetoWorkspace(
  id: string,
): Promise<ProjetoWorkspaceSnapshot | null> {
  const order = await getOrdemAction(id);
  if (!order) return null;

  const results = await Promise.allSettled([
    listAgendaEventsAction(),
    listFinancialStateAction(),
    listStockAction(),
    listEquipmentStateAction(),
    listPricingReportAction(),
    loadOperationalCenterSnapshot(),
    listAutomationHistoryAction(),
  ]);
  const partial: string[] = [];
  const agenda =
    results[0].status === "fulfilled"
      ? results[0].value.filter((event) => event.orderId === id)
      : (partial.push("Cronograma"), []);
  const financialResult =
    results[1].status === "fulfilled" && results[1].value.ok
      ? results[1].value.data
      : (partial.push("Financeiro"), undefined);
  const transactions = (financialResult?.transactions ?? []).filter(
    (transaction) =>
      transaction.serviceOrderId === id &&
      !transaction.archivedAt &&
      !transaction.canceledAt,
  );
  const stockResult =
    results[2].status === "fulfilled" && results[2].value.ok
      ? results[2].value.data
      : (partial.push("Materiais"), []);
  const reservations = stockResult.flatMap((snapshot) =>
    snapshot.reservations.filter(
      (reservation) => reservation.serviceOrderId === id && !reservation.archivedAt,
    ),
  );
  const movements = stockResult.flatMap((snapshot) =>
    snapshot.movements.filter(
      (movement) => movement.serviceOrderId === id && !movement.canceledAt,
    ),
  );
  const equipmentResult =
    results[3].status === "fulfilled" && results[3].value.ok
      ? results[3].value.data
      : (partial.push("Equipamentos"), undefined);
  const links =
    equipmentResult?.serviceOrderLinks.filter(
      (link) => link.serviceOrderId === id && !link.unlinkedAt,
    ) ?? [];
  const linkedAssetIds = new Set([
    ...links.map((link) => link.assetId),
    ...(equipmentResult?.maintenanceRecords
      .filter((record) => record.serviceOrderId === id)
      .map((record) => record.assetId) ?? []),
  ]);
  const pricingReport =
    results[4].status === "fulfilled" && results[4].value.ok
      ? results[4].value.data
      : (partial.push("Rentabilidade"), undefined);
  const application = pricingReport?.simulations
    .flatMap((simulation) => simulation.applications)
    .filter((item) => item.serviceOrderId === id && !item.superseded)
    .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))[0];
  const operational =
    results[5].status === "fulfilled"
      ? results[5].value
      : (partial.push("Análises operacionais"), undefined);
  const automations =
    results[6].status === "fulfilled"
      ? results[6].value.filter((entry) => entry.entityId === id)
      : (partial.push("Automações"), []);

  const income = transactions.filter((item) => item.direction === "INCOME");
  const expenses = transactions.filter((item) => item.direction === "EXPENSE");
  const receivedCents = income.reduce(
    (sum, item) => sum + activePaymentCents(item),
    0,
  );
  const paidCents = expenses.reduce(
    (sum, item) => sum + activePaymentCents(item),
    0,
  );
  const pricingCostCents = application
    ? application.priceCents - application.profitCents
    : undefined;
  const costs = consolidateCosts([
    ...(pricingCostCents === undefined
      ? []
      : [{
          id: `pricing-${id}`,
          source: "PRICING" as const,
          category: "Precificação",
          description: "Custo previsto da precificação aplicada",
          valueCents: pricingCostCents,
          date: application?.appliedAt,
          status: "ESTIMATED" as const,
          reference: application?.serviceOrderId ?? id,
        }]),
    ...movements
      .filter((movement) => movement.type === "CONSUMPTION")
      .map((movement) => ({
        id: movement.id,
        source: "STOCK" as const,
        category: "Materiais",
        description: movement.reason || "Material consumido",
        valueCents: movement.totalCostCents,
        date: movement.date,
        status: "REALIZED" as const,
        reference: movement.id,
      })),
    ...expenses.map((transaction) => ({
      id: transaction.id,
      source: "FINANCE" as const,
      category: transaction.category || "Sem categoria",
      description: transaction.title,
      valueCents: activePaymentCents(transaction),
      date: transaction.realizedAt || transaction.competenceDate,
      status: "REALIZED" as const,
      reference: transaction.id,
    })),
  ]);
  const realizedCostCents = costs
    .filter((cost) => cost.status === "REALIZED")
    .reduce((sum, cost) => sum + cost.valueCents, 0);
  const profitability = calculateProfitability({
    expectedRevenueCents: Math.round(order.estimatedValue * 100),
    realizedRevenueCents: receivedCents,
    expectedCostCents: pricingCostCents,
    realizedCostCents,
  });
  const progress = calculateOperationalProgress({
    orderStatus: order.status,
    checklist: order.checklist.map((item) => ({
      status: item.status,
      required: item.required,
    })),
    agenda: agenda.map((event) => ({ status: event.status })),
    hasMaterialPlan: order.reservedMaterials.length > 0 || reservations.length > 0,
    hasConfirmedMaterials: movements.some(
      (movement) => movement.type === "CONSUMPTION",
    ),
    hasEquipmentDefinition:
      order.equipment.length > 0 || linkedAssetIds.size > 0,
    executionStatus: order.execution?.status,
    hasTechnicalReport: Boolean(order.technicalReport?.updatedAt),
    hasFinancialRecord: transactions.length > 0,
  });
  return {
    order,
    agenda,
    financial: {
      transactions,
      revenueCents: income.reduce((sum, item) => sum + item.totalCents, 0),
      expenseCents: expenses.reduce((sum, item) => sum + item.totalCents, 0),
      receivedCents,
      paidCents,
    },
    stock: { snapshots: stockResult, reservations, movements },
    equipment: {
      assets: equipmentResult?.assets.filter((asset) => linkedAssetIds.has(asset.id)) ?? [],
      maintenance:
        equipmentResult?.maintenanceRecords.filter(
          (record) => record.serviceOrderId === id,
        ) ?? [],
    },
    pricing: application
      ? {
          costCents: application.priceCents - application.profitCents,
          profitCents: application.profitCents,
          marginBasisPoints: application.marginBasisPoints,
        }
      : undefined,
    progress,
    costs,
    profitability,
    insights:
      operational?.insights.filter(
        (insight) =>
          insight.id.includes(id) ||
          insight.action.href === `/dashboard/ordens/${id}`,
      ) ?? [],
    automations,
    partial,
  };
}

export const saveProjetoChecklist = (
  serviceOrderId: string,
  items: OrdemChecklistItem[],
) => updateOrdemChecklistAction(serviceOrderId, items);
