import { describe, expect, it } from "vitest";
import {
  calculateBusinessExpensesKpis,
  calculateExpenseDetailsSummary,
  getDatePresetRange,
} from "./expense-calculations";
import type { BusinessExpenseItem, UnifiedExpenseRow } from "./expense-types";

describe("Expense Calculations & Presets", () => {
  const fixedDate = new Date("2026-08-26T10:00:00.000Z"); // Wednesday

  it("calculates correct date ranges for Section 14.2 presets", () => {
    const thisWeek = getDatePresetRange("THIS_WEEK", fixedDate);
    expect(thisWeek).toEqual({
      startDate: "2026-08-24", // Monday
      endDate: "2026-08-30", // Sunday
    });

    const lastWeek = getDatePresetRange("LAST_WEEK", fixedDate);
    expect(lastWeek).toEqual({
      startDate: "2026-08-17",
      endDate: "2026-08-23",
    });

    const thisMonth = getDatePresetRange("THIS_MONTH", fixedDate);
    expect(thisMonth).toEqual({
      startDate: "2026-08-01",
      endDate: "2026-08-31",
    });

    const lastMonth = getDatePresetRange("LAST_MONTH", fixedDate);
    expect(lastMonth).toEqual({
      startDate: "2026-07-01",
      endDate: "2026-07-31",
    });

    expect(getDatePresetRange("CUSTOM", fixedDate)).toBeNull();
  });

  it("calculates current month Business Expense KPIs correctly", () => {
    const expenses: BusinessExpenseItem[] = [
      {
        id: "1",
        expenseDate: "2026-08-05",
        category: "Shop Rent",
        group: "Fixed / Regular",
        amount: 8000,
        paymentMethod: "BANK_TRANSFER",
        description: "Monthly workshop rent",
        notes: null,
        status: "ACTIVE",
        voidReason: null,
        voidedAt: null,
        createdAt: "2026-08-05T00:00:00.000Z",
      },
      {
        id: "2",
        expenseDate: "2026-08-10",
        category: "Electricity",
        group: "Fixed / Regular",
        amount: 1500,
        paymentMethod: "CASH",
        description: "DEWA utility bill",
        notes: null,
        status: "ACTIVE",
        voidReason: null,
        voidedAt: null,
        createdAt: "2026-08-10T00:00:00.000Z",
      },
      {
        id: "3",
        expenseDate: "2026-08-15",
        category: "Shop Rent",
        group: "Fixed / Regular",
        amount: 2000,
        paymentMethod: "BANK_TRANSFER",
        description: "Rent balance",
        notes: null,
        status: "ACTIVE",
        voidReason: null,
        voidedAt: null,
        createdAt: "2026-08-15T00:00:00.000Z",
      },
      {
        id: "4",
        expenseDate: "2026-08-18",
        category: "Fuel",
        group: "Operating",
        amount: 400,
        paymentMethod: "CASH",
        description: "Voided test",
        notes: null,
        status: "VOIDED",
        voidReason: "Mistake",
        voidedAt: "2026-08-18T10:00:00.000Z",
        createdAt: "2026-08-18T00:00:00.000Z",
      },
      {
        id: "5",
        expenseDate: "2026-07-25",
        category: "Office/Miscellaneous",
        group: "Operating",
        amount: 900,
        paymentMethod: "CASH",
        description: "Previous month expense",
        notes: null,
        status: "ACTIVE",
        voidReason: null,
        voidedAt: null,
        createdAt: "2026-07-25T00:00:00.000Z",
      },
    ];

    const kpis = calculateBusinessExpensesKpis(expenses, fixedDate);

    // Active in August: 8000 + 1500 + 2000 = 11500
    expect(kpis.currentMonthTotal).toBe(11500);
    expect(kpis.currentMonthCount).toBe(3);
    expect(kpis.topCategoryThisMonth).toBe("Shop Rent");
    expect(kpis.topCategoryAmount).toBe(10000);
  });

  it("calculates Section 14.1 Combined Expense Summary correctly", () => {
    const rows: UnifiedExpenseRow[] = [
      {
        id: "c1",
        expenseDate: "2026-08-12",
        expenseType: "CAR",
        category: "Towing",
        reference: "CAR-1001",
        carId: "car-1",
        carNumber: 1001,
        carName: "Toyota Camry",
        description: "Recovery crane transport",
        amount: 350,
        paymentMethod: "CASH",
        notes: null,
        status: "ACTIVE",
      },
      {
        id: "c2",
        expenseDate: "2026-08-15",
        expenseType: "CAR",
        category: "Repairs / Parts",
        reference: "CAR-1002",
        carId: "car-2",
        carNumber: 1002,
        carName: "Nissan Altima",
        description: "Radiator fix",
        amount: 450,
        paymentMethod: "CASH",
        notes: null,
        status: "ACTIVE",
      },
      {
        id: "b1",
        expenseDate: "2026-08-18",
        expenseType: "BUSINESS",
        category: "Staff Salary",
        reference: "Business",
        carId: null,
        carNumber: null,
        carName: null,
        description: "Mechanic assistant weekly wage",
        amount: 1200,
        paymentMethod: "BANK_TRANSFER",
        notes: null,
        status: "ACTIVE",
      },
      {
        id: "b2",
        expenseDate: "2026-08-20",
        expenseType: "BUSINESS",
        category: "Fuel",
        reference: "Business",
        carId: null,
        carNumber: null,
        carName: null,
        description: "Forklift diesel",
        amount: 300,
        paymentMethod: "CASH",
        notes: null,
        status: "VOIDED",
      },
    ];

    const summary = calculateExpenseDetailsSummary(rows);

    // Car: 350 + 450 = 800
    // Business: 1200 (voided 300 ignored)
    // Total: 2000
    expect(summary.carExpenses).toBe(800);
    expect(summary.businessExpenses).toBe(1200);
    expect(summary.totalExpenses).toBe(2000);
  });
});
