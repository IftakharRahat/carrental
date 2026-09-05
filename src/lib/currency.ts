export function formatTaka(value: string | number | null | undefined): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "৳0.00";

  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
