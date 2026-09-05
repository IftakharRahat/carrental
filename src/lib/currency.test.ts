import { describe, expect, it } from "vitest";

import { formatTaka } from "./currency";

describe("formatTaka", () => {
  it("formats positive numbers and string amounts with ৳ symbol", () => {
    expect(formatTaka("8000.00")).toBe("৳8,000.00");
    expect(formatTaka(8000)).toBe("৳8,000.00");
    expect(formatTaka("1250000.5")).toBe("৳1,250,000.50");
  });

  it("handles zero and empty values safely", () => {
    expect(formatTaka(0)).toBe("৳0.00");
    expect(formatTaka("0")).toBe("৳0.00");
    expect(formatTaka("")).toBe("৳0.00");
    expect(formatTaka(null)).toBe("৳0.00");
    expect(formatTaka(undefined)).toBe("৳0.00");
    expect(formatTaka("invalid")).toBe("৳0.00");
  });
});
