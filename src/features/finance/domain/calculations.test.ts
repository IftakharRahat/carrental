import { describe, expect, it } from "vitest";

import {
  calculateAvailableCash,
  calculateCarFinancials,
  calculateNetBusinessProfit,
} from "./calculations";

describe("car financial calculations", () => {
  it("keeps profit pending while a car is partially recovered", () => {
    const result = calculateCarFinancials({
      purchaseFils: 800_000n,
      expenseFils: [120_000n, 80_000n],
      recoveryFils: [400_000n, 500_000n],
      status: "PARTIALLY_RECOVERED",
    });

    expect(result).toEqual({
      investmentFils: 1_000_000n,
      recoveryFils: 900_000n,
      realizedProfitFils: null,
    });
  });

  it("realizes profit only after completion", () => {
    const result = calculateCarFinancials({
      purchaseFils: 800_000n,
      expenseFils: [200_000n],
      recoveryFils: [900_000n, 130_000n],
      status: "COMPLETED",
    });

    expect(result.realizedProfitFils).toBe(30_000n);
  });

  it("keeps cash separate from stock value", () => {
    expect(
      calculateAvailableCash(5_000_000n, [1_030_000n], [800_000n, 200_000n]),
    ).toBe(5_030_000n);
  });

  it("subtracts general expenses from completed-car profit", () => {
    expect(calculateNetBusinessProfit([30_000n, 50_000n], [20_000n])).toBe(
      60_000n,
    );
  });
});
