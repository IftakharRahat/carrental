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

  const totalCars = items.length;

  // 1. Average Car Buy Price
  const totalPurchasePrice = items.reduce(
    (total, item) => total + item.purchasePrice,
    0,
  );
  const avgCarBuyPrice =
    totalCars > 0 ? Math.round((totalPurchasePrice / totalCars) * 100) / 100 : 0;

  // 2. Average Car Expenses
  const totalExpenses = items.reduce(
    (total, item) => total + item.totalExpenses,
    0,
  );
  const avgCarExpenses =
    totalCars > 0 ? Math.round((totalExpenses / totalCars) * 100) / 100 : 0;

  // 3. Average Days to Complete
  const completedCars = items.filter(
    (item) => item.status === "COMPLETED" || Boolean(item.completionDate),
  );
  const targetCompleted = completedCars.length > 0 ? completedCars : items;
  const avgDaysToComplete =
    targetCompleted.length > 0
      ? Math.round(
          targetCompleted.reduce((total, item) => total + item.daysInStock, 0) /
            targetCompleted.length,
        )
      : 0;

  // 4. Average Net Profit
  // Net profit = recovery - totalInvestment
  const targetProfitCars = completedCars.length > 0 ? completedCars : items;
  const totalNetProfit = targetProfitCars.reduce(
    (total, item) => total + (item.recovery - item.totalInvestment),
    0,
  );
  const avgNetProfit =
    targetProfitCars.length > 0
      ? Math.round((totalNetProfit / targetProfitCars.length) * 100) / 100
      : 0;

  return {
    activeCarsCount,
    stockValue,
    recoveredFromActiveStock,
    avgCarBuyPrice,
    avgCarExpenses,
    avgDaysToComplete,
    avgNetProfit,
    completedCarsCount: completedCars.length,
  };
}

export function formatPendingItems(
  count: number | null,
  total?: number | null,
): string {
  if (count === null) return "N/A";
  if (total !== undefined && total !== null && total > 0) {
    return `${count} / ${total} remaining`;
  }
  if (count === 0) return "0 pending";
  if (count === 1) return "1 pending";
  return `${count} pending`;
}
