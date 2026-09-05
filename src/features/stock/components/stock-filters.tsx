"use client";

import { FilterX, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { conditionLabels, type StockFilterCriteria } from "../domain/stock-types";

type StockFiltersProps = {
  criteria: StockFilterCriteria;
  brands: string[];
  onChange: (nextCriteria: StockFilterCriteria) => void;
  onReset: () => void;
};

export function StockFilters({
  criteria,
  brands,
  onChange,
  onReset,
}: StockFiltersProps) {
  const hasActiveFilters = Boolean(
    criteria.search ||
      criteria.condition ||
      criteria.brand ||
      criteria.status ||
      criteria.includeCompleted,
  );

  return (
    <div className="bg-card border-border/70 rounded-xl border p-3.5 shadow-xs">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search input */}
        <div className="relative min-w-[240px] flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search Car ID, Brand, Model, VIN…"
            value={criteria.search ?? ""}
            onChange={(event) =>
              onChange({ ...criteria, search: event.target.value })
            }
            className="pr-4 pl-9"
          />
        </div>

        {/* Dropdown filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Brand filter */}
          <select
            value={criteria.brand ?? ""}
            onChange={(event) =>
              onChange({ ...criteria, brand: event.target.value || undefined })
            }
            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-lg border bg-transparent px-2.5 text-xs outline-none focus-visible:ring-3"
            aria-label="Filter by brand"
          >
            <option value="">All Brands</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>

          {/* Condition filter */}
          <select
            value={criteria.condition ?? ""}
            onChange={(event) =>
              onChange({
                ...criteria,
                condition: event.target.value || undefined,
              })
            }
            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-lg border bg-transparent px-2.5 text-xs outline-none focus-visible:ring-3"
            aria-label="Filter by condition"
          >
            <option value="">All Conditions</option>
            {Object.entries(conditionLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={criteria.status ?? ""}
            onChange={(event) =>
              onChange({ ...criteria, status: event.target.value || undefined })
            }
            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-lg border bg-transparent px-2.5 text-xs outline-none focus-visible:ring-3"
            aria-label="Filter by status"
          >
            <option value="">Default (Active)</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="PARTIALLY_RECOVERED">Partially Recovered</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {/* Include completed checkbox */}
          <label className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-2 text-xs select-none">
            <input
              type="checkbox"
              checked={Boolean(criteria.includeCompleted)}
              onChange={(event) =>
                onChange({
                  ...criteria,
                  includeCompleted: event.target.checked,
                })
              }
              className="accent-primary size-3.5 rounded"
            />
            <span>Include completed</span>
          </label>

          {/* Reset button */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={onReset}
              className="text-muted-foreground hover:text-destructive h-8 gap-1 px-2 text-xs"
            >
              <FilterX className="size-3.5" />
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
