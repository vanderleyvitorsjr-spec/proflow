import type { AgendaDisplayEvent } from "@/app/dashboard/agenda/agenda-types";
import type { ClientRecord } from "@/app/dashboard/clientes/clientes-data";
import type { EquipmentStorageState } from "@/app/dashboard/equipamentos/equipamentos-types";
import type { FinancialStorageState } from "@/app/dashboard/financeiro/financeiro-types";
import type { OrdemRecord } from "@/app/dashboard/ordens/ordens-types";
import type { StockSnapshot } from "@/app/dashboard/estoque/estoque-types";
import type { CrmLeadRecord } from "@/features/crm/crm-types";

export type OperationalInsightPriority = "CRITICAL" | "WARNING" | "INFO";
export type OperationalInsightModule =
  | "CLIENTS"
  | "CRM"
  | "AGENDA"
  | "ORDERS"
  | "STOCK"
  | "EQUIPMENT"
  | "FINANCE";

export type OperationalInsight = {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: OperationalInsightPriority;
  module: OperationalInsightModule;
  action: { label: string; href: string };
  detectedAt: string;
};

export type OperationalInsightSources = {
  clients: ClientRecord[];
  leads: CrmLeadRecord[];
  agenda: AgendaDisplayEvent[];
  orders: OrdemRecord[];
  stock: StockSnapshot[];
  equipment?: EquipmentStorageState;
  financial?: FinancialStorageState;
};

const day = 86_400_000;
const terminalAgenda = new Set(["COMPLETED", "CANCELED"]);
const terminalOrders = new Set(["COMPLETED", "CANCELED"]);

function digits(value?: string) {
  return value?.replace(/\D/g, "") ?? "";
}

function ageInDays(value: string | undefined, now: Date) {
  if (!value) return 0;
  return Math.floor((now.getTime() - new Date(value).getTime()) / day);
}

function missingResponsible(value?: string) {
  const normalized = value?.trim().toLocaleLowerCase("pt-BR") ?? "";
  return !normalized || normalized.includes("não definido") || normalized.includes("sem responsável");
}

function activePayments(transaction: FinancialStorageState["transactions"][number]) {
  return transaction.installments.reduce(
    (sum, installment) =>
      sum +
      installment.payments.reduce(
        (paymentSum, payment) =>
          paymentSum + (payment.reversedAt ? 0 : payment.amountCents),
        0,
      ),
    0,
  );
}

