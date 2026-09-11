import { describe, expect, it } from "vitest";
import {
  bulkCreateCarInputSchema,
  calculateBulkSummary,
} from "./bulk-car-input";

describe("bulk-car-input", () => {
  it("calculates bulk purchase totals and averages accurately", () => {
    const items = [
      { purchasePrice: "4000" },
      { purchasePrice: "6000" },
      { purchasePrice: "5000" },
    ];
    const summary = calculateBulkSummary(items);
    expect(summary.totalCarsCount).toBe(3);
    expect(summary.totalInvestment).toBe(15000);
    expect(summary.averagePricePerCar).toBe(5000);
  });

  it("validates bulk input schema requiring at least 2 cars", () => {
    const singleCarInput = {
      purchaseDate: "2026-09-12",
      sellerId: "seller-1",
      sourceType: "WALK_IN" as const,
      paymentMethod: "CASH" as const,
      items: [
        {
          brand: "Toyota",
          model: "Camry",
          condition: "SCRAP" as const,
          purchasePrice: "5000",
        },
      ],
    };
    const res = bulkCreateCarInputSchema.safeParse(singleCarInput);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.flatten().fieldErrors.items).toContain(
        "Bulk purchase requires at least 2 vehicles",
      );
    }
  });

  it("passes validation with multiple valid vehicles", () => {
    const validBulkInput = {
      purchaseDate: "2026-09-12",
      sellerId: "seller-1",
      sourceType: "WALK_IN" as const,
      paymentMethod: "CASH" as const,
      items: [
        {
          brand: "Toyota",
          model: "Camry",
          year: "2018",
          condition: "SCRAP" as const,
          purchasePrice: "5000",
        },
        {
          brand: "Honda",
          model: "Accord",
          year: "2019",
          condition: "ACCIDENT_DAMAGED" as const,
          purchasePrice: "7000",
        },
      ],
    };
    const res = bulkCreateCarInputSchema.safeParse(validBulkInput);
    expect(res.success).toBe(true);
  });
});
