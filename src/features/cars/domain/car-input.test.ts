import { describe, expect, it } from "vitest";

import {
  createCarInputSchema,
  getBusinessDate,
  isFutureBusinessDate,
} from "./car-input";

const validPurchase = {
  purchaseDate: "2026-09-05",
  sellerId: "f958ad7b-66c5-4840-9fe7-75b47438ff2d",
  sourceType: "WALK_IN",
  sourceId: "",
  brand: "Toyota",
  model: "Camry",
  year: "2018",
  condition: "SCRAP",
  conditionOther: "",
  purchasePrice: "8000.00",
  paymentMethod: "CASH",
  vinChassis: "JT123",
  notes: "",
  idempotencyKey: "33c9ff6d-44f2-48d0-9ef2-46a2a2955df8",
  allowFutureDate: false,
  confirmDuplicateVin: false,
} as const;

describe("buy car input", () => {
  it("accepts a complete initial purchase without creating an expense", () => {
    const result = createCarInputSchema.safeParse(validPurchase);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.purchasePrice).toBe("8000.00");
      expect(result.data.year).toBe(2018);
    }
  });

  it("requires a named source for person-specific channels", () => {
    const result = createCarInputSchema.safeParse({
      ...validPurchase,
      sourceType: "MIDDLEMAN",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.sourceId).toContain(
        "Select a source name for this source type",
      );
    }
  });

  it("requires details when condition is Other", () => {
    const result = createCarInputSchema.safeParse({
      ...validPurchase,
      condition: "OTHER",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.conditionOther).toBeDefined();
    }
  });

  it("compares purchase dates using the configured business timezone", () => {
    const now = new Date("2026-09-05T20:30:00.000Z");

    expect(getBusinessDate(now, "Asia/Dubai")).toBe("2026-09-06");
    expect(isFutureBusinessDate("2026-09-07", now, "Asia/Dubai")).toBe(true);
    expect(isFutureBusinessDate("2026-09-06", now, "Asia/Dubai")).toBe(false);
  });
});
