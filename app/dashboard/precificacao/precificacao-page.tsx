"use client";

import { useMemo, useState } from "react";

import {
  defaultCalculationInput,
  pricingServices,
  type PricingCalculationInput,
  type PricingListView,
  type PricingView,
} from "./precificacao-data";
import { PrecificacaoCalculator } from "./precificacao-calculator";
import { PrecificacaoFilters } from "./precificacao-filters";
import { PrecificacaoList } from "./precificacao-list";
import { PrecificacaoSummary } from "./precificacao-summary";

function getServiceCost(
  service: (typeof pricingServices)[number],
) {
  return (
    service.materialCost +
    service.laborCost +
    service.equipmentCost +
    service.displacementCost +
    service.thirdPartyCost
  );
}

function getMarginLevel(margin: number) {
  if (margin < 30) {
    return "LOW";
  }

  if (margin <= 40) {
    return "HEALTHY";
  }

  return "HIGH";
}

export function PrecificacaoPageContent() {
  const [view, setView] = useState<PricingView>("calculator");
  const [listView, setListView] =
    useState<PricingListView>("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [marginFilter, setMarginFilter] = useState("ALL");
  const [calculationValues, setCalculationValues] =
    useState<PricingCalculationInput>(defaultCalculationInput);

  const filteredServices = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLocaleLowerCase("pt-BR");

    return pricingServices.filter((service) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          service.name,
          service.code,
          service.description,
        ].some((value) =>
          value
            .toLocaleLowerCase("pt-BR")
            .includes(normalizedSearch),
        );

      const matchesCategory =
        categoryFilter === "ALL" ||
        service.category === categoryFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        service.status === statusFilter;

      const matchesMargin =
        marginFilter === "ALL" ||
        getMarginLevel(service.marginRate) === marginFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus &&
        matchesMargin
      );
    });
  }, [
    categoryFilter,
    marginFilter,
    searchTerm,
    statusFilter,
  ]);

  const averageMargin =
    pricingServices.length > 0
      ? pricingServices.reduce(
          (total, service) => total + service.marginRate,
          0,
        ) / pricingServices.length
      : 0;

  const averageTicket =
    pricingServices.length > 0
      ? pricingServices.reduce(
          (total, service) =>
            total + service.suggestedPrice,
          0,
        ) / pricingServices.length
      : 0;

  const activeServices = pricingServices.filter(
    (service) => service.status === "ACTIVE",
  ).length;

  const reviewServices = pricingServices.filter(
    (service) => service.status === "REVIEW",
  ).length;

  const estimatedProfit = pricingServices.reduce(
    (total, service) =>
      total +
      Math.max(
        0,
        service.suggestedPrice - getServiceCost(service),
      ),
    0,
  );

  function handleCalculationChange(
    field: keyof PricingCalculationInput,
    value: number,
  ) {
    setCalculationValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <div className="space-y-3">
      <PrecificacaoFilters
        view={view}
        listView={listView}
        searchTerm={searchTerm}
        categoryFilter={categoryFilter}
        statusFilter={statusFilter}
        marginFilter={marginFilter}
        onViewChange={setView}
        onListViewChange={setListView}
        onSearchChange={setSearchTerm}
        onCategoryFilterChange={setCategoryFilter}
        onStatusFilterChange={setStatusFilter}
        onMarginFilterChange={setMarginFilter}
      />

      <PrecificacaoSummary
        servicesCount={pricingServices.length}
        averageMargin={averageMargin}
        averageTicket={averageTicket}
        activeServices={activeServices}
        reviewServices={reviewServices}
        estimatedProfit={estimatedProfit}
      />

      {view === "calculator" ? (
        <PrecificacaoCalculator
          values={calculationValues}
          onChange={handleCalculationChange}
        />
      ) : (
        <PrecificacaoList
          view={listView}
          services={filteredServices}
        />
      )}
    </div>
  );
}

export default PrecificacaoPageContent;
