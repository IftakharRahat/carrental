import { differenceInDays, parseISO, startOfDay } from "date-fns";

import type { StockCarItem, StockSummary } from "./stock-types";

export function calculateDaysInStock(
  purchaseDate: string | Date,
  completionDate?: string | Date | null,
  now: Date = new Date(),
): number {
  const start =
    typeof purchaseDate === "string" ? parseISO(purchaseDate) : purchaseDate;

  const end = completionDate
    ? typeof completionDate === "string"
      ? parseISO(completionDate)
      : completionDate
    : now;

  const days = differenceInDays(startOfDay(end), startOfDay(start));
  return Math.max(0, days);
}

export function calculateStockSummary(
  items: readonly StockCarItem[],
): StockSummary {
  const activeItems = items.filter((item) => item.status !== "COMPLETED");

  const activeCarsCount = activeItems.length;

  const stockValue = activeItems.reduce(
    (total, item) => total + item.totalInvestment,
    0,
  );

  const recoveredFromActiveStock = activeItems.reduce(
    (total, item) => total + item.recovery,
    0,
  );

  return {
    activeCarsCount,
    stockValue,
    recoveredFromActiveStock,
  };
}

export function formatPendingItems(count: number | null): string {
  if (count === null) return "N/A";
  if (count === 0) return "0 pending";
  if (count === 1) return "1 pending";
  return `${count} pending`;
}
