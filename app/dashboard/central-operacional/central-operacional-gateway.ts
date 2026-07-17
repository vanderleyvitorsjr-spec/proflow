import { listAgendaEventsAction } from "@/app/dashboard/agenda/agenda-actions";
import { listEquipmentReportAction } from "@/app/dashboard/equipamentos/equipamentos-actions";
import { listOrdensAction } from "@/app/dashboard/ordens/ordens-actions";
import { listStockReportAction } from "@/app/dashboard/estoque/estoque-actions";
import { normalizeProperName } from "@/lib/br-formatters";
import type { AgendaDisplayEvent } from "@/app/dashboard/agenda/agenda-types";
import type { OrdemRecord } from "@/app/dashboard/ordens/ordens-types";
import type {
  OperationalAlert,
  OperationalCenterSnapshot,
  OperationalSource,
  OperationalSourceStatus,
  TechnicianStatus,
} from "./central-operacional-types";

const terminalOrderStatuses = new Set(["COMPLETED", "CANCELED"]);
const terminalEventStatuses = new Set(["COMPLETED", "CANCELED"]);

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function sourceStatus(
  source: OperationalSource,
  result: PromiseSettledResult<unknown>,
  recordCount = 0,
): OperationalSourceStatus {
  return result.status === "fulfilled"
    ? { source, available: true, partial: false, recordCount }
    : {
        source,
        available: false,
        partial: false,
        recordCount: 0,
        error:
          result.reason instanceof Error
            ? result.reason.message
            : "Fonte indisponível.",
      };
}

function eventStart(event: AgendaDisplayEvent): number {
  return new Date(event.startAt).getTime();
}

function technicianStatuses(
  events: AgendaDisplayEvent[],
  now: Date,
): TechnicianStatus[] {
  const people = new Map<string, AgendaDisplayEvent[]>();
  for (const event of events) {
    const name = normalizeProperName(event.technician || "Sem responsável");
    if (!name || name === "Sem Responsável") continue;
    const list = people.get(name) ?? [];
    list.push(event);
    people.set(name, list);
  }
  return [...people.entries()]
    .map(([name, technicianEvents]) => {
      const ordered = technicianEvents.sort((a, b) => eventStart(a) - eventStart(b));
      const currentEvent = ordered.find((event) => {
        const start = new Date(event.startAt).getTime();
        const end = new Date(event.endAt).getTime();
        return start <= now.getTime() && end >= now.getTime() && !terminalEventStatuses.has(event.status);
      });
      const nextEvent = ordered.find(
        (event) => eventStart(event) > now.getTime() && !terminalEventStatuses.has(event.status),
      );
      return {
        id: name,
        name,
        status: currentEvent ? "BUSY" : nextEvent ? "UPCOMING" : "AVAILABLE",
        currentEvent,
        nextEvent,
      } satisfies TechnicianStatus;
    })
    .sort((a, b) => {
      const priority = { BUSY: 0, UPCOMING: 1, AVAILABLE: 2 } as const;
      return priority[a.status] - priority[b.status] || a.name.localeCompare(b.name, "pt-BR");
    });
}

function orderDate(order: OrdemRecord): number {
  return new Date(`${order.scheduledDate}T${order.scheduledTime}:00`).getTime();
}

function buildAlerts(input: {
  overdue: OrdemRecord[];
  withoutTechnician: OrdemRecord[];
  lowCount: number;
  outCount: number;
  overdueMaintenanceCount: number;
  inMaintenanceCount: number;
}): OperationalAlert[] {
  const alerts: OperationalAlert[] = [];
  if (input.overdue.length)
    alerts.push({
      id: "orders-overdue",
      level: "CRITICAL",
      title: `${input.overdue.length} OS atrasada(s)`,
      description: "Existem Ordens com horário vencido e execução ainda não concluída.",
      link: "/dashboard/ordens?status=OVERDUE",
    });
  if (input.withoutTechnician.length)
    alerts.push({
      id: "orders-without-technician",
      level: "WARNING",
      title: `${input.withoutTechnician.length} OS sem responsável`,
      description: "Atribua um técnico antes do início do atendimento.",
      link: "/dashboard/ordens",
    });
  if (input.outCount)
    alerts.push({
      id: "stock-out",
      level: "CRITICAL",
      title: `${input.outCount} item(ns) sem estoque`,
      description: "Revise os materiais indisponíveis antes dos próximos atendimentos.",
      link: "/dashboard/estoque?balance=OUT_OF_STOCK",
    });
  if (input.lowCount)
    alerts.push({
      id: "stock-low",
      level: "WARNING",
      title: `${input.lowCount} item(ns) abaixo do mínimo`,
      description: "Considere programar reposição para evitar interrupções.",
      link: "/dashboard/estoque?balance=LOW_STOCK",
    });
  if (input.overdueMaintenanceCount)
    alerts.push({
      id: "maintenance-overdue",
      level: "CRITICAL",
      title: `${input.overdueMaintenanceCount} manutenção(ões) vencida(s)`,
      description: "Equipamentos com manutenção vencida precisam de revisão.",
      link: "/dashboard/equipamentos",
    });
  if (input.inMaintenanceCount)
    alerts.push({
      id: "equipment-maintenance",
      level: "INFO",
      title: `${input.inMaintenanceCount} equipamento(s) em manutenção`,
      description: "Confirme a disponibilidade antes de atribuir ativos às Ordens.",
      link: "/dashboard/equipamentos",
    });
  return alerts;
}

