export function formatAed(value: string | number | null | undefined): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "AED 0.00";

  const formatted = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return amount < 0 ? `-AED ${formatted}` : `AED ${formatted}`;
}

export const formatCurrency = formatAed;
// Backwards-compatibility alias
export const formatTaka = formatAed;
