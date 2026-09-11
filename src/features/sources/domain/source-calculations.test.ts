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
      totalProfit: 0,
      avgProfitPerCar: 0,
      lastDeal: null,
    });
  });

  it("calculates correct cars bought, total purchase value, and last deal date", () => {
    const cars = [
      {
        purchasePrice: "15000.00",
        purchaseDate: "2026-03-01",
        expenses: [{ amount: 1000 }],
        recoveries: [{ amount: 20000 }],
      },
      {
        purchasePrice: "22500.50",
        purchaseDate: "2026-03-15",
        expenses: [],
        recoveries: [{ amount: 25000 }],
      },
      {
        purchasePrice: 12000,
        purchaseDate: new Date("2026-02-10"),
        expenses: [{ amount: 500 }],
        recoveries: [{ amount: 15000 }],
      },
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
    // Car 1 profit: 20000 - 16000 = 4000
    // Car 2 profit: 25000 - 22500.5 = 2499.5
    // Car 3 profit: 15000 - 12500 = 2500
    // Total profit: 8999.5
    expect(kpis.totalProfit).toBe(8999.5);
    expect(kpis.avgProfitPerCar).toBe(2999.83);
  });

  it("aggregates overall sources directory KPIs correctly", () => {
    const sources = [
      {
        name: "Garage Auto",
        typeLabel: "Garage Owner",
        isActive: true,
        kpis: {
          totalLeads: 5,
          carsBought: 5,
          totalPurchaseValue: 100000,
          commissionPaid: 2500,
          totalProfit: 15000,
          avgProfitPerCar: 3000,
          lastDeal: "2026-03-10",
        },
      },
      {
        name: "TikTok Ads",
        typeLabel: "TikTok",
        isActive: false,
        kpis: {
          totalLeads: 2,
          carsBought: 2,
          totalPurchaseValue: 45000,
          commissionPaid: 1000,
          totalProfit: 6000,
          avgProfitPerCar: 3000,
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
    expect(overall.topSource).toBe("Garage Owner (5 cars)");
    expect(overall.avgProfitFromSource).toBe(3000); // 21000 / 7
    expect(overall.repeatDealFrequency).toBe(3.5); // 7 / 2
  });
});
