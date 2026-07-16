import type { ReportPricingSource } from "@/lib/contracts/relatorios-precificacao.contract";
import type { DateRange, ReportFilter, ReportSection } from "../relatorios-types";
import { averageMoney, countBy, ranking, weightedAverage } from "./aggregation-engine";
import { conversion } from "./formula-engine";
import { inPeriod, monthKey, monthLabel } from "./date-engine";
import { chart, metric, monthsInRange, rankingItems, toReais } from "./report-builders";
export function pricingSection(
  source: ReportPricingSource | undefined,
  period: DateRange,
  previous: DateRange | undefined,
  filters: ReportFilter,
): ReportSection {
  const all = source?.simulations.filter(
    (item) =>
      (filters.includeArchived || !item.archivedAt) &&
      (!filters.category || item.category === filters.category) &&
      (!filters.status || item.status === filters.status),
  );
  const current = all?.filter((item) => inPeriod(item.createdAt, period)),
    prev = previous
      ? all?.filter((item) => inPeriod(item.createdAt, previous))
      : undefined;
  const applied = current?.filter((item) =>
      item.applications.some((application) => !application.superseded),
    ),
    prevApplied = prev?.filter((item) =>
      item.applications.some((application) => !application.superseded),
    );
  const applications = current?.flatMap((item) =>
      item.applications.filter((entry) => !entry.superseded),
    ),
    months = monthsInRange(period);
  return {
    area: "PRICING",
    title: "Precificação",
    description: "Simulações, margens, aplicações e componentes utilizados.",
    metrics: [
      metric({
        id: "pricing-created",
        title: "Simulações criadas",
        current: current?.length,
        previous: prev?.length,
        source: ["PRICING"],
        description: "Simulações criadas no período.",
        link: "/dashboard/precificacao",
      }),
      metric({
        id: "pricing-templates",
        title: "Templates ativos",
        current: source?.activeTemplateCount,
        source: ["PRICING"],
        description: "Templates ativos e não arquivados.",
      }),
      metric({
        id: "pricing-ready",
        title: "Simulações prontas",
        current: all?.filter((item) => item.status === "READY").length,
        source: ["PRICING"],
        description: "Simulações em estado pronto.",
      }),
      metric({
        id: "pricing-applied",
        title: "Simulações aplicadas",
        current: applied?.length,
        previous: prevApplied?.length,
        source: ["PRICING"],
        description: "Simulações elegíveis aplicadas a OS.",
      }),
      metric({
        id: "pricing-scenarios",
        title: "Cenários",
        current: current?.filter((item) => Boolean(item.scenarioGroupId)).length,
        source: ["PRICING"],
        description: "Simulações pertencentes a grupos de cenário.",
      }),
      metric({
        id: "pricing-cost",
        title: "Custo médio",
        current: toReais(averageMoney(current?.map((item) => item.totalCostCents) ?? [])),
        format: "currency",
        source: ["PRICING"],
        description: "Média do custo total das simulações.",
      }),
      metric({
        id: "pricing-min",
        title: "Preço mínimo médio",
        current: toReais(averageMoney(current?.map((item) => item.minimumPriceCents) ?? [])),
        format: "currency",
        source: ["PRICING"],
        description: "Média do preço mínimo calculado.",
      }),
      metric({
        id: "pricing-recommended",
        title: "Preço recomendado médio",
        current: toReais(
          averageMoney(current?.map((item) => item.recommendedPriceCents) ?? []),
        ),
        format: "currency",
        source: ["PRICING"],
        description: "Média do preço recomendado.",
      }),
      metric({
        id: "pricing-applied-price",
        title: "Preço aplicado médio",
        current: toReais(averageMoney(applications?.map((item) => item.priceCents) ?? [])),
        format: "currency",
        source: ["PRICING", "ORDERS"],
        description: "Média das aplicações ativas em OS.",
      }),
      metric({
        id: "pricing-profit",
        title: "Lucro estimado",
        current: toReais(current?.reduce((sum, item) => sum + item.profitCents, 0)),
        format: "currency",
        source: ["PRICING"],
        description: "Lucro estimado consolidado.",
      }),
      metric({
        id: "pricing-margin",
        title: "Margem ponderada",
        current: weightedAverage(
          (current ?? []).map((item) => ({
            value: item.marginBasisPoints / 100,
            weight: item.recommendedPriceCents,
          })),
        ),
        format: "percentage",
        source: ["PRICING"],
        description: "Margem ponderada pelo preço recomendado.",
      }),
      metric({
        id: "pricing-conversion",
        title: "Aplicação em OS",
        current: conversion(applied?.length, current?.length),
        previous: conversion(prevApplied?.length, prev?.length),
        format: "percentage",
        source: ["PRICING", "ORDERS"],
        description: "Simulações elegíveis aplicadas ÷ criadas no período.",
      }),
      metric({
        id: "pricing-below",
        title: "Abaixo do mínimo",
        current: applications?.filter(
          (item) =>
            item.priceCents <
            (current?.find((simulation) => simulation.applications.includes(item))
              ?.minimumPriceCents ?? 0),
        ).length,
        inverse: true,
        source: ["PRICING"],
        description: "Aplicações com preço inferior ao mínimo calculado.",
      }),
    ],
    charts: [
      chart(
        "pricing-month",
        "Simulações e aplicações",
        months.map(monthLabel),
        [
          {
            name: "Criadas",
            values: months.map(
              (month) =>
                current?.filter((item) => monthKey(item.createdAt) === month).length ?? 0,
            ),
          },
          {
            name: "Aplicadas",
            values: months.map(
              (month) =>
                applications?.filter((item) => monthKey(item.appliedAt) === month)
                  .length ?? 0,
            ),
          },
        ],
        "number",
        ["PRICING"],
        !source,
      ),
    ],
    rankings: [
      {
        id: "pricing-category",
        title: "Aplicações por categoria",
        items: rankingItems(
          ranking(countBy(current ?? [], (item) => item.category)),
          "number",
          "/dashboard/precificacao",
        ),
      },
      {
        id: "pricing-components",
        title: "Componentes mais usados",
        items: rankingItems(
          ranking(
            countBy(
              current?.flatMap((item) => item.componentTypes) ?? [],
              (item) => item,
            ),
          ),
          "number",
          "/dashboard/precificacao",
        ),
      },
      {
        id: "pricing-materials",
        title: "Materiais mais usados",
        items: rankingItems(
          ranking(
            countBy(current?.flatMap((item) => item.materialIds) ?? [], (item) => item),
          ),
          "number",
          "/dashboard/precificacao",
        ),
      },
      {
        id: "pricing-equipment",
        title: "Equipamentos mais usados",
        items: rankingItems(
          ranking(
            countBy(current?.flatMap((item) => item.equipmentIds) ?? [], (item) => item),
          ),
          "number",
          "/dashboard/precificacao",
        ),
      },
    ],
  };
}
