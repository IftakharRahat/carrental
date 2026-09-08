import type {
  BusinessExpenseItem,
  BusinessExpensesPageKpis,
  ExpenseDetailsSummary,
  UnifiedExpenseRow,
} from "./expense-types";

export type DateRange = {
  startDate: string;
  endDate: string;
};

/**
 * Computes exact start and end dates (YYYY-MM-DD) for Section 14.2 Date Filter presets.
 */
export function getDatePresetRange(
  preset: "THIS_WEEK" | "LAST_WEEK" | "THIS_MONTH" | "LAST_MONTH" | "CUSTOM",
  referenceDate: Date = new Date(),
): DateRange | null {
  const y = referenceDate.getFullYear();
  const m = referenceDate.getMonth();
  const d = referenceDate.getDate();

  const toIsoDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  if (preset === "THIS_WEEK") {
    const dayOfWeek = referenceDate.getDay();
    // Monday as first day: if Sunday (0), go back 6 days, else go back (dayOfWeek - 1)
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(y, m, d + diffToMonday);
    const sunday = new Date(y, m, d + diffToMonday + 6);
    return {
      startDate: toIsoDate(monday),
      endDate: toIsoDate(sunday),
    };
  }

  if (preset === "LAST_WEEK") {
    const dayOfWeek = referenceDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const lastMonday = new Date(y, m, d + diffToMonday - 7);
    const lastSunday = new Date(y, m, d + diffToMonday - 1);
    return {
      startDate: toIsoDate(lastMonday),
      endDate: toIsoDate(lastSunday),
    };
  }

  if (preset === "THIS_MONTH") {
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    return {
      startDate: toIsoDate(firstDay),
      endDate: toIsoDate(lastDay),
    };
  }

  if (preset === "LAST_MONTH") {
    const firstDay = new Date(y, m - 1, 1);
    const lastDay = new Date(y, m, 0);
    return {
      startDate: toIsoDate(firstDay),
      endDate: toIsoDate(lastDay),
    };
  }

  return null;
}

/**
 * Calculates current month KPIs for Page 10 (Business Expenses).
 */
export function calculateBusinessExpensesKpis(
  expenses: BusinessExpenseItem[],
  referenceDate: Date = new Date(),
): BusinessExpensesPageKpis {
  const year = referenceDate.getFullYear();
  const monthStr = String(referenceDate.getMonth() + 1).padStart(2, "0");
  const monthPrefix = `${year}-${monthStr}`;

  let currentMonthTotal = 0;
  let currentMonthCount = 0;
  const categoryTotals = new Map<string, number>();

  for (const exp of expenses) {
    if (exp.status !== "ACTIVE") continue;

    if (exp.expenseDate.startsWith(monthPrefix)) {
      currentMonthTotal += exp.amount;
      currentMonthCount += 1;

      const existing = categoryTotals.get(exp.category) || 0;
      categoryTotals.set(exp.category, existing + exp.amount);
    }
  }

  let topCategoryThisMonth: string | null = null;
  let topCategoryAmount = 0;

  for (const [cat, total] of categoryTotals.entries()) {
    if (total > topCategoryAmount) {
      topCategoryAmount = total;
      topCategoryThisMonth = cat;
    }
  }

  return {
    currentMonthTotal: Math.round(currentMonthTotal * 100) / 100,
    currentMonthCount,
    topCategoryThisMonth,
    topCategoryAmount: Math.round(topCategoryAmount * 100) / 100,
  };
}

/**
 * Calculates Section 14.1 Summary for Expense Details.
 * Enforces rule: Total Expenses = Car Expenses + Business Expenses = visible rows sum.
 */
export function calculateExpenseDetailsSummary(
  rows: UnifiedExpenseRow[],
): ExpenseDetailsSummary {
  let carExpenses = 0;
  let businessExpenses = 0;

  for (const row of rows) {
    if (row.status !== "ACTIVE") continue;

    if (row.expenseType === "CAR") {
      carExpenses += row.amount;
    } else {
      businessExpenses += row.amount;
    }
  }

  const totalExpenses = carExpenses + businessExpenses;

  return {
    carExpenses: Math.round(carExpenses * 100) / 100,
    businessExpenses: Math.round(businessExpenses * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
  };
}