export function analyzeOperationalInsights(
  sources: OperationalInsightSources,
  now = new Date(),
): OperationalInsight[] {
  const insights: Array<Omit<OperationalInsight, "detectedAt">> = [];
  const activeClients = sources.clients.filter((client) => !client.deletedAt);
  const ordersByClient = new Set(sources.orders.map((order) => order.clientId));

  for (const client of activeClients) {
    const href = `/dashboard/clientes/${client.id}`;
    if (!digits(client.phone))
      insights.push({ id: `client-phone-${client.id}`, type: "MISSING_PHONE", title: "Cliente sem telefone", description: `${client.name} não possui telefone para contato.`, priority: "WARNING", module: "CLIENTS", action: { label: "Completar cadastro", href } });
    if (!client.email?.trim())
      insights.push({ id: `client-email-${client.id}`, type: "MISSING_EMAIL", title: "Cliente sem e-mail", description: `${client.name} não possui e-mail cadastrado.`, priority: "INFO", module: "CLIENTS", action: { label: "Abrir cliente", href } });
    if (!client.street?.trim() || !client.city.trim() || !client.state.trim())
      insights.push({ id: `client-address-${client.id}`, type: "MISSING_ADDRESS", title: "Cliente sem endereço completo", description: `Revise o endereço de ${client.name} antes do atendimento.`, priority: "WARNING", module: "CLIENTS", action: { label: "Completar endereço", href } });
    if (!ordersByClient.has(client.id))
      insights.push({ id: `client-without-service-${client.id}`, type: "NO_SERVICE", title: "Cliente sem atendimento", description: `${client.name} ainda não possui Ordem de Serviço.`, priority: "INFO", module: "CLIENTS", action: { label: "Abrir cliente", href } });
  }

  const duplicateKeys = new Map<string, ClientRecord[]>();
  for (const client of activeClients) {
    for (const key of [digits(client.phone), digits(client.document)].filter(Boolean)) {
      duplicateKeys.set(key, [...(duplicateKeys.get(key) ?? []), client]);
    }
  }
  for (const [key, clients] of duplicateKeys) {
    if (clients.length < 2) continue;
    insights.push({ id: `client-duplicate-${key}`, type: "DUPLICATE", title: "Possíveis clientes duplicados", description: `${clients.map((client) => client.name).join(" e ")} compartilham telefone ou documento.`, priority: "CRITICAL", module: "CLIENTS", action: { label: "Revisar clientes", href: "/dashboard/clientes" } });
  }

  for (const lead of sources.leads.filter((item) => !item.archivedAt && !item.convertedAt)) {
    const inactiveDays = ageInDays(lead.updatedAt, now);
    const href = `/dashboard/crm/${lead.id}`;
    if (missingResponsible(lead.salesOwner))
      insights.push({ id: `crm-owner-${lead.id}`, type: "MISSING_OWNER", title: "Oportunidade sem responsável", description: `${lead.name} precisa de um responsável comercial.`, priority: "CRITICAL", module: "CRM", action: { label: "Abrir oportunidade", href } });
    if (inactiveDays > 30)
      insights.push({ id: `crm-old-${lead.id}`, type: "OLD_OPPORTUNITY", title: "Oportunidade antiga sem movimentação", description: `${lead.name} está há ${inactiveDays} dias sem atualização.`, priority: "CRITICAL", module: "CRM", action: { label: "Retomar oportunidade", href } });
    else if (inactiveDays > 14)
      insights.push({ id: `crm-forgotten-${lead.id}`, type: "FORGOTTEN", title: "Oportunidade esquecida", description: `${lead.name} não recebe atenção há ${inactiveDays} dias.`, priority: "WARNING", module: "CRM", action: { label: "Revisar oportunidade", href } });
    else if (inactiveDays > 7)
      insights.push({ id: `crm-inactive-${lead.id}`, type: "NO_RECENT_ACTIVITY", title: "Oportunidade sem atividade recente", description: `${lead.name} está há ${inactiveDays} dias sem movimentação.`, priority: "WARNING", module: "CRM", action: { label: "Registrar acompanhamento", href } });
  }

  const activeEvents = sources.agenda.filter((event) => !terminalAgenda.has(event.status));
  for (const event of activeEvents) {
    const href = event.orderId ? `/dashboard/ordens/${event.orderId}` : `/dashboard/agenda/${event.id}`;
    if (new Date(event.endAt).getTime() < now.getTime())
      insights.push({ id: `agenda-overdue-${event.id}`, type: "OVERDUE_APPOINTMENT", title: "Compromisso vencido", description: `${event.title} terminou sem conclusão registrada.`, priority: "CRITICAL", module: "AGENDA", action: { label: "Abrir compromisso", href } });
    if (missingResponsible(event.technician))
      insights.push({ id: `agenda-owner-${event.id}`, type: "MISSING_OWNER", title: "Compromisso sem responsável", description: `${event.title} ainda não possui responsável.`, priority: "WARNING", module: "AGENDA", action: { label: "Definir responsável", href } });
  }
  const eventsByResponsible = new Map<string, AgendaDisplayEvent[]>();
  for (const event of activeEvents.filter((item) => !missingResponsible(item.technician))) {
    const key = event.technician.trim().toLocaleLowerCase("pt-BR");
    eventsByResponsible.set(key, [...(eventsByResponsible.get(key) ?? []), event]);
  }
  for (const events of eventsByResponsible.values()) {
    const ordered = events.sort((a, b) => a.startAt.localeCompare(b.startAt));
    for (let index = 1; index < ordered.length; index += 1) {
      const previous = ordered[index - 1]!;
      const current = ordered[index]!;
      if (new Date(current.startAt).getTime() < new Date(previous.endAt).getTime())
        insights.push({ id: `agenda-conflict-${previous.id}-${current.id}`, type: "SCHEDULE_CONFLICT", title: "Conflito de horário", description: `${current.technician} possui compromissos sobrepostos.`, priority: "CRITICAL", module: "AGENDA", action: { label: "Abrir Agenda", href: "/dashboard/agenda" } });
    }
  }

  const agendaOrderIds = new Set(sources.agenda.map((event) => event.orderId).filter(Boolean));
  for (const order of sources.orders.filter((item) => !item.archivedAt && !item.canceledAt)) {
    const href = `/dashboard/ordens/${order.id}`;
    if (!terminalOrders.has(order.status) && ageInDays(order.createdAt, now) > 14)
      insights.push({ id: `order-old-${order.id}`, type: "OPEN_TOO_LONG", title: "Ordem aberta há muito tempo", description: `${order.orderNumber} está aberta há ${ageInDays(order.createdAt, now)} dias.`, priority: "WARNING", module: "ORDERS", action: { label: "Abrir Ordem", href } });
    if (!terminalOrders.has(order.status) && missingResponsible(order.technician))
      insights.push({ id: `order-technician-${order.id}`, type: "MISSING_TECHNICIAN", title: "Ordem sem técnico", description: `${order.orderNumber} precisa de um técnico responsável.`, priority: "CRITICAL", module: "ORDERS", action: { label: "Definir técnico", href } });
    if (!terminalOrders.has(order.status) && !agendaOrderIds.has(order.id))
      insights.push({ id: `order-agenda-${order.id}`, type: "MISSING_SCHEDULE", title: "Ordem sem Agenda vinculada", description: `${order.orderNumber} não possui compromisso vinculado na Agenda.`, priority: "WARNING", module: "ORDERS", action: { label: "Abrir Ordem", href } });
    const receipts = sources.financial?.transactions.filter((transaction) => transaction.serviceOrderId === order.id && transaction.direction === "INCOME" && !transaction.canceledAt && !transaction.archivedAt) ?? [];
    const received = receipts.reduce((sum, transaction) => sum + (transaction.kind === "REALIZED" ? transaction.totalCents : activePayments(transaction)), 0);
    if (order.status === "COMPLETED" && received <= 0)
      insights.push({ id: `order-payment-${order.id}`, type: "MISSING_RECEIPT", title: "Ordem concluída sem recebimento", description: `${order.orderNumber} foi concluída e não possui recebimento registrado.`, priority: "CRITICAL", module: "ORDERS", action: { label: "Abrir Ordem", href } });
  }

  for (const snapshot of sources.stock.filter((entry) => entry.item.active && !entry.item.archivedAt)) {
    const { item } = snapshot;
    const href = `/dashboard/estoque/${item.id}`;
    if (snapshot.availableQuantity <= item.minimumQuantity)
      insights.push({ id: `stock-low-${item.id}`, type: "LOW_STOCK", title: "Estoque abaixo do mínimo", description: `${item.name} possui ${snapshot.availableQuantity / item.unitScale} disponível(is).`, priority: snapshot.availableQuantity <= 0 ? "CRITICAL" : "WARNING", module: "STOCK", action: { label: "Abrir Estoque", href } });
    if (!snapshot.movements.some((movement) => ["EXIT", "CONSUMPTION"].includes(movement.type) && !movement.canceledAt))
      insights.push({ id: `stock-unused-${item.id}`, type: "NEVER_USED", title: "Item nunca utilizado", description: `${item.name} não possui saída ou consumo registrado.`, priority: "INFO", module: "STOCK", action: { label: "Abrir item", href } });
    if (!item.supplierReference?.trim())
      insights.push({ id: `stock-supplier-${item.id}`, type: "MISSING_SUPPLIER", title: "Material sem fornecedor", description: `${item.name} não possui fornecedor preferencial.`, priority: "INFO", module: "STOCK", action: { label: "Completar cadastro", href } });
    if (!item.location.name.trim())
      insights.push({ id: `stock-location-${item.id}`, type: "MISSING_LOCATION", title: "Material sem localização", description: `${item.name} não possui localização física definida.`, priority: "WARNING", module: "STOCK", action: { label: "Definir localização", href } });
  }

  for (const asset of sources.equipment?.assets.filter((item) => !item.archivedAt) ?? []) {
    const href = `/dashboard/equipamentos/${asset.id}`;
    if (asset.warranty?.endDate && new Date(`${asset.warranty.endDate}T23:59:59`).getTime() < now.getTime())
      insights.push({ id: `equipment-warranty-${asset.id}`, type: "EXPIRED_WARRANTY", title: "Garantia vencida", description: `A garantia de ${asset.name} está vencida.`, priority: "WARNING", module: "EQUIPMENT", action: { label: "Abrir equipamento", href } });
    if (asset.ownership === "CUSTOMER" && !asset.clientId)
      insights.push({ id: `equipment-client-${asset.id}`, type: "MISSING_CLIENT", title: "Equipamento sem cliente", description: `${asset.name} pertence a cliente, mas não possui vínculo cadastrado.`, priority: "CRITICAL", module: "EQUIPMENT", action: { label: "Vincular cliente", href } });
  }
  for (const maintenance of sources.equipment?.maintenanceRecords ?? []) {
    if (maintenance.type === "PREVENTIVE" && !["COMPLETED", "CANCELED"].includes(maintenance.status) && new Date(maintenance.scheduledAt).getTime() < now.getTime())
      insights.push({ id: `equipment-maintenance-${maintenance.id}`, type: "OVERDUE_PREVENTIVE", title: "Manutenção preventiva vencida", description: `${maintenance.title} está com a data preventiva vencida.`, priority: "CRITICAL", module: "EQUIPMENT", action: { label: "Abrir equipamento", href: `/dashboard/equipamentos/${maintenance.assetId}` } });
  }

  for (const transaction of sources.financial?.transactions.filter((item) => !item.canceledAt && !item.archivedAt) ?? []) {
    const href = `/dashboard/financeiro/${transaction.id}`;
    const hasOverdue = transaction.installments.some((installment) => !installment.canceledAt && new Date(`${installment.dueDate}T23:59:59`).getTime() < now.getTime() && activePayments({ ...transaction, installments: [installment] }) < installment.amountCents);
    if (hasOverdue)
      insights.push({ id: `finance-overdue-${transaction.id}`, type: transaction.kind === "RECEIVABLE" ? "LATE_RECEIPT" : "OVERDUE_ACCOUNT", title: transaction.kind === "RECEIVABLE" ? "Recebimento atrasado" : "Conta vencida", description: `${transaction.title} possui saldo vencido.`, priority: "CRITICAL", module: "FINANCE", action: { label: "Abrir lançamento", href } });
    if (!transaction.category.trim())
      insights.push({ id: `finance-category-${transaction.id}`, type: "MISSING_CATEGORY", title: "Lançamento sem categoria", description: `${transaction.title} precisa de uma categoria financeira.`, priority: "WARNING", module: "FINANCE", action: { label: "Revisar lançamento", href } });
  }

  const rank = { CRITICAL: 0, WARNING: 1, INFO: 2 } as const;
  const sourceDate = (insight: Omit<OperationalInsight, "detectedAt">) => {
    if (insight.module === "CLIENTS") {
      const record = activeClients.find((item) => insight.id.includes(item.id));
      return record?.updatedAt ?? record?.createdAt;
    }
    if (insight.module === "CRM") {
      return sources.leads.find((item) => insight.id.includes(item.id))?.updatedAt;
    }
    if (insight.module === "AGENDA") {
      const event = sources.agenda.find((item) => insight.id.includes(item.id));
      return event?.updatedAt ?? event?.startAt;
    }
    if (insight.module === "ORDERS") {
      return sources.orders.find((item) => insight.id.includes(item.id))?.updatedAt;
    }
    if (insight.module === "STOCK") {
      return sources.stock.find((item) => insight.id.includes(item.item.id))?.item.updatedAt;
    }
    if (insight.module === "EQUIPMENT") {
      const asset = sources.equipment?.assets.find((item) => insight.id.includes(item.id));
      const maintenance = sources.equipment?.maintenanceRecords.find((item) =>
        insight.id.includes(item.id),
      );
      return maintenance?.updatedAt ?? asset?.updatedAt;
    }
    return sources.financial?.transactions.find((item) => insight.id.includes(item.id))
      ?.updatedAt;
  };
  return insights
    .map((insight) => ({
      ...insight,
      detectedAt: sourceDate(insight) ?? now.toISOString(),
    }))
    .sort(
      (a, b) =>
        rank[a.priority] - rank[b.priority] ||
        b.detectedAt.localeCompare(a.detectedAt) ||
        a.title.localeCompare(b.title, "pt-BR"),
    );
}
