"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { calculateStockSummary } from "../domain/stock-calculations";
import type {
  StockCarItem,
  StockFilterCriteria,
  StockSummary,
} from "../domain/stock-types";
import { StockDataTable } from "./stock-data-table";
import { StockFilters } from "./stock-filters";
import { StockSummaryCards } from "./stock-summary-cards";

type StockViewProps = {
  initialItems: StockCarItem[];
  initialSummary: StockSummary;
  brands: string[];
};

export function StockView({
  initialItems,
  initialSummary,
  brands,
}: StockViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [criteria, setCriteria] = useState<StockFilterCriteria>(() => {
    const initial: StockFilterCriteria = {};
    const search = searchParams?.get("search");
    if (search) initial.search = search;
    const condition = searchParams?.get("condition");
    if (condition) initial.condition = condition;
    const status = searchParams?.get("status");
    if (status) initial.status = status;
    const brand = searchParams?.get("brand");
    if (brand) initial.brand = brand;
    if (searchParams?.get("includeCompleted") === "true") {
      initial.includeCompleted = true;
    }
    return initial;
  });

  const syncUrlParams = (newCriteria: StockFilterCriteria) => {
    const params = new URLSearchParams();
    if (newCriteria.search) params.set("search", newCriteria.search);
    if (newCriteria.condition) params.set("condition", newCriteria.condition);
    if (newCriteria.status) params.set("status", newCriteria.status);
    if (newCriteria.brand) params.set("brand", newCriteria.brand);
    if (newCriteria.includeCompleted) params.set("includeCompleted", "true");

    const query = params.toString();
    const target = query ? `${pathname}?${query}` : pathname;
    router.replace(target, { scroll: false });
  };

  const handleCriteriaChange = (updated: StockFilterCriteria) => {
    setCriteria(updated);
    syncUrlParams(updated);
  };

  const handleReset = () => {
    setCriteria({});
    syncUrlParams({});
  };

  const filteredItems = useMemo(() => {
    return initialItems.filter((item) => {
      // Status filter
      if (criteria.status) {
        if (item.status !== criteria.status) return false;
      } else if (!criteria.includeCompleted) {
        if (item.status === "COMPLETED") return false;
      }

      // Condition filter
      if (criteria.condition && item.condition !== criteria.condition) {
        return false;
      }

      // Brand filter
      if (
        criteria.brand &&
        item.brand.toLowerCase() !== criteria.brand.toLowerCase()
      ) {
        return false;
      }

      // Search query (Car ID, Brand, Model, VIN)
      if (criteria.search) {
        const query = criteria.search.trim().toLowerCase();
        const matchesCarNumber = item.carNumber.toLowerCase().includes(query);
        const matchesBrand = item.brand.toLowerCase().includes(query);
        const matchesModel = item.model.toLowerCase().includes(query);
        const matchesVin =
          item.vinChassis?.toLowerCase().includes(query) ?? false;

        if (
          !matchesCarNumber &&
          !matchesBrand &&
          !matchesModel &&
          !matchesVin
        ) {
          return false;
        }
      }

      return true;
    });
  }, [initialItems, criteria]);

  const summary = useMemo(() => {
    // If no filters active, show initial summary, else compute dynamically for active filtered set
    const hasFilter =
      criteria.search ||
      criteria.condition ||
      criteria.brand ||
      criteria.status ||
      criteria.includeCompleted;

    return hasFilter ? calculateStockSummary(filteredItems) : initialSummary;
  }, [filteredItems, initialSummary, criteria]);

  return (
    <div className="space-y-5">
      {/* 6.1 Summary Cards */}
      <StockSummaryCards summary={summary} />

      {/* 6.2 Filter Toolbar */}
      <StockFilters
        criteria={criteria}
        brands={brands}
        onChange={handleCriteriaChange}
        onReset={handleReset}
      />

      {/* 6.3 Stock Table */}
      <StockDataTable data={filteredItems} />
    </div>
  );
}
