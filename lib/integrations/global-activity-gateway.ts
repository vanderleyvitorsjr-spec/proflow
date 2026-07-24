import { listClientsReportAction } from "@/app/dashboard/clientes/actions";
import { listServiceOrdersReportAction } from "@/app/dashboard/ordens/ordens-actions";
import { listAgendaReportAction } from "@/app/dashboard/agenda/agenda-actions";
import { listTechnicalDocumentsAction } from "@/app/dashboard/biblioteca-tecnica/biblioteca-tecnica-actions";
import { listPricingReportAction } from "@/app/dashboard/precificacao/precificacao-actions";
import { listCrmReportAction } from "@/features/crm/crm-actions";
import { listFinancialReportAction } from "@/app/dashboard/financeiro/financeiro-actions";
import { listStockReportAction } from "@/app/dashboard/estoque/estoque-actions";
import { listEquipmentReportAction } from "@/app/dashboard/equipamentos/equipamentos-actions";
import type { GlobalActivity } from "@/lib/contracts/global-activity.contract";
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
  return {
    items: items.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 100),
    partial: settled.some((x) => x.status === "rejected"),
  };
}
