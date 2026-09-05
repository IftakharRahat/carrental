import { describe, expect, it } from "vitest";
import {
  calculateOverallSourcesKpis,
  calculateSourceKpis,
} from "./source-calculations";

describe("source-calculations", () => {
  it("calculates zero KPIs for a source with no cars or commissions", () => {
    const kpis = calculateSourceKpis([], []);
    expect(kpis).toEqual({
      totalLeads: 0,
      carsBought: 0,
      totalPurchaseValue: 0,
      commissionPaid: 0,
      lastDeal: null,
    });
  });

  it("calculates correct cars bought, total purchase value, and last deal date", () => {
    const cars = [
      { purchasePrice: "15000.00", purchaseDate: "2026-03-01" },
      { purchasePrice: "22500.50", purchaseDate: "2026-03-15" },
      { purchasePrice: 12000, purchaseDate: new Date("2026-02-10") },
    ];
    const commissions = [
      { amount: "500.00" },
      { amount: 300 },
    ];

    const kpis = calculateSourceKpis(cars, commissions);
    expect(kpis.totalLeads).toBe(3);
    expect(kpis.carsBought).toBe(3);
    expect(kpis.totalPurchaseValue).toBe(49500.5);
    expect(kpis.commissionPaid).toBe(800);
    expect(kpis.lastDeal).toBe("2026-03-15");
  });

  it("aggregates overall sources directory KPIs correctly", () => {
    const sources = [
      {
        isActive: true,
        kpis: {
          totalLeads: 5,
          carsBought: 5,
          totalPurchaseValue: 100000,
          commissionPaid: 2500,
          lastDeal: "2026-03-10",
        },
      },
      {
        isActive: false,
        kpis: {
          totalLeads: 2,
          carsBought: 2,
          totalPurchaseValue: 45000,
          commissionPaid: 1000,
          lastDeal: "2026-01-12",
        },
      },
    ];

    const overall = calculateOverallSourcesKpis(sources);
    expect(overall.totalSources).toBe(2);
    expect(overall.activeSources).toBe(1);
    expect(overall.totalCarsBought).toBe(7);
    expect(overall.totalPurchaseValue).toBe(145000);
    expect(overall.totalCommissionPaid).toBe(3500);
  });
});
