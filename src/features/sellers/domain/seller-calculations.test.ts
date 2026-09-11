import { describe, expect, it } from "vitest";
import {
  calculateOverallSellersKpis,
  calculateSellerKpis,
  isSellerExpired,
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

  describe("isSellerExpired", () => {
    const referenceDate = new Date("2026-09-11T12:00:00Z");

    it("identifies sellers with 0 cars as expired if created > 45 days ago", () => {
      // 50 days before Sep 11 is approx July 23
      const expiredSeller = {
        createdAt: "2026-07-20T10:00:00Z",
        kpis: { carsSoldToYou: 0, lastDeal: null },
      };
      expect(isSellerExpired(expiredSeller, 45, referenceDate)).toBe(true);

      // 10 days before Sep 11 is Sep 1
      const recentSeller = {
        createdAt: "2026-09-01T10:00:00Z",
        kpis: { carsSoldToYou: 0, lastDeal: null },
      };
      expect(isSellerExpired(recentSeller, 45, referenceDate)).toBe(false);
    });

    it("identifies sellers with cars as expired based on last deal date", () => {
      // Last deal 50 days ago
      const expiredCarSeller = {
        createdAt: "2026-01-01T10:00:00Z",
        kpis: { carsSoldToYou: 1, lastDeal: "2026-07-20" },
      };
      expect(isSellerExpired(expiredCarSeller, 45, referenceDate)).toBe(true);

      // Last deal 5 days ago
      const activeCarSeller = {
        createdAt: "2026-01-01T10:00:00Z",
        kpis: { carsSoldToYou: 1, lastDeal: "2026-09-06" },
      };
      expect(isSellerExpired(activeCarSeller, 45, referenceDate)).toBe(false);
    });

    it("respects custom thresholds like 30 or 60 days", () => {
      // Last deal 35 days ago (approx Aug 7)
      const seller = {
        createdAt: "2026-01-01T10:00:00Z",
        kpis: { carsSoldToYou: 2, lastDeal: "2026-08-07" },
      };

      // Expired under 30 days
      expect(isSellerExpired(seller, 30, referenceDate)).toBe(true);
      // NOT expired under 45 days
      expect(isSellerExpired(seller, 45, referenceDate)).toBe(false);
      // NOT expired under 60 days
      expect(isSellerExpired(seller, 60, referenceDate)).toBe(false);
    });
  });
});
