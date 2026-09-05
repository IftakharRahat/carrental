import { describe, expect, it } from "vitest";
import {
  calculateBuyerKpis,
  calculateOverallBuyersKpis,
  canDeleteBuyer,
} from "./buyer-calculations";
import type { BuyerListItem } from "./buyer-types";

describe("buyer-calculations", () => {
  describe("calculateBuyerKpis", () => {
    it("returns zero counts and null lastPurchaseDate when transactions are empty", () => {
      const result = calculateBuyerKpis([]);
      expect(result).toEqual({
        totalPurchasesCount: 0,
        totalAmountPaid: 0,
        lastPurchaseDate: null,
      });
    });

    it("aggregates active transactions, calculates sum in AED, and identifies latest date", () => {
      const transactions = [
        { amount: 5000, saleDate: "2026-08-01", status: "ACTIVE" as const },
        { amount: 12000, saleDate: "2026-09-02", status: "ACTIVE" as const },
        { amount: 3000, saleDate: "2026-08-15", status: "VOIDED" as const }, // Should be ignored
      ];

      const result = calculateBuyerKpis(transactions);
      expect(result.totalPurchasesCount).toBe(2);
      expect(result.totalAmountPaid).toBe(17000);
      expect(result.lastPurchaseDate).toBe("2026-09-02");
    });
  });

  describe("canDeleteBuyer (Section 11.3 constraint)", () => {
    it("permits hard deletion when buyer has 0 recorded transactions", () => {
      const result = canDeleteBuyer(0);
      expect(result.canDelete).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("strictly forbids deletion when buyer has 1 or more transactions", () => {
      const result = canDeleteBuyer(3);
      expect(result.canDelete).toBe(false);
      expect(result.reason).toContain("Archive or deactivate");
    });
  });

  describe("calculateOverallBuyersKpis", () => {
    it("aggregates overall page KPIs accurately across buyers", () => {
      const mockBuyers: BuyerListItem[] = [
        {
          id: "b1",
          name: "Buyer 1",
          companyName: "Co 1",
          phone: "+971501111111",
          whatsapp: null,
          location: "Sharjah",
          notes: null,
          isActive: true,
          types: [{ id: "t1", name: "Engine" }],
          kpis: {
            totalPurchasesCount: 2,
            totalAmountPaid: 20000,
            lastPurchaseDate: "2026-09-01",
          },
          createdAt: "2026-08-01",
        },
        {
          id: "b2",
          name: "Buyer 2",
          companyName: null,
          phone: "+971502222222",
          whatsapp: null,
          location: "Dubai",
          notes: null,
          isActive: false, // Inactive
          types: [{ id: "t2", name: "Whole Car / Body" }],
          kpis: {
            totalPurchasesCount: 1,
            totalAmountPaid: 10000,
            lastPurchaseDate: "2026-08-10",
          },
          createdAt: "2026-08-05",
        },
        {
          id: "b3",
          name: "Buyer 3 (New)",
          companyName: null,
          phone: null,
          whatsapp: null,
          location: null,
          notes: null,
          isActive: true,
          types: [],
          kpis: {
            totalPurchasesCount: 0,
            totalAmountPaid: 0,
            lastPurchaseDate: null,
          },
          createdAt: "2026-09-05",
        },
      ];

      const kpis = calculateOverallBuyersKpis(mockBuyers);
      expect(kpis.totalBuyers).toBe(3);
      expect(kpis.activeBuyers).toBe(2);
      expect(kpis.totalRecoveredAmount).toBe(30000);
      expect(kpis.averagePurchasePerBuyer).toBe(15000); // 30000 / 2 buyers with purchases
    });
  });
});
