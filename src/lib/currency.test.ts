import { describe, expect, it } from "vitest";

import { formatAed, formatCurrency } from "./currency";

describe("formatAed", () => {
  it("formats positive numbers and string amounts with AED prefix", () => {
    expect(formatAed("8000.00")).toBe("AED 8,000.00");
    expect(formatAed(8000)).toBe("AED 8,000.00");
    expect(formatAed("1250000.5")).toBe("AED 1,250,000.50");
    expect(formatCurrency(8000)).toBe("AED 8,000.00");
  });

  it("handles negative amounts cleanly", () => {
    expect(formatAed(-500)).toBe("-AED 500.00");
    expect(formatAed("-1200.50")).toBe("-AED 1,200.50");
  });

  it("handles zero and empty values safely", () => {
    expect(formatAed(0)).toBe("AED 0.00");
    expect(formatAed("0")).toBe("AED 0.00");
    expect(formatAed("")).toBe("AED 0.00");
    expect(formatAed(null)).toBe("AED 0.00");
    expect(formatAed(undefined)).toBe("AED 0.00");
    expect(formatAed("invalid")).toBe("AED 0.00");
  });
});
