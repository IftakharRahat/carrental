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

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen"
];
const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
];

function convertBelowThousand(n: number): string {
  let str = "";
  if (n >= 100) {
    str += ONES[Math.floor(n / 100)] + " Hundred ";
    n %= 100;
  }
  if (n >= 20) {
    str += TENS[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ONES[n % 10] : "");
  } else if (n > 0) {
    str += ONES[n];
  }
  return str.trim();
}

export function numberToAedWords(value: number | string | null | undefined): string {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num <= 0) return "Zero UAE Dirhams Only";

  const integerPart = Math.floor(num);
  const filsPart = Math.round((num - integerPart) * 100);

  if (integerPart === 0 && filsPart > 0) {
    return `${convertBelowThousand(filsPart)} Fils Only`;
  }

  let words = "";
  let remaining = integerPart;

  const millions = Math.floor(remaining / 1_000_000);
  remaining %= 1_000_000;
  const thousands = Math.floor(remaining / 1_000);
  remaining %= 1_000;
  const ones = remaining;

  if (millions > 0) {
    words += convertBelowThousand(millions) + " Million ";
  }
  if (thousands > 0) {
    words += convertBelowThousand(thousands) + " Thousand ";
  }
  if (ones > 0) {
    words += convertBelowThousand(ones);
  }

  words = words.trim() + " UAE Dirhams";

  if (filsPart > 0) {
    words += ` and ${convertBelowThousand(filsPart)} Fils`;
  }

  return words + " Only";
}

