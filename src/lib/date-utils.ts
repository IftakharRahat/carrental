/**
 * Canonical Application Timezone: Asia/Dubai (GST - Gulf Standard Time, UTC+4)
 */
export const DUBAI_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Dubai";

/**
 * Returns current year and month (1-12) in Dubai timezone.
 */
export function getDubaiCurrentYearMonth(date: Date = new Date()): {
  year: number;
  month: number;
} {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: DUBAI_TIMEZONE,
    year: "numeric",
    month: "numeric",
  });
  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  return { year, month };
}

/**
 * Returns today's date in YYYY-MM-DD format according to Dubai timezone.
 */
export function getDubaiTodayString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DUBAI_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Formats time in Dubai timezone (e.g. "09:56:56 PM").
 */
export function formatDubaiTime(
  date: Date = new Date(),
  options?: { includeZone?: boolean },
): string {
  const timeStr = date.toLocaleTimeString("en-US", {
    timeZone: DUBAI_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return options?.includeZone ? `${timeStr} (Dubai)` : timeStr;
}

/**
 * Formats full date in Dubai timezone (e.g. "12 September 2026").
 */
export function formatDubaiDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: DUBAI_TIMEZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
