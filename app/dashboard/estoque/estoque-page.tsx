"use client";

import { useMemo, useState } from "react";

import {
  stockItems,
  type StockView,
} from "./estoque-data";
import { EstoqueFilters } from "./estoque-filters";
import { EstoqueList } from "./estoque-list";
import { EstoqueSummary } from "./estoque-summary";

export function EstoquePageContent() {
  const [view, setView] = useState<StockView>("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("ALL");

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLocaleLowerCase("pt-BR");

    return stockItems.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          item.name,
          item.internalCode,
          item.barcode,
          item.brand,
          item.model,
          item.location,
          item.supplier,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLocaleLowerCase("pt-BR")
              .includes(normalizedSearch),
          );

      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;

      const matchesCategory =
        categoryFilter === "ALL" || item.category === categoryFilter;

      const matchesLocation =
        locationFilter === "ALL" || item.location === locationFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesLocation
      );
    });
  }, [
    categoryFilter,
    locationFilter,
    searchTerm,
    statusFilter,
  ]);

  const lowStockItems = stockItems.filter(
    (item) =>
      item.currentQuantity <= item.minimumQuantity ||
      item.status === "LOW_STOCK" ||
      item.status === "OUT_OF_STOCK",
  ).length;

  const reservedItems = stockItems.reduce(
    (total, item) => total + item.reservedQuantity,
    0,
  );

  const pendingPurchases = stockItems.reduce(
    (total, item) => total + item.pendingPurchaseQuantity,
    0,
  );

  const totalStockValue = stockItems.reduce(
    (total, item) =>
      total + item.currentQuantity * item.averageCost,
    0,
  );

  const availableQuantity = stockItems.reduce(
    (total, item) =>
      total +
      Math.max(0, item.currentQuantity - item.reservedQuantity),
    0,
  );

  return (
    <div className="space-y-3">
      <EstoqueFilters
        view={view}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
        locationFilter={locationFilter}
        onViewChange={setView}
        onSearchChange={setSearchTerm}
        onStatusFilterChange={setStatusFilter}
        onCategoryFilterChange={setCategoryFilter}
        onLocationFilterChange={setLocationFilter}
      />

      <EstoqueSummary
        totalItems={stockItems.length}
        lowStockItems={lowStockItems}
        reservedItems={reservedItems}
        pendingPurchases={pendingPurchases}
        totalStockValue={totalStockValue}
        availableQuantity={availableQuantity}
      />

      <EstoqueList view={view} items={filteredItems} />
    </div>
  );
}

export default EstoquePageContent;
