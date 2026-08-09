import type { ReportClient } from "@/lib/contracts/relatorios-clientes.contract";
import type { ReportCrmLead } from "@/lib/contracts/relatorios-crm.contract";
import type { DateRange, ReportFilter, ReportSection } from "../relatorios-types";
import { conversion, averageTicket } from "./formula-engine";
import { countBy, ranking } from "./aggregation-engine";
import { inPeriod, monthKey, monthLabel } from "./date-engine";
import { chart, metric, monthsInRange, rankingItems } from "./report-builders";
const filterLeads = (items: ReportCrmLead[], filters: ReportFilter) =>
  items.filter(
    (item) =>
      (!filters.salesOwner || item.salesOwner === filters.salesOwner) &&
      (!filters.origin || item.source === filters.origin) &&
      (!filters.city || item.city === filters.city) &&
      (!filters.state || item.state === filters.state) &&
      (!filters.serviceType || item.serviceInterest === filters.serviceType) &&
      (filters.includeArchived || !item.archivedAt),
  );
const filterClients = (items: ReportClient[], filters: ReportFilter) =>
  items.filter(
    (item) =>
      (!filters.city || item.city === filters.city) &&
      (!filters.state || item.state === filters.state) &&
      (!filters.status || item.status === filters.status) &&
      (filters.includeArchived || !item.deletedAt),
  );
export function commercialSection(
  leads: ReportCrmLead[] | undefined,
  clients: ReportClient[] | undefined,
  period: DateRange,
  previous: DateRange | undefined,
  filters: ReportFilter,
): ReportSection {
  const allLeads = leads && filterLeads(leads, filters),
    allClients = clients && filterClients(clients, filters);
  const cohort = allLeads?.filter((item) => inPeriod(item.createdAt, period)),
    prevCohort = previous
      ? allLeads?.filter((item) => inPeriod(item.createdAt, previous))
      : undefined;
  const converted = cohort?.filter((item) => Boolean(item.convertedAt)),
    prevConverted = prevCohort?.filter((item) => Boolean(item.convertedAt));
  const newClients = allClients?.filter((item) => inPeriod(item.createdAt, period)),
    prevClients = previous
      ? allClients?.filter((item) => inPeriod(item.createdAt, previous))
      : undefined;
  const months = monthsInRange(period),
    byMonth = (items: ReportCrmLead[] | undefined, convertedOnly = false) =>
      months.map(
        (month) =>
          items?.filter(
            (item) =>
              monthKey(convertedOnly ? (item.convertedAt ?? "") : item.createdAt) ===
              month,
          ).length ?? 0,
      );
  return {
    area: "COMMERCIAL",
    title: "Comercial",
    description: "Funil, conversão por coorte e evolução de clientes.",
    metrics: [
      metric({
        id: "leads-created",
        title: "Leads criados",
        current: cohort?.length,
        previous: prevCohort?.length,
        source: ["CRM"],
        description: "Leads cuja criação pertence ao período.",
        link: "/dashboard/crm",
      }),
      metric({
        id: "leads-active",
        title: "Leads ativos",
        current: allLeads?.filter((item) => !item.convertedAt && !item.archivedAt).length,
        source: ["CRM"],
        description: "Leads não convertidos e não arquivados.",
        link: "/dashboard/crm",
      }),
      metric({
        id: "leads-converted",
        title: "Convertidos",
        current: converted?.length,
        previous: prevConverted?.length,
        source: ["CRM"],
        description: "Conversões pertencentes à coorte criada no período.",
        link: "/dashboard/crm",
      }),
      metric({
        id: "conversion",
        title: "Taxa de conversão",
        current: conversion(converted?.length, cohort?.length),
        previous: conversion(prevConverted?.length, prevCohort?.length),
        format: "percentage",
        source: ["CRM"],
        description: "Leads da coorte convertidos ÷ leads criados na mesma coorte.",
      }),
      metric({
        id: "pipeline",
        title: "Pipeline estimado",
        current: allLeads
          ?.filter((item) => !item.convertedAt && !item.archivedAt)
          .reduce((sum, item) => sum + item.estimatedValue, 0),
        format: "currency",
        source: ["CRM"],
        description: "Valor estimado; não representa receita realizada.",
        link: "/dashboard/crm",
      }),
      metric({
        id: "estimated-ticket",
        title: "Ticket estimado",
        current: averageTicket(
          cohort?.reduce((sum, item) => sum + item.estimatedValue, 0),
          cohort?.length,
        ),
        previous: averageTicket(
          prevCohort?.reduce((sum, item) => sum + item.estimatedValue, 0),
          prevCohort?.length,
        ),
        format: "currency",
        source: ["CRM"],
        description: "Média do valor estimado dos leads criados.",
      }),
      metric({
        id: "new-clients",
        title: "Clientes novos",
        current: newClients?.length,
        previous: prevClients?.length,
        source: ["CLIENTS"],
        description: "Clientes cadastrados no período.",
        link: "/dashboard/clientes",
      }),
      metric({
        id: "active-clients",
        title: "Clientes ativos",
        current: allClients?.filter(
          (item) => !item.deletedAt && item.status !== "INACTIVE",
        ).length,
        source: ["CLIENTS"],
        description: "Clientes não arquivados e não inativos.",
        link: "/dashboard/clientes",
      }),
    ],
    charts: [
      chart(
        "lead-evolution",
        "Evolução comercial",
        months.map(monthLabel),
        [
          { name: "Leads criados", values: byMonth(cohort) },
          { name: "Conversões", values: byMonth(cohort, true) },
        ],
        "number",
        ["CRM"],
        !leads,
      ),
    ],
    rankings: [
      {
        id: "lead-stages",
        title: "Leads por etapa",
        items: rankingItems(
          ranking(countBy(allLeads ?? [], (item) => item.stage)),
          "number",
          "/dashboard/crm",
        ),
      },
      {
        id: "lead-sources",
        title: "Origens",
        items: rankingItems(
          ranking(countBy(cohort ?? [], (item) => item.source)),
          "number",
          "/dashboard/crm",
        ),
      },
      {
        id: "sales-owners",
        title: "Responsáveis",
        items: rankingItems(
          ranking(countBy(cohort ?? [], (item) => item.salesOwner)),
          "number",
          "/dashboard/crm",
        ),
      },
      {
        id: "client-cities",
        title: "Clientes por cidade",
        items: rankingItems(
          ranking(countBy(allClients ?? [], (item) => `${item.city}/${item.state}`)),
          "number",
          "/dashboard/clientes",
        ),
      },
    ],
  };
}
