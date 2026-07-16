import type { ReportAgendaEvent } from "@/lib/contracts/relatorios-agenda.contract";
import type { ReportServiceOrder } from "@/lib/contracts/relatorios-ordens.contract";
import type { DateRange, ReportFilter, ReportSection } from "../relatorios-types";
import { countBy, ranking } from "./aggregation-engine";
import { deadlineCompliance } from "./formula-engine";
import { durationMinutes, inPeriod, monthKey, monthLabel } from "./date-engine";
import { chart, metric, monthsInRange, rankingItems, toReais } from "./report-builders";
const filterOrders = (items: ReportServiceOrder[], filters: ReportFilter) =>
  items.filter(
    (item) =>
      (!filters.clientId || item.clientId === filters.clientId) &&
      (!filters.technician || item.technician === filters.technician) &&
      (!filters.category || item.category === filters.category) &&
      (!filters.status || item.status === filters.status) &&
      (!filters.city || item.city === filters.city) &&
      (filters.includeArchived || !item.archivedAt),
  );
export function operationalSection(
  orders: ReportServiceOrder[] | undefined,
  agenda: ReportAgendaEvent[] | undefined,
  period: DateRange,
  previous: DateRange | undefined,
  filters: ReportFilter,
): ReportSection {
  const all = orders && filterOrders(orders, filters),
    current = all?.filter((item) => inPeriod(item.createdAt, period)),
    prev = previous
      ? all?.filter((item) => inPeriod(item.createdAt, previous))
      : undefined;
  const completed = all?.filter((item) => inPeriod(item.completedAt, period)),
    prevCompleted = previous
      ? all?.filter((item) => inPeriod(item.completedAt, previous))
      : undefined;
  const independentEvents = agenda?.filter(
    (item) =>
      item.origin === "INDEPENDENT" &&
      inPeriod(item.startAt, period) &&
      (!filters.technician || item.technician === filters.technician),
  );
  const allEvents = agenda?.filter((item) => inPeriod(item.startAt, period));
  const onTime = completed?.filter(
    (item) => item.completedAt && item.completedAt <= item.scheduledAt,
  ).length;
  const months = monthsInRange(period),
    orderMonths = months.map(
      (month) =>
        current?.filter((item) => monthKey(item.createdAt) === month).length ?? 0,
    );
  return {
    area: "OPERATIONAL",
    title: "Operacional",
    description: "Ordens e agenda sem duplicar eventos vinculados como execuções.",
    metrics: [
      metric({
        id: "orders-created",
        title: "OS criadas",
        current: current?.length,
        previous: prev?.length,
        source: ["ORDERS"],
        description: "Entrada definida pela data de criação.",
        link: "/dashboard/ordens",
      }),
      metric({
        id: "orders-open",
        title: "OS abertas",
        current: all?.filter(
          (item) => !["COMPLETED", "CANCELED"].includes(item.status) && !item.archivedAt,
        ).length,
        source: ["ORDERS"],
        description: "Ordens ainda em execução ou planejamento.",
        link: "/dashboard/ordens",
      }),
      metric({
        id: "orders-completed",
        title: "OS concluídas",
        current: completed?.length,
        previous: prevCompleted?.length,
        source: ["ORDERS"],
        description: "Conclusão definida pela última atualização ao estado concluído.",
        link: "/dashboard/ordens",
      }),
      metric({
        id: "orders-overdue",
        title: "OS atrasadas",
        current: all?.filter((item) => item.status === "OVERDUE").length,
        format: "number",
        inverse: true,
        source: ["ORDERS"],
        description: "Ordens marcadas como atrasadas.",
      }),
      metric({
        id: "deadline",
        title: "Cumprimento de prazo",
        current: deadlineCompliance(onTime, completed?.length),
        format: "percentage",
        source: ["ORDERS"],
        description: "Conclusões até o horário previsto ÷ conclusões no período.",
      }),
      metric({
        id: "estimated-orders",
        title: "Valor previsto",
        current: current?.reduce((sum, item) => sum + item.estimatedValue, 0),
        previous: prev?.reduce((sum, item) => sum + item.estimatedValue, 0),
        format: "currency",
        source: ["ORDERS"],
        description: "Valor estimado das OS criadas.",
      }),
      metric({
        id: "applied-pricing",
        title: "Precificação aplicada",
        current: toReais(
          current?.reduce((sum, item) => sum + (item.appliedPriceCents ?? 0), 0),
        ),
        format: "currency",
        source: ["ORDERS", "PRICING"],
        description: "Preço aplicado às OS no período.",
      }),
      metric({
        id: "agenda-events",
        title: "Eventos agendados",
        current: allEvents?.length,
        source: ["AGENDA"],
        description:
          "Todos os eventos; eventos de OS não são somados novamente às execuções.",
        link: "/dashboard/agenda",
      }),
      metric({
        id: "agenda-hours",
        title: "Duração agendada",
        current: allEvents
          ? allEvents.reduce(
              (sum, item) => sum + (durationMinutes(item.startAt, item.endAt) ?? 0),
              0,
            ) / 60
          : undefined,
        format: "hours",
        source: ["AGENDA"],
        description: "Soma da duração válida dos eventos.",
      }),
      metric({
        id: "independent-events",
        title: "Eventos independentes",
        current: independentEvents?.length,
        source: ["AGENDA"],
        description: "Eventos que não representam uma OS.",
      }),
    ],
    charts: [
      chart(
        "orders-evolution",
        "Evolução de OS",
        months.map(monthLabel),
        [
          { name: "Criadas", values: orderMonths },
          {
            name: "Concluídas",
            values: months.map(
              (month) =>
                completed?.filter((item) => monthKey(item.completedAt ?? "") === month)
                  .length ?? 0,
            ),
          },
        ],
        "number",
        ["ORDERS"],
        !orders,
      ),
    ],
    rankings: [
      {
        id: "orders-status",
        title: "OS por status",
        items: rankingItems(
          ranking(countBy(all ?? [], (item) => item.status)),
          "number",
          "/dashboard/ordens",
        ),
      },
      {
        id: "orders-category",
        title: "OS por categoria",
        items: rankingItems(
          ranking(countBy(current ?? [], (item) => item.category)),
          "number",
          "/dashboard/ordens",
        ),
      },
      {
        id: "technicians",
        title: "Produtividade por técnico",
        items: rankingItems(
          ranking(countBy(completed ?? [], (item) => item.technician)),
          "number",
          "/dashboard/ordens",
        ),
      },
      {
        id: "cities",
        title: "Cidades",
        items: rankingItems(
          ranking(countBy(current ?? [], (item) => `${item.city}/${item.state}`)),
          "number",
          "/dashboard/ordens",
        ),
      },
    ],
  };
}
