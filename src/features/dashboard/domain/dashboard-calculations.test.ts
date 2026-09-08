import { describe, expect, it } from "vitest";

import {
  calculateOverallKpis,
  calculateThisMonthMetrics,
  getDashboardMonthRange,
  type RawDashboardCar,
  type RawDashboardCashTx,
  type RawDashboardExpense,
  type RawDashboardRecovery,
} from "./dashboard-calculations";

describe("Dashboard Calculations Engine", () => {
  const dummyCars: RawDashboardCar[] = [
    {
      id: "car-1",
      carNumber: 1,
      brand: "Toyota",
      model: "Camry",
      purchaseDate: "2026-08-01",
      purchasePrice: 10000,
      status: "COMPLETED",
      completionDate: "2026-08-15",
      expenses: [{ amount: 2000, expenseDate: "2026-08-05" }],
      recoveries: [{ amount: 15000, saleDate: "2026-08-15" }],
    },
    {
      id: "car-2",
      carNumber: 2,
      brand: "Nissan",
      model: "Altima",
      purchaseDate: "2026-08-10",
      purchasePrice: 8000,
      status: "IN_STOCK",
      completionDate: null,
      expenses: [{ amount: 1000, expenseDate: "2026-08-12" }],
      recoveries: [{ amount: 3000, saleDate: "2026-08-20" }], // partial recovery, should NOT be in realized profit
    },
    {
      id: "car-3",
      carNumber: 3,
      brand: "Honda",
      model: "Civic",
      purchaseDate: "2026-09-01",
      purchasePrice: 12000,
      status: "COMPLETED",
      completionDate: "2026-09-05",
      expenses: [{ amount: 1000, expenseDate: "2026-09-02" }],
      recoveries: [{ amount: 11000, saleDate: "2026-09-05" }], // Loss: 11000 - 13000 = -2000
    },
  ];

  const dummyCarExpenses: RawDashboardExpense[] = [
    { amount: 2000, expenseDate: "2026-08-05" },
    { amount: 1000, expenseDate: "2026-08-12" },
    { amount: 1000, expenseDate: "2026-09-02" },
  ];

  const dummyBusinessExpenses: RawDashboardExpense[] = [
    { amount: 1500, expenseDate: "2026-08-25" },
    { amount: 2500, expenseDate: "2026-09-03" },
  ];

  const dummyRecoveries: RawDashboardRecovery[] = [
    { amount: 15000, saleDate: "2026-08-15" },
    { amount: 3000, saleDate: "2026-08-20" },
    { amount: 11000, saleDate: "2026-09-05" },
  ];

  const dummyCashTx: RawDashboardCashTx[] = [
    { amount: 20000, direction: "IN", category: "CAPITAL_INJECTION", transactionDate: "2026-08-01" },
    { amount: 10000, direction: "OUT", category: "CAR_PURCHASE", transactionDate: "2026-08-01" },
    { amount: 2000, direction: "OUT", category: "CAR_EXPENSE", transactionDate: "2026-08-05" },
    { amount: 15000, direction: "IN", category: "WHOLE_CAR_SALE", transactionDate: "2026-08-15" },
    { amount: 8000, direction: "OUT", category: "CAR_PURCHASE", transactionDate: "2026-08-10" },
    { amount: 1000, direction: "OUT", category: "CAR_EXPENSE", transactionDate: "2026-08-12" },
    { amount: 3000, direction: "IN", category: "ITEM_SALE", transactionDate: "2026-08-20" },
    { amount: 1500, direction: "OUT", category: "BUSINESS_EXPENSE", transactionDate: "2026-08-25" },
    { amount: 12000, direction: "OUT", category: "CAR_PURCHASE", transactionDate: "2026-09-01" },
    { amount: 1000, direction: "OUT", category: "CAR_EXPENSE", transactionDate: "2026-09-02" },
    { amount: 2500, direction: "OUT", category: "BUSINESS_EXPENSE", transactionDate: "2026-09-03" },
    { amount: 11000, direction: "IN", category: "WHOLE_CAR_SALE", transactionDate: "2026-09-05" },
  ];

  const openingCash = 50000;

  it("calculates overall lifetime KPIs accurately according to specification 4.2", () => {
    const kpis = calculateOverallKpis({
      cars: dummyCars,
      carExpenses: dummyCarExpenses,
      businessExpenses: dummyBusinessExpenses,
      recoveries: dummyRecoveries,
      cashTransactions: dummyCashTx,
      openingCash,
    });

    // Total Capital = Opening Cash (50,000) + Capital Injection (20,000) = 70,000
    expect(kpis.totalCapital).toBe(70000);

    // Money In: 20000 + 15000 + 3000 + 11000 = 49000
    // Money Out: 10000 + 2000 + 8000 + 1000 + 1500 + 12000 + 1000 + 2500 = 38000
    // Available Cash: 50000 + 49000 - 38000 = 61000
    expect(kpis.availableCash).toBe(61000);

    // Stock Cars: 1 (car-2 is IN_STOCK)
    expect(kpis.stockCars).toBe(1);

    // Stock Value: car-2 purchasePrice (8000) + car-2 expenses (1000) = 9000
    expect(kpis.stockValue).toBe(9000);

    // Total Cars Bought: 3
    expect(kpis.totalCarsBought).toBe(3);

    // Total Cars Completed: 2 (car-1, car-3)
    expect(kpis.totalCarsCompleted).toBe(2);

    // Total Realized Recovery: 15000 + 3000 + 11000 = 29000
    expect(kpis.totalRealizedRecovery).toBe(29000);

    // Total Car Expenses: 2000 + 1000 + 1000 = 4000
    expect(kpis.totalCarExpenses).toBe(4000);

    // Total Business Expenses: 1500 + 2500 = 4000
    expect(kpis.totalBusinessExpenses).toBe(4000);

    // Realized Car Profit:
    // Car 1: 15000 - (10000 + 2000) = +3000
    // Car 2: IN_STOCK (excluded!)
    // Car 3: 11000 - (12000 + 1000) = -2000
    // Total Realized Car Profit = 3000 - 2000 = 1000
    expect(kpis.realizedCarProfit).toBe(1000);

    // Net Business Profit: 1000 - 4000 = -3000 (Loss)
    expect(kpis.netBusinessProfit).toBe(-3000);
  });

  it("calculates This Month metrics for September 2026 according to specification 4.3", () => {
    const { startDate, endDate } = getDashboardMonthRange(2026, 9);
    expect(startDate).toBe("2026-09-01");
    expect(endDate).toBe("2026-09-30");

    const monthMetrics = calculateThisMonthMetrics({
      cars: dummyCars,
      carExpenses: dummyCarExpenses,
      businessExpenses: dummyBusinessExpenses,
      recoveries: dummyRecoveries,
      cashTransactions: dummyCashTx,
      openingCash,
      startDate,
      endDate,
    });

    // Cars Bought in September: 1 (car-3)
    expect(monthMetrics.carsBought).toBe(1);
    expect(monthMetrics.purchaseAmount).toBe(12000);

    // Cars Completed in September: 1 (car-3)
    expect(monthMetrics.carsCompleted).toBe(1);

    // Realized Car Profit in September: Car-3 (11000 - 13000) = -2000
    expect(monthMetrics.realizedCarProfit).toBe(-2000);

    // Expenses in September:
    // Car Expenses: 1000
    expect(monthMetrics.carExpenses).toBe(1000);
    // Business Expenses: 2500
    expect(monthMetrics.businessExpenses).toBe(2500);

    // Total Recovery in September: 11000
    expect(monthMetrics.totalRecovery).toBe(11000);

    // Net Business Profit in September: -2000 - 2500 = -4500
    expect(monthMetrics.netBusinessProfit).toBe(-4500);

    // Closing Stock Cars at end of September: car-2 is still active
    expect(monthMetrics.closingStockCars).toBe(1);
    expect(monthMetrics.closingStockValue).toBe(9000);

    // Closing Cash at end of September: 61000
    expect(monthMetrics.closingCash).toBe(61000);
  });

  it("handles zero data gracefully for new business state (4.5)", () => {
    const kpis = calculateOverallKpis({
      cars: [],
      carExpenses: [],
      businessExpenses: [],
      recoveries: [],
      cashTransactions: [],
      openingCash: 0,
    });

    expect(kpis.totalCarsBought).toBe(0);
    expect(kpis.totalCapital).toBe(0);
    expect(kpis.availableCash).toBe(0);
    expect(kpis.stockCars).toBe(0);
    expect(kpis.stockValue).toBe(0);
    expect(kpis.realizedCarProfit).toBe(0);
    expect(kpis.netBusinessProfit).toBe(0);
  });
});
