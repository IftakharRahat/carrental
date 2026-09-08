import { describe, expect, it } from "vitest";

import {
  calculateBusinessAnalytics,
  formatConditionLabel,
  getAnalyticsPresetRange,
  resolveBuyerCategory,
} from "./analytics-calculations";

describe("analytics-calculations", () => {
  it("resolves date presets correctly", () => {
    const fixedDate = new Date("2026-08-15T10:00:00Z");
    const month = getAnalyticsPresetRange("THIS_MONTH", fixedDate);
    expect(month.startDate).toBe("2026-08-01");
    expect(month.endDate).toBe("2026-08-31");

    const allTime = getAnalyticsPresetRange("ALL_TIME", fixedDate);
    expect(allTime.startDate).toBeNull();
    expect(allTime.endDate).toBeNull();
  });

  it("resolves condition labels and buyer categories", () => {
    expect(formatConditionLabel("ACCIDENT_DAMAGED")).toBe("Accident / Damaged");
    expect(formatConditionLabel("SCRAP")).toBe("Scrap");

    expect(resolveBuyerCategory("WHOLE_CAR")).toBe("Whole Car / Body");
    expect(resolveBuyerCategory("ITEM", "ENGINE")).toBe("Engine");
    expect(resolveBuyerCategory("ITEM", "COPPER")).toBe("Copper");
    expect(resolveBuyerCategory("ITEM", "PARTS")).toBe("Parts");
  });

  it("calculates brand, condition, source, and buyer analytics with strict completed-profit rule", () => {
    const cars = [
      // Toyota 1: Completed
      {
        id: "c1",
        carNumber: 101,
        brand: "Toyota",
        model: "Corolla",
        condition: "SCRAP",
        purchasePrice: 6000,
        purchaseDate: "2026-08-01",
        status: "COMPLETED",
        completionDate: "2026-08-11",
        sourceId: "src-1",
        sourceName: "Garage Ali",
        sourceType: "Garage Owner",
        expenses: [{ amount: 1000, expenseDate: "2026-08-05" }],
        recoveries: [
          {
            id: "r1",
            buyerId: "b-1",
            buyerName: "Buyer Bob",
            buyerCompany: "Bob Motors",
            buyerTypes: ["Whole Car / Body"],
            mode: "WHOLE_CAR",
            amount: 9000,
            saleDate: "2026-08-11",
          },
        ],
      },
      // Toyota 2: Active / In Stock (MUST BE EXCLUDED FROM REALIZED PROFIT)
      {
        id: "c2",
        carNumber: 102,
        brand: "Toyota",
        model: "Camry",
        condition: "ACCIDENT_DAMAGED",
        purchasePrice: 10000,
        purchaseDate: "2026-08-05",
        status: "IN_STOCK",
        completionDate: null,
        sourceId: "src-1",
        sourceName: "Garage Ali",
        sourceType: "Garage Owner",
        expenses: [{ amount: 500, expenseDate: "2026-08-06" }],
        recoveries: [
          {
            id: "r2",
            buyerId: "b-2",
            buyerName: "Engine Pro",
            buyerCompany: "Engine Pro FZE",
            buyerTypes: ["Engine"],
            mode: "ITEM",
            itemType: "ENGINE",
            amount: 4000,
            saleDate: "2026-08-08",
          },
        ],
      },
      // Nissan 1: Completed
      {
        id: "c3",
        carNumber: 103,
        brand: "Nissan",
        model: "Patrol",
        condition: "ENGINE_ISSUE",
        purchasePrice: 15000,
        purchaseDate: "2026-08-10",
        status: "COMPLETED",
        completionDate: "2026-08-25",
        sourceId: null,
        sourceName: "Direct / Walk-in",
        sourceType: "Walk-in",
        expenses: [{ amount: 2000, expenseDate: "2026-08-12" }],
        recoveries: [
          {
            id: "r3",
            buyerId: "b-1",
            buyerName: "Buyer Bob",
            buyerCompany: "Bob Motors",
            buyerTypes: ["Whole Car / Body"],
            mode: "WHOLE_CAR",
            amount: 21000,
            saleDate: "2026-08-25",
          },
        ],
      },
    ];

    const commissions = [
      { carId: "c1", amount: 300 },
      { carId: "c2", amount: 200 },
    ];

    const result = calculateBusinessAnalytics({
      cars,
      commissions,
      startDate: null,
      endDate: null,
    });

    // 1. Overview check
    expect(result.overview.totalCarsBought).toBe(3);
    expect(result.overview.totalCarsCompleted).toBe(2);
    // Realized profit:
    // Toyota 1: 9000 - (6000 + 1000) = 2000
    // Nissan 1: 21000 - (15000 + 2000) = 4000
    // Toyota 2 is IN_STOCK -> EXCLUDED!
    // Total Realized Profit = 2000 + 4000 = 6000
    expect(result.overview.totalRealizedProfit).toBe(6000);
    expect(result.overview.avgProfitPerCompletedCar).toBe(3000); // 6000 / 2

    // 2. Brand check
    const toyota = result.brandAnalytics.find((b) => b.brand === "Toyota")!;
    expect(toyota.carsBought).toBe(2);
    expect(toyota.carsCompleted).toBe(1);
    expect(toyota.realizedCarProfit).toBe(2000);
    expect(toyota.averageRealizedCarProfit).toBe(2000);

    const nissan = result.brandAnalytics.find((b) => b.brand === "Nissan")!;
    expect(nissan.carsBought).toBe(1);
    expect(nissan.carsCompleted).toBe(1);
    expect(nissan.realizedCarProfit).toBe(4000);

    // 3. Condition check
    const scrap = result.conditionAnalytics.find((c) => c.condition === "SCRAP")!;
    expect(scrap.carsBought).toBe(1);
    expect(scrap.carsCompleted).toBe(1);
    expect(scrap.averageRealizedCarProfit).toBe(2000);
    expect(scrap.averageDaysInStock).toBe(10); // Aug 1 to Aug 11

    const accident = result.conditionAnalytics.find(
      (c) => c.condition === "ACCIDENT_DAMAGED",
    )!;
    expect(accident.carsBought).toBe(1);
    expect(accident.carsCompleted).toBe(0);
    expect(accident.averageRealizedCarProfit).toBe(0); // active cars excluded

    // 4. Source check
    const garageAli = result.sourceAnalytics.find((s) => s.sourceName === "Garage Ali")!;
    expect(garageAli.carsBought).toBe(2);
    expect(garageAli.carsCompleted).toBe(1);
    expect(garageAli.purchaseValue).toBe(16000); // 6000 + 10000
    expect(garageAli.commissionPaid).toBe(500); // 300 + 200
    expect(garageAli.realizedCarProfit).toBe(2000); // completed only

    // 5. Buyer check
    const buyerBob = result.topBuyers.find((b) => b.buyerName === "Buyer Bob")!;
    expect(buyerBob.totalPurchases).toBe(2);
    expect(buyerBob.totalAmount).toBe(30000); // 9000 + 21000
    expect(buyerBob.averageTransaction).toBe(15000);
  });
});
