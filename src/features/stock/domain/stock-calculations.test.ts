import { describe, expect, it } from "vitest";

import {
  calculateDaysInStock,
  calculateStockSummary,
  formatPendingItems,
} from "./stock-calculations";
import type { StockCarItem } from "./stock-types";

const mockCar = (overrides: Partial<StockCarItem>): StockCarItem => ({
  id: "car-1",
  carNumber: "CAR-0001",
  rawCarNumber: 1,
  brand: "Toyota",
  model: "Camry",
  year: 2018,
  condition: "SCRAP",
  conditionOther: null,
  status: "IN_STOCK",
  purchaseDate: "2026-09-01",
  completionDate: null,
  purchasePrice: 10000,
  totalExpenses: 2000,
  totalInvestment: 12000,
  recovery: 1500,
  pendingItemsCount: null,
  mainPhotoUrl: null,
  daysInStock: 4,
  vinChassis: null,
  notes: null,
  ...overrides,
});

describe("stock domain calculations", () => {
  describe("calculateStockSummary", () => {
    it("computes active cars, stock value, and active recovery excluding completed cars", () => {
      const items: StockCarItem[] = [
        mockCar({
          id: "1",
          status: "IN_STOCK",
          purchasePrice: 10000,
          totalExpenses: 2000,
          totalInvestment: 12000,
          recovery: 1000,
        }),
        mockCar({
          id: "2",
          status: "PARTIALLY_RECOVERED",
          purchasePrice: 15000,
          totalExpenses: 5000,
          totalInvestment: 20000,
          recovery: 8000,
        }),
        mockCar({
          id: "3",
          status: "COMPLETED",
          purchasePrice: 8000,
          totalExpenses: 1000,
          totalInvestment: 9000,
          recovery: 12000,
        }),
      ];

      const summary = calculateStockSummary(items);

      expect(summary.activeCarsCount).toBe(2);
      expect(summary.stockValue).toBe(32000); // 12000 + 20000
      expect(summary.recoveredFromActiveStock).toBe(9000); // 1000 + 8000
      expect(summary.avgCarBuyPrice).toBe(11000); // (10000 + 15000 + 8000) / 3
      expect(summary.avgCarExpenses).toBe(2666.67); // (2000 + 5000 + 1000) / 3
      expect(summary.avgDaysToComplete).toBe(4);
      expect(summary.avgNetProfit).toBe(3000); // 12000 - 9000 for completed car
      expect(summary.completedCarsCount).toBe(1);
    });

    it("handles empty items array gracefully", () => {
      const summary = calculateStockSummary([]);
      expect(summary).toEqual({
        activeCarsCount: 0,
        stockValue: 0,
        recoveredFromActiveStock: 0,
        avgCarBuyPrice: 0,
        avgCarExpenses: 0,
        avgDaysToComplete: 0,
        avgNetProfit: 0,
        completedCarsCount: 0,
      });
    });
  });

  describe("calculateDaysInStock", () => {
    it("calculates days from purchase date to current date for active cars", () => {
      const now = new Date("2026-09-10T12:00:00Z");
      const days = calculateDaysInStock("2026-09-01", null, now);
      expect(days).toBe(9);
    });

    it("calculates days from purchase date to completion date for completed cars", () => {
      const now = new Date("2026-09-20T12:00:00Z");
      const days = calculateDaysInStock("2026-09-01", "2026-09-08", now);
      expect(days).toBe(7);
    });

    it("returns 0 for same-day purchases", () => {
      const now = new Date("2026-09-05T08:00:00Z");
      const days = calculateDaysInStock("2026-09-05", null, now);
      expect(days).toBe(0);
    });
  });

  describe("formatPendingItems", () => {
    it("returns N/A when count is null", () => {
      expect(formatPendingItems(null)).toBe("N/A");
    });

    it("returns formatted count string when count is a number", () => {
      expect(formatPendingItems(0)).toBe("0 pending");
      expect(formatPendingItems(1)).toBe("1 pending");
      expect(formatPendingItems(4)).toBe("4 pending");
    });

    it("returns ratio format when total is provided", () => {
      expect(formatPendingItems(3, 8)).toBe("3 / 8 remaining");
      expect(formatPendingItems(0, 5)).toBe("0 / 5 remaining");
    });
  });
});
