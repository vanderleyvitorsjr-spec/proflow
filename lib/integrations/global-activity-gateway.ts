import { listClientsReportAction } from "@/app/dashboard/clientes/actions";
import { listServiceOrdersReportAction } from "@/app/dashboard/_ordens/ordens-actions";
import { listAgendaReportAction } from "@/app/dashboard/_agenda/agenda-actions";
import { listTechnicalDocumentsAction } from "@/app/dashboard/_biblioteca-tecnica/biblioteca-tecnica-actions";
import { listPricingReportAction } from "@/app/dashboard/precificacao/precificacao-actions";
import { listCrmReportAction } from "@/features/crm/crm-actions";
import { listFinancialReportAction } from "@/app/dashboard/financeiro/financeiro-actions";
import { listStockReportAction } from "@/app/dashboard/_estoque/estoque-actions";
import { listEquipmentReportAction } from "@/app/dashboard/_equipamentos/equipamentos-actions";
import type { GlobalActivity } from "@/lib/contracts/global-activity.contract";
import { uniqueGlobalActivities } from "@/lib/contracts/global-activity.contract";
import { listExecutiveGoalsAction } from "@/features/dashboard/goals/executive-goals-actions";
import { listOperationalItemStatesAction } from "@/app/dashboard/_central-operacional/central-operacional-state-actions";
import { listAllProjetoWorkspaceNotesAction } from "@/app/dashboard/_projetos/[id]/projeto-workspace-notes-actions";
import { getWorkspaceOperationsAction } from "@/app/dashboard/_projetos/[id]/workspace-operations-actions";
import { listQuotesAction } from "@/app/dashboard/_orcamentos/orcamentos-actions";
import { listPurchasesAction } from "@/app/dashboard/_fornecedores/compras-actions";
import { listAllEquipmentTechnicalHistoryAction } from "@/app/dashboard/_equipamentos/equipamento-tecnico-actions";
export async function loadGlobalActivities() {
  const settled = await Promise.allSettled([
      listClientsReportAction(),
      listServiceOrdersReportAction(),
      listAgendaReportAction(),
      listTechnicalDocumentsAction(),
      listPricingReportAction(),
      listCrmReportAction(),
      listFinancialReportAction(),
      listStockReportAction(),
      listEquipmentReportAction(),
      listExecutiveGoalsAction(),
      listOperationalItemStatesAction(),
      listAllProjetoWorkspaceNotesAction(),
      getWorkspaceOperationsAction(),
      listQuotesAction(),
      listPurchasesAction(),
      listAllEquipmentTechnicalHistoryAction(),
    ]),
    items: GlobalActivity[] = [];
  if (settled[0].status === "fulfilled")
    for (const x of settled[0].value)
      items.push({
        id: `CLIENT:${x.id}:${x.updatedAt ?? x.createdAt}`,
        source: "CLIENTS",
        sourceId: x.id,
        sourceLabel: "Clientes",
        type: "UPDATED",
        title: "Cliente atualizado",
        description: x.name,
        occurredAt: x.updatedAt ?? x.createdAt,
        clientId: x.id,
        link: `/dashboard/clientes/${x.id}`,
      });
  if (settled[1].status === "fulfilled")
    for (const x of settled[1].value)
      items.push({
        id: `ORDER:${x.id}:${x.updatedAt}`,
        source: "ORDERS",
        sourceId: x.id,
        sourceLabel: "Ordens",
        type: x.status,
        title: `OS ${x.status}`,
        description: x.category,
        occurredAt: x.updatedAt,
        clientId: x.clientId,
        serviceOrderId: x.id,
        link: `/dashboard/ordens/${x.id}`,
      });
  if (settled[2].status === "fulfilled")
    for (const x of settled[2].value)
      items.push({
        id: `AGENDA:${x.id}:${x.startAt}`,
        source: "AGENDA",
        sourceId: x.id,
        sourceLabel: "Agenda",
        type: x.status,
        title: "Evento de agenda",
        description: x.type,
        occurredAt: x.startAt,
        serviceOrderId: x.orderId,
        link: `/dashboard/agenda/${x.id}`,
      });
  if (settled[3].status === "fulfilled")
    for (const x of settled[3].value.documents)
      for (const h of x.history)
        items.push({
          id: `LIBRARY:${x.id}:${h.id}`,
          source: "LIBRARY",
          sourceId: x.id,
          sourceLabel: "Biblioteca",
          type: h.type,
          title: x.title,
          description: h.description,
          occurredAt: h.occurredAt,
          link: `/dashboard/biblioteca-tecnica/${x.id}`,
        });
  if (settled[4].status === "fulfilled" && settled[4].value.ok)
    for (const x of settled[4].value.data.simulations)
      items.push({
        id: `PRICING:${x.id}:${x.updatedAt}`,
        source: "PRICING",
        sourceId: x.id,
        sourceLabel: "Precificação",
        type: x.status,
        title: "Precificação atualizada",
        description: x.category,
        occurredAt: x.updatedAt,
        link: `/dashboard/precificacao/${x.id}`,
      });
  if (settled[5].status === "fulfilled")
    for (const x of settled[5].value)
      items.push({
        id: `CRM:${x.id}:${x.updatedAt}`,
        source: "CRM",
        sourceId: x.id,
        sourceLabel: "CRM",
        type: x.stage,
        title: "Lead atualizado",
        description: x.serviceInterest,
        occurredAt: x.updatedAt,
        link: `/dashboard/crm/${x.id}`,
      });
  if (settled[6].status === "fulfilled" && settled[6].value.ok)
    for (const x of settled[6].value.data.transactions)
      items.push({
        id: `FINANCE:${x.id}:${x.realizedAt}`,
        source: "FINANCE",
        sourceId: x.id,
        sourceLabel: "Financeiro",
        type: x.canceled ? "CANCELED" : x.kind,
        title: x.title,
        occurredAt: x.realizedAt,
        clientId: x.clientId,
        serviceOrderId: x.serviceOrderId,
        link: `/dashboard/financeiro/${x.id}`,
      });
  if (settled[7].status === "fulfilled" && settled[7].value.ok)
    for (const x of settled[7].value.data.movements)
      items.push({
        id: `STOCK:${x.id}:${x.date}`,
        source: "STOCK",
        sourceId: x.id,
        sourceLabel: "Estoque",
        type: x.type,
        title: "Movimentação de estoque",
        description: x.source,
        occurredAt: x.date,
        serviceOrderId: x.serviceOrderId,
        link: `/dashboard/estoque/${x.itemId}`,
      });
  if (settled[8].status === "fulfilled" && settled[8].value.ok)
    for (const x of settled[8].value.data.maintenance)
      items.push({
        id: `EQUIPMENT:${x.id}:${x.completedAt ?? x.scheduledAt}`,
        source: "EQUIPMENT",
        sourceId: x.id,
        sourceLabel: "Equipamentos",
        type: x.status,
        title: "Manutenção de equipamento",
        description: x.type,
        occurredAt: x.completedAt ?? x.scheduledAt,
        serviceOrderId: x.serviceOrderId,
        link: `/dashboard/equipamentos/${x.assetId}`,
      });
  if (settled[9].status === "fulfilled")
    for (const goal of settled[9].value)
      for (const history of goal.history)
        items.push({
          id: `GOAL:${goal.id}:${history.id}`,
          source: "GOALS",
          sourceId: goal.id,
          sourceLabel: "Metas",
          type: history.type,
          title: goal.name,
          description: history.description,
          occurredAt: history.createdAt,
          entity: "Meta",
          entityId: goal.id,
          status: "RECORDED",
          link: "/dashboard/relatorios",
        });
  if (settled[10].status === "fulfilled")
    for (const state of settled[10].value.items)
      for (const history of state.history ?? [])
        items.push({
          id: `OPERATIONAL:${state.insightId}:${history.id}`,
          source: "PENDING_ITEMS",
          sourceId: state.insightId,
          sourceLabel: "Pendências",
          type: history.type,
          title:
            history.type === "SNOOZED"
              ? "Pendência Adiada"
              : history.type === "RESOLVED"
                ? "Pendência Resolvida"
                : "Pendência Reaberta",
          description: history.reason,
          occurredAt: history.occurredAt,
          actorName: history.responsible,
          responsibleName: history.responsible,
          entity: "Pendência",
          entityId: state.insightId,
          status: history.type,
          link: "/dashboard/central-operacional",
        });
  if (settled[11].status === "fulfilled")
    for (const note of settled[11].value)
      items.push({
        id: `WORKSPACE_NOTE:${note.id}`,
        source: "NOTES",
        sourceId: note.id,
        sourceLabel: "Observações",
        type: note.pinned ? "NOTE_PINNED" : "NOTE_ADDED",
        title: note.pinned ? "Observação Fixada" : "Observação Adicionada",
        description: note.text,
        occurredAt: note.createdAt,
        serviceOrderId: note.serviceOrderId,
        entity: "Ordem de Serviço",
        entityId: note.serviceOrderId,
        status: "RECORDED",
        link: `/dashboard/projetos/${note.serviceOrderId}`,
      });
  if (settled[12].status === "fulfilled")
    for (const operation of settled[12].value.events)
      items.push({
        id: `WORKSPACE_OPERATION:${operation.id}`,
        source:
          operation.type === "TEAM_UPDATED"
            ? "TEAM"
            : operation.type === "MATERIAL_UPDATED"
              ? "MATERIALS"
              : "COSTS",
        sourceId: operation.id,
        sourceLabel:
          operation.type === "TEAM_UPDATED"
            ? "Equipe"
            : operation.type === "MATERIAL_UPDATED"
              ? "Materiais"
              : "Custos",
        type: operation.type,
        title: operation.title,
        description: operation.description,
        occurredAt: operation.occurredAt,
        serviceOrderId: operation.serviceOrderId,
        entity: "Ordem de Serviço",
        entityId: operation.serviceOrderId,
        status: "RECORDED",
        link: `/dashboard/projetos/${operation.serviceOrderId}`,
      });
  if (settled[13].status === "fulfilled")
    for (const quote of settled[13].value)
      for (const event of quote.history)
        items.push({
          id: `QUOTE:${quote.id}:${event.id}`, source: "QUOTES", sourceId: quote.id,
          sourceLabel: "Orçamentos", type: event.type, title: quote.number,
          description: event.description, occurredAt: event.createdAt, clientId: quote.clientId,
          serviceOrderId: quote.serviceOrderId, entity: "Orçamento", entityId: quote.id,
          status: "RECORDED", link: "/dashboard/orcamentos",
        });
  if (settled[14].status === "fulfilled") {
    for (const quotation of settled[14].value.quotations)
      items.push({
        id: `QUOTATION:${quotation.id}:${quotation.updatedAt}`, source: "PURCHASES",
        sourceId: quotation.id, sourceLabel: "Compras", type: quotation.status,
        title: quotation.number, description: quotation.title, occurredAt: quotation.updatedAt,
        serviceOrderId: quotation.serviceOrderId, entity: "Cotação", entityId: quotation.id,
        status: "RECORDED", link: "/dashboard/fornecedores/compras",
      });
    for (const order of settled[14].value.orders)
      items.push({
        id: `PURCHASE:${order.id}:${order.updatedAt}`, source: "PURCHASES",
        sourceId: order.id, sourceLabel: "Compras", type: order.status,
        title: order.number, description: order.supplierName, occurredAt: order.updatedAt,
        serviceOrderId: order.serviceOrderId, entity: "Pedido de Compra", entityId: order.id,
        status: "RECORDED", link: "/dashboard/fornecedores/compras",
      });
  }
  if (settled[15].status === "fulfilled")
    for (const event of settled[15].value.events)
      items.push({
        id: `EQUIPMENT_TECH:${event.id}`, source: "EQUIPMENT", sourceId: event.equipmentId,
        sourceLabel: "Equipamentos", type: event.type, title: event.title,
        description: event.description, occurredAt: event.occurredAt,
        responsibleName: event.responsible, serviceOrderId: event.serviceOrderId,
        entity: "Equipamento", entityId: event.equipmentId, status: "RECORDED",
        link: `/dashboard/equipamentos/${event.equipmentId}`,
      });
  return {
    items: uniqueGlobalActivities(items).slice(0, 150),
    partial: settled.some((x) => x.status === "rejected"),
  };
}