export async function loadOperationalCenterSnapshot(): Promise<OperationalCenterSnapshot> {
  const now = new Date();
  const today = localDateKey(now);
  const settled = await Promise.allSettled([
    listOrdensAction(),
    listAgendaEventsAction(),
    listStockReportAction(),
    listEquipmentReportAction(),
  ]);
  const [ordersResult, agendaResult, stockResult, equipmentResult] = settled;
  const orders = ordersResult.status === "fulfilled" ? ordersResult.value : [];
  const events = agendaResult.status === "fulfilled" ? agendaResult.value : [];
  const stockResponse = stockResult.status === "fulfilled" ? stockResult.value : undefined;
  const equipmentResponse =
    equipmentResult.status === "fulfilled" ? equipmentResult.value : undefined;
  const stock = stockResponse && "ok" in stockResponse && stockResponse.ok ? stockResponse.data : undefined;
  const equipment =
    equipmentResponse && "ok" in equipmentResponse && equipmentResponse.ok
      ? equipmentResponse.data
      : undefined;

  const activeOrders = orders.filter((order) => !order.archivedAt && !order.canceledAt);
  const todayOrders = activeOrders
    .filter((order) => order.scheduledDate === today)
    .sort((a, b) => orderDate(a) - orderDate(b));
  const overdue = activeOrders.filter(
    (order) => !terminalOrderStatuses.has(order.status) && orderDate(order) < now.getTime(),
  );
  const inProgress = activeOrders.filter(
    (order) => order.status === "IN_PROGRESS" || order.execution?.status === "IN_PROGRESS",
  );
  const withoutTechnician = activeOrders.filter(
    (order) =>
      !terminalOrderStatuses.has(order.status) &&
      (!order.technician.trim() || order.technician.toLocaleLowerCase("pt-BR").includes("não definido")),
  );
  const todayEvents = events
    .filter((event) => event.startAt.slice(0, 10) === today)
    .sort((a, b) => eventStart(a) - eventStart(b));
  const upcoming = events
    .filter(
      (event) =>
        eventStart(event) > now.getTime() &&
        !terminalEventStatuses.has(event.status),
    )
    .sort((a, b) => eventStart(a) - eventStart(b))
    .slice(0, 8);

  const activeStockItems = stock?.items.filter((item) => item.active && !item.archivedAt) ?? [];
  const lowCount = activeStockItems.filter(
    (item) => item.physicalQuantity - item.reservedQuantity > 0 && item.physicalQuantity - item.reservedQuantity <= item.minimumQuantity,
  ).length;
  const outCount = activeStockItems.filter(
    (item) => item.physicalQuantity - item.reservedQuantity <= 0,
  ).length;
  const activeReservations = activeStockItems.reduce(
    (sum, item) => sum + (item.reservedQuantity > 0 ? 1 : 0),
    0,
  );

  const activeAssets = equipment?.assets.filter((asset) => !asset.archivedAt) ?? [];
  const inMaintenanceCount = activeAssets.filter((asset) => asset.status === "MAINTENANCE").length;
  const overdueMaintenanceCount =
    equipment?.maintenance.filter(
      (item) =>
        !item.canceledAt &&
        item.status !== "COMPLETED" &&
        new Date(item.scheduledAt).getTime() < now.getTime(),
    ).length ?? 0;
  const inThirtyDays = new Date(now.getTime() + 30 * 86400000).getTime();
  const expiringWarrantyCount = activeAssets.filter((asset) => {
    if (!asset.warrantyEndDate) return false;
    const end = new Date(`${asset.warrantyEndDate}T12:00:00`).getTime();
    return end >= now.getTime() && end <= inThirtyDays;
  }).length;

  return {
    generatedAt: now.toISOString(),
    sourceStatus: [
      sourceStatus("ORDERS", ordersResult, orders.length),
      sourceStatus("AGENDA", agendaResult, events.length),
      sourceStatus("STOCK", stockResult, stock?.items.length ?? 0),
      sourceStatus("EQUIPMENT", equipmentResult, activeAssets.length),
    ],
    orders: { today: todayOrders, overdue, inProgress, withoutTechnician },
    agenda: {
      today: todayEvents,
      upcoming,
      technicians: technicianStatuses(todayEvents, now),
    },
    stock: { lowCount, outCount, activeReservations },
    equipment: {
      inMaintenanceCount,
      overdueMaintenanceCount,
      expiringWarrantyCount,
    },
    alerts: buildAlerts({
      overdue,
      withoutTechnician,
      lowCount,
      outCount,
      overdueMaintenanceCount,
      inMaintenanceCount,
    }),
  };
}
