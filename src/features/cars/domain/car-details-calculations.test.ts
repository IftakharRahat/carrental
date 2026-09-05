import { describe, expect, it } from "vitest";

import { calculateCarKpis } from "./car-details-calculations";

describe("calculateCarKpis", () => {
  it("computes purchase, expenses, investment, and recovery accurately", () => {
    const kpis = calculateCarKpis({
      status: "IN_STOCK",
      purchasePrice: 8000,
      expenses: [
        { amount: 500, status: "ACTIVE" },
        { amount: 1500, status: "ACTIVE" },
        { amount: 300, status: "VOIDED" }, // voided should be ignored
      ],
      recoveries: [
        { amount: 2000, status: "ACTIVE" },
        { amount: 1000, status: "VOIDED" }, // voided should be ignored
      ],
    });

    expect(kpis.purchase).toBe(8000);
    expect(kpis.expenses).toBe(2000);
    expect(kpis.investment).toBe(10000);
    expect(kpis.recovery).toBe(2000);
  });

  it("marks Realized Car Profit as Pending for IN_STOCK and PARTIALLY_RECOVERED cars", () => {
    const inStockKpis = calculateCarKpis({
      status: "IN_STOCK",
      purchasePrice: 8000,
      expenses: [{ amount: 2000, status: "ACTIVE" }],
      recoveries: [{ amount: 4000, status: "ACTIVE" }],
    });

    expect(inStockKpis.isProfitPending).toBe(true);
    expect(inStockKpis.realizedProfit).toBeNull();

    const partiallyRecoveredKpis = calculateCarKpis({
      status: "PARTIALLY_RECOVERED",
      purchasePrice: 8000,
      expenses: [{ amount: 2000, status: "ACTIVE" }],
      recoveries: [{ amount: 9000, status: "ACTIVE" }],
    });

    expect(partiallyRecoveredKpis.isProfitPending).toBe(true);
    expect(partiallyRecoveredKpis.realizedProfit).toBeNull();
  });

  it("calculates exact Realized Car Profit for COMPLETED cars", () => {
    const profitableCar = calculateCarKpis({
      status: "COMPLETED",
      purchasePrice: 8000,
      expenses: [{ amount: 2000, status: "ACTIVE" }],
      recoveries: [{ amount: 14000, status: "ACTIVE" }],
    });

    expect(profitableCar.isProfitPending).toBe(false);
    expect(profitableCar.realizedProfit).toBe(4000); // 14000 - (8000 + 2000)

    const lossCar = calculateCarKpis({
      status: "COMPLETED",
      purchasePrice: 10000,
      expenses: [{ amount: 2000, status: "ACTIVE" }],
      recoveries: [{ amount: 9000, status: "ACTIVE" }],
    });

    expect(lossCar.isProfitPending).toBe(false);
    expect(lossCar.realizedProfit).toBe(-3000); // 9000 - 12000
  });
});
