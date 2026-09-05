const carNumberPattern = /^CAR-(\d+)$/i;

export function formatCarNumber(value: number): string {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error("Car number must be a positive integer");
  }

  return `CAR-${value.toString().padStart(4, "0")}`;
}

export function parseCarNumber(value: string): number | null {
  const match = carNumberPattern.exec(value.trim());
  if (!match) return null;

  const parsed = Number(match[1]);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}
