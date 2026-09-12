import { describe, expect, it } from "vitest";
import {
  DUBAI_TIMEZONE,
  formatDubaiDate,
  formatDubaiTime,
  getDubaiCurrentYearMonth,
  getDubaiTodayString,
} from "./date-utils";

describe("date-utils (Dubai timezone)", () => {
  it("uses Asia/Dubai timezone by default", () => {
    expect(DUBAI_TIMEZONE).toBe("Asia/Dubai");
  });

  it("correctly formats Dubai time with and without zone label", () => {
    // 2026-09-12T17:56:56.000Z (which is 21:56:56 / 09:56:56 PM in Dubai UTC+4)
    const fixedUtc = new Date("2026-09-12T17:56:56.000Z");
    const formatted = formatDubaiTime(fixedUtc);
    expect(formatted).toBe("09:56:56 PM");

    const withZone = formatDubaiTime(fixedUtc, { includeZone: true });
    expect(withZone).toBe("09:56:56 PM (Dubai)");
  });

  it("correctly returns Dubai date string YYYY-MM-DD across midnight", () => {
    // 2026-09-12T20:30:00.000Z is 2026-09-13T00:30:00 in Dubai (UTC+4)
    const lateUtc = new Date("2026-09-12T20:30:00.000Z");
    expect(getDubaiTodayString(lateUtc)).toBe("2026-09-13");

    // 2026-09-12T18:00:00.000Z is 2026-09-12T22:00:00 in Dubai (UTC+4)
    const earlierUtc = new Date("2026-09-12T18:00:00.000Z");
    expect(getDubaiTodayString(earlierUtc)).toBe("2026-09-12");
  });

  it("correctly extracts year and month in Dubai timezone", () => {
    const d = new Date("2026-09-12T17:56:56.000Z");
    const { year, month } = getDubaiCurrentYearMonth(d);
    expect(year).toBe(2026);
    expect(month).toBe(9);
  });

  it("formats full date in Dubai timezone", () => {
    const d = new Date("2026-09-12T17:56:56.000Z");
    expect(formatDubaiDate(d)).toBe("September 12, 2026");
  });
});
