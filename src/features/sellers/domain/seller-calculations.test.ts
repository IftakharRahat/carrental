import { describe, expect, it } from "vitest";
import {
  calculateOverallSellersKpis,
  calculateSellerKpis,
} from "./seller-calculations";
import { normalizePhoneNumber } from "./seller-types";

describe("seller-calculations", () => {
  it("calculates zero KPIs for a seller with no linked cars", () => {
    const kpis = calculateSellerKpis([]);
    expect(kpis).toEqual({
      carsSoldToYou: 0,
      totalAmount: 0,
      lastDeal: null,
    });
  });

  it("calculates correct cars sold count, total amount, and latest deal date", () => {
    const cars = [
      { purchasePrice: "25000", purchaseDate: "2026-01-10" },
      { purchasePrice: "18500.75", purchaseDate: "2026-02-20" },
      { purchasePrice: 32000, purchaseDate: new Date("2026-03-05") },
    ];

    const kpis = calculateSellerKpis(cars);
    expect(kpis.carsSoldToYou).toBe(3);
    expect(kpis.totalAmount).toBe(75500.75);
    expect(kpis.lastDeal).toBe("2026-03-05");
  });

  it("aggregates overall sellers directory KPIs correctly", () => {
    const sellers = [
      {
        isActive: true,
        kpis: { carsSoldToYou: 4, totalAmount: 80000, lastDeal: "2026-03-01" },
      },
      {
        isActive: true,
        kpis: { carsSoldToYou: 2, totalAmount: 30000, lastDeal: "2026-02-15" },
      },
      {
        isActive: false,
        kpis: { carsSoldToYou: 1, totalAmount: 15000, lastDeal: "2025-12-20" },
      },
    ];

    const overall = calculateOverallSellersKpis(sellers);
    expect(overall.totalSellers).toBe(3);
    expect(overall.activeSellers).toBe(2);
    expect(overall.totalCarsPurchased).toBe(7);
    expect(overall.totalSpend).toBe(125000);
    // 7 cars / 2 active sellers = 3.5
    expect(overall.avgCarsPerSeller).toBe(3.5);
  });

  it("normalizes phone numbers for duplicate detection", () => {
    expect(normalizePhoneNumber("+971 50 123 4567")).toBe("971501234567");
    expect(normalizePhoneNumber("050-123-4567")).toBe("0501234567");
    expect(normalizePhoneNumber("")).toBe("");
    expect(normalizePhoneNumber(null)).toBe("");
  });
});
