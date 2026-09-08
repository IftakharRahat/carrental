import { describe, expect, it } from "vitest";

import {
  calculateMonthlyReportMetrics,
  getMonthDateRange,
} from "./monthly-report-calculations";

describe("monthly-report-calculations", () => {
  it("bounds monthly date range correctly", () => {
    const rangeAug = getMonthDateRange(2026, 8);
    expect(rangeAug.startDate).toBe("2026-08-01");
    expect(rangeAug.endDate).toBe("2026-08-31");
    expect(rangeAug.monthLabel).toBe("August 2026");

    const rangeFeb = getMonthDateRange(2026, 2);
    expect(rangeFeb.startDate).toBe("2026-02-01");
    expect(rangeFeb.endDate).toBe("2026-02-28");
  });

  it("calculates Section 15.1 monthly metrics with strict rules", () => {
    const cars = [
      // Completed in August 2026
      {
        id: "car-1",
        carNumber: 101,
        brand: "Toyota",
        model: "Camry",
        purchaseDate: "2026-08-05",
        purchasePrice: 10000,
        status: "COMPLETED",
        completionDate: "2026-08-20",
        sellerName: "John Seller",
        paymentMethod: "CASH",
        expenses: [{ amount: 1500, expenseDate: "2026-08-10", category: "Parts" }],
        recoveries: [{ amount: 14000, saleDate: "2026-08-20" }],
      },
      // Active / In-Stock as of end of August
      {
        id: "car-2",
        carNumber: 102,
        brand: "Nissan",
        model: "Altima",
        purchaseDate: "2026-08-15",
        purchasePrice: 12000,
        status: "IN_STOCK",
        completionDate: null,
        sellerName: "Ahmed",
        paymentMethod: "BANK_TRANSFER",
        expenses: [{ amount: 800, expenseDate: "2026-08-18", category: "Transport" }],
        recoveries: [{ amount: 3000, saleDate: "2026-08-25" }], // partial recovery
      },
      // Purchased in July, completed in September (so active in August)
      {
        id: "car-3",
        carNumber: 103,
        brand: "Honda",
        model: "Civic",
        purchaseDate: "2026-07-20",
        purchasePrice: 8000,
        status: "COMPLETED",
        completionDate: "2026-09-02",
        sellerName: "Garage A",
        paymentMethod: "CASH",
        expenses: [{ amount: 500, expenseDate: "2026-07-25", category: "Labor" }],
        recoveries: [{ amount: 10000, saleDate: "2026-09-02" }],
      },
      // Purchased in September (future to August)
      {
        id: "car-4",
        carNumber: 104,
        brand: "Ford",
        model: "Focus",
        purchaseDate: "2026-09-05",
        purchasePrice: 5000,
        status: "IN_STOCK",
        completionDate: null,
        sellerName: "Walk-in",
        paymentMethod: "CASH",
        expenses: [],
        recoveries: [],
      },
    ];

    const carExpenses = [
      { id: "e1", amount: 1500, expenseDate: "2026-08-10", category: "Parts", type: "CAR" as const },
      { id: "e2", amount: 800, expenseDate: "2026-08-18", category: "Transport", type: "CAR" as const },
      { id: "e3", amount: 500, expenseDate: "2026-07-25", category: "Labor", type: "CAR" as const },
    ];

    const businessExpenses = [
      { id: "b1", amount: 3000, expenseDate: "2026-08-01", category: "Rent", type: "BUSINESS" as const },
      { id: "b2", amount: 500, expenseDate: "2026-08-12", category: "Electricity", type: "BUSINESS" as const },
    ];

    const recoveryTransactions = [
      { amount: 14000, saleDate: "2026-08-20" },
      { amount: 3000, saleDate: "2026-08-25" },
    ];

    const cashTransactions = [
      { id: "tx1", amount: 50000, direction: "IN" as const, transactionDate: "2026-07-01" },
      { id: "tx2", amount: 14000, direction: "IN" as const, transactionDate: "2026-08-20" },
      { id: "tx3", amount: 3000, direction: "IN" as const, transactionDate: "2026-08-25" },
      { id: "tx4", amount: 10000, direction: "OUT" as const, transactionDate: "2026-08-05" },
      { id: "tx5", amount: 12000, direction: "OUT" as const, transactionDate: "2026-08-15" },
      { id: "tx6", amount: 3500, direction: "OUT" as const, transactionDate: "2026-08-12" },
    ];

    const result = calculateMonthlyReportMetrics({
      cars,
      carExpenses,
      businessExpenses,
      recoveryTransactions,
      cashTransactions,
      openingCash: 0,
      startDate: "2026-08-01",
      endDate: "2026-08-31",
    });

    const { metrics } = result;

    // 1. Cars Bought: car-1 and car-2 bought in August
    expect(metrics.carsBought).toBe(2);
    expect(metrics.purchaseAmount).toBe(22000); // 10000 + 12000

    // 2. Cars Completed: only car-1 completed in August
    expect(metrics.carsCompleted).toBe(1);

    // 3. Realized Car Profit: for car-1 only: Recovery (14000) - Inv (10000 + 1500) = 2500
    // Active/partial car-2 is strictly excluded!
    expect(metrics.realizedCarProfit).toBe(2500);

    // 4. Car & Business Expenses in August
    expect(metrics.carExpenses).toBe(2300); // 1500 + 800
    expect(metrics.businessExpenses).toBe(3500); // 3000 + 500

    // 5. Total Recovery in August
    expect(metrics.totalRecovery).toBe(17000); // 14000 + 3000

    // 6. Net Business Profit: Realized Car Profit (2500) - Business Expenses (3500) = -1000
    expect(metrics.netBusinessProfit).toBe(-1000);

    // 7. Closing Stock Cars as of August 31: car-2 and car-3 (car-4 is in September, car-1 was completed)
    expect(metrics.closingStockCars).toBe(2);

    // 8. Closing Stock Value:
    // car-2: purchase (12000) + exp (800) = 12800
    // car-3: purchase (8000) + exp (500) = 8500
    // Total = 12800 + 8500 = 21300
    // (Notice partial recovery on car-2 does NOT reduce stock value)
    expect(metrics.closingStockValue).toBe(21300);

    // 9. Closing Cash as of August 31:
    // IN: 50000 + 14000 + 3000 = 67000
    // OUT: 10000 + 12000 + 3500 = 25500
    // Balance = 67000 - 25500 = 41500
    expect(metrics.closingCash).toBe(41500);
  });
});
