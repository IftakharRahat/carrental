import { describe, expect, it } from "vitest";
import {
  calculateFinanceSummary,
  calculateRunningBalances,
  type RawTransactionInput,
  resolveLedgerCategory,
} from "./finance-calculations";

describe("finance-calculations", () => {
  it("resolves Section 12 categories correctly", () => {
    const itemTypeMap = new Map([
      ["rec-1", "ENGINE"],
      ["rec-2", "COPPER"],
    ]);

    expect(
      resolveLedgerCategory({
        category: "WHOLE_CAR_SALE",
        referenceType: "RECOVERY_TRANSACTION",
        referenceId: "rec-0",
        direction: "IN",
      }),
    ).toBe("Whole Car Sale");

    expect(
      resolveLedgerCategory(
        {
          category: "ITEM_SALE",
          referenceType: "RECOVERY_TRANSACTION",
          referenceId: "rec-1",
          direction: "IN",
        },
        itemTypeMap,
      ),
    ).toBe("Engine Sale");

    expect(
      resolveLedgerCategory(
        {
          category: "ITEM_SALE",
          referenceType: "RECOVERY_TRANSACTION",
          referenceId: "rec-2",
          direction: "IN",
        },
        itemTypeMap,
      ),
    ).toBe("Copper Sale");

    expect(
      resolveLedgerCategory({
        category: "CAR_PURCHASE",
        referenceType: "CAR_PURCHASE",
        referenceId: "car-1",
        direction: "OUT",
      }),
    ).toBe("Car Purchase");

    expect(
      resolveLedgerCategory({
        category: "OTHER_INCOME",
        customCategory: "Battery Scrap Rebate",
        referenceType: "MANUAL",
        referenceId: "m-1",
        direction: "IN",
      }),
    ).toBe("Battery Scrap Rebate");
  });

  it("calculates chronological running balance with initial opening cash", () => {
    const openingCash = 10000;
    const txs: RawTransactionInput[] = [
      {
        id: "tx-2",
        transactionDate: "2026-03-05",
        createdAt: "2026-03-05T12:00:00Z",
        direction: "OUT",
        category: "CAR_EXPENSE",
        referenceType: "EXPENSE",
        referenceId: "exp-1",
        amount: 1500,
        paymentMethod: "CASH",
        description: "Transport towing",
        status: "ACTIVE",
      },
      {
        id: "tx-1",
        transactionDate: "2026-03-01",
        createdAt: "2026-03-01T10:00:00Z",
        direction: "IN",
        category: "WHOLE_CAR_SALE",
        referenceType: "RECOVERY",
        referenceId: "rec-1",
        amount: 8000,
        paymentMethod: "BANK_TRANSFER",
        description: "Sale of Camry",
        status: "ACTIVE",
      },
      {
        id: "tx-3",
        transactionDate: "2026-03-10",
        createdAt: "2026-03-10T15:00:00Z",
        direction: "OUT",
        category: "COMMISSION",
        referenceType: "COMMISSION",
        referenceId: "comm-1",
        amount: 500,
        paymentMethod: "CASH",
        description: "Middleman commission",
        status: "ACTIVE",
      },
    ];

    const rows = calculateRunningBalances(txs, openingCash);

    // Should sort chronologically: tx-1 (Mar 1), tx-2 (Mar 5), tx-3 (Mar 10)
    expect(rows[0].id).toBe("tx-1");
    // 10,000 + 8,000 = 18,000
    expect(rows[0].runningBalance).toBe(18000);

    expect(rows[1].id).toBe("tx-2");
    // 18,000 - 1,500 = 16,500
    expect(rows[1].runningBalance).toBe(16500);

    expect(rows[2].id).toBe("tx-3");
    // 16,500 - 500 = 16,000
    expect(rows[2].runningBalance).toBe(16000);
  });

  it("recalculates running balance accurately when backdated transactions exist", () => {
    const openingCash = 5000;
    const txs: RawTransactionInput[] = [
      {
        id: "tx-future",
        transactionDate: "2026-03-20",
        createdAt: "2026-03-01T00:00:00Z",
        direction: "OUT",
        category: "BUSINESS_EXPENSE",
        referenceType: "EXPENSE",
        referenceId: "exp-2",
        amount: 2000,
        paymentMethod: "BANK_TRANSFER",
        description: "Rent",
        status: "ACTIVE",
      },
      {
        id: "tx-backdated",
        transactionDate: "2026-03-05",
        createdAt: "2026-03-21T00:00:00Z", // Recorded later but backdated to Mar 5
        direction: "IN",
        category: "OTHER_INCOME",
        referenceType: "MANUAL",
        referenceId: "man-1",
        amount: 3000,
        paymentMethod: "CASH",
        description: "Scrap copper cash",
        status: "ACTIVE",
      },
    ];

    const rows = calculateRunningBalances(txs, openingCash);

    // Backdated transaction (Mar 5) precedes Mar 20
    expect(rows[0].id).toBe("tx-backdated");
    expect(rows[0].runningBalance).toBe(8000); // 5000 + 3000

    expect(rows[1].id).toBe("tx-future");
    expect(rows[1].runningBalance).toBe(6000); // 8000 - 2000
  });

  it("calculates summary KPIs conforming to the core formula Available Cash = Opening + In - Out", () => {
    const openingCash = 20000;
    const txs: RawTransactionInput[] = [
      {
        id: "1",
        transactionDate: "2026-03-01",
        createdAt: "2026-03-01T00:00:00Z",
        direction: "IN",
        category: "WHOLE_CAR_SALE",
        referenceType: "REC",
        referenceId: "1",
        amount: 15000,
        paymentMethod: "CASH",
        description: "Car sale",
        status: "ACTIVE",
      },
      {
        id: "2",
        transactionDate: "2026-03-02",
        createdAt: "2026-03-02T00:00:00Z",
        direction: "OUT",
        category: "CAR_PURCHASE",
        referenceType: "CAR",
        referenceId: "2",
        amount: 10000,
        paymentMethod: "BANK_TRANSFER",
        description: "Bought car",
        status: "ACTIVE",
      },
    ];

    const rows = calculateRunningBalances(txs, openingCash);
    const summary = calculateFinanceSummary(rows, rows, openingCash);

    expect(summary.openingCash).toBe(20000);
    expect(summary.moneyIn).toBe(15000);
    expect(summary.moneyOut).toBe(10000);
    // 20000 + 15000 - 10000 = 25000
    expect(summary.availableCash).toBe(25000);
  });
});
