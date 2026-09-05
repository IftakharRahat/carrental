import { describe, expect, it } from "vitest";

import { formatCarNumber, parseCarNumber } from "./car-number";

describe("car number", () => {
  it("formats the permanent display identifier", () => {
    expect(formatCarNumber(1)).toBe("CAR-0001");
    expect(formatCarNumber(12500)).toBe("CAR-12500");
  });

  it("parses a valid display identifier", () => {
    expect(parseCarNumber("car-0025")).toBe(25);
    expect(parseCarNumber("1")).toBe(1);
    expect(parseCarNumber("0025")).toBe(25);
    expect(parseCarNumber("CAR-X25")).toBeNull();
  });
});
