import { describe, expect, it } from "vitest";

import {
  calculateProjectedRecovery,
  checkCompletionEligibility,
  determinePostSaleCarStatus,
} from "./sales-calculations";

describe("sales-calculations", () => {
  describe("determinePostSaleCarStatus (Section 8.1 & 8.4)", () => {
    it("transitions directly to COMPLETED on Whole Car Sale", () => {
      const status = determinePostSaleCarStatus({
        currentStatus: "IN_STOCK",
        mode: "WHOLE_CAR",
      });
      expect(status).toBe("COMPLETED");

      const statusFromPartial = determinePostSaleCarStatus({
        currentStatus: "PARTIALLY_RECOVERED",
        mode: "WHOLE_CAR",
      });
      expect(statusFromPartial).toBe("COMPLETED");
    });

    it("transitions from IN_STOCK to PARTIALLY_RECOVERED on first item sale", () => {
      const status = determinePostSaleCarStatus({
        currentStatus: "IN_STOCK",
        mode: "ITEM",
      });
      expect(status).toBe("PARTIALLY_RECOVERED");
    });

    it("keeps status PARTIALLY_RECOVERED for subsequent item sales", () => {
      const status = determinePostSaleCarStatus({
        currentStatus: "PARTIALLY_RECOVERED",
        mode: "ITEM",
      });
      expect(status).toBe("PARTIALLY_RECOVERED");
    });

    it("marks as COMPLETED if user explicitly confirms completion", () => {
      const status = determinePostSaleCarStatus({
        currentStatus: "PARTIALLY_RECOVERED",
        mode: "ITEM",
        markCompleted: true,
      });
      expect(status).toBe("COMPLETED");
    });
  });

  describe("checkCompletionEligibility (Section 8.4)", () => {
    it("allows clean completion when 0 pending items remain", () => {
      const result = checkCompletionEligibility([
        { status: "SOLD" },
        { status: "SOLD" },
        { status: "CLOSED" },
      ]);
      expect(result.canCompleteCleanly).toBe(true);
      expect(result.pendingCount).toBe(0);
    });

    it("flags pending items when items remain unresolved", () => {
      const result = checkCompletionEligibility([
        { status: "SOLD" },
        { status: "PENDING" },
        { status: "PENDING" },
      ]);
      expect(result.canCompleteCleanly).toBe(false);
      expect(result.pendingCount).toBe(2);
    });
  });

  describe("calculateProjectedRecovery (Section 8.5)", () => {
    it("calculates Section 8.5 example: Purchase 8k + Expenses 2k, Engine 4k + Body 5k -> Pending", () => {
      const result = calculateProjectedRecovery({
        currentRecovery: 4000,
        newAmount: 5000,
        totalInvestment: 10000,
        willBeCompleted: false,
      });

      expect(result.projectedRecovery).toBe(9000);
      expect(result.isProfitPending).toBe(true);
      expect(result.projectedProfit).toBeNull();
    });

    it("calculates Section 8.5 final recovery: Copper 800 + Parts 500 -> Completed with AED 300 Profit", () => {
      const result = calculateProjectedRecovery({
        currentRecovery: 9000,
        newAmount: 1300,
        totalInvestment: 10000,
        willBeCompleted: true,
      });

      expect(result.projectedRecovery).toBe(10300);
      expect(result.isProfitPending).toBe(false);
      expect(result.projectedProfit).toBe(300);
    });
  });
});
