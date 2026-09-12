import "server-only";

import { db } from "@/lib/db";
import {
  calculateExpenseDetailsSummary,
  getDatePresetRange,
} from "../domain/expense-calculations";
import {
  ALL_BUSINESS_EXPENSE_CATEGORIES,
  type ExpenseDetailsSummary,
  type UnifiedExpenseRow,
} from "../domain/expense-types";

export async function getExpenseDetailsPageData(): Promise<{
  rows: UnifiedExpenseRow[];
  initialSummary: ExpenseDetailsSummary;
  availableCategories: string[];
}> {
  const [rawCarExpenses, rawBusinessExpenses] = await Promise.all([
    db.carExpense.findMany({
      where: { status: "ACTIVE" },
      include: {
        car: {
          select: {
            id: true,
            carNumber: true,
            brand: true,
            model: true,
          },
        },
      },
      orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
    }),
    db.businessExpense.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const carRows: UnifiedExpenseRow[] = rawCarExpenses.map((exp) => {
    const categoryName =
      exp.categoryOther?.trim() || exp.category.replace(/_/g, " ");
    return {
      id: exp.id,
      expenseDate: exp.expenseDate.toISOString().slice(0, 10),
      expenseType: "CAR",
      category: categoryName,
      reference: exp.car ? `CAR-${exp.car.carNumber}` : "Car Expense",
      carId: exp.carId,
      carNumber: exp.car?.carNumber || null,
      carName: exp.car ? `${exp.car.brand} ${exp.car.model}` : null,
      description: exp.description,
      amount: Number(exp.amount),
      paymentMethod: exp.paymentMethod,
      notes: exp.notes,
      status: exp.status as "ACTIVE" | "VOIDED",
    };
  });

  const businessRows: UnifiedExpenseRow[] = rawBusinessExpenses.map((exp) => {
    const categoryName =
      exp.subcategory?.trim() || exp.category.replace(/_/g, " ");
    return {
      id: exp.id,
      expenseDate: exp.expenseDate.toISOString().slice(0, 10),
      expenseType: "BUSINESS",
      category: categoryName,
      reference: "Business",
      carId: null,
      carNumber: null,
      carName: null,
      description: exp.description,
      amount: Number(exp.amount),
      paymentMethod: exp.paymentMethod,
      notes: exp.notes,
      status: exp.status as "ACTIVE" | "VOIDED",
    };
  });

  // Combine and sort chronologically descending (newest first)
  const allRows: UnifiedExpenseRow[] = [...carRows, ...businessRows].sort(
    (a, b) => {
      const dateDiff = b.expenseDate.localeCompare(a.expenseDate);
      if (dateDiff !== 0) return dateDiff;
      return a.id.localeCompare(b.id);
    },
  );

  // Derive all unique categories (including all standard business categories, car categories, and recorded ones)
  const categoriesSet = new Set<string>();
  ALL_BUSINESS_EXPENSE_CATEGORIES.forEach((c) => categoriesSet.add(c));
  const KNOWN_CAR_CATEGORIES = [
    "TRANSPORT",
    "LABOUR",
    "PARTS",
    "REPAIR",
    "RTA_DOCUMENTATION",
    "OTHER",
  ];
  KNOWN_CAR_CATEGORIES.forEach((c) => categoriesSet.add(c));
  allRows.forEach((r) => categoriesSet.add(r.category));
  const availableCategories = Array.from(categoriesSet).sort();

  // Initial summary defaults to Section 14.1 "This Month"
  const thisMonthRange = getDatePresetRange("THIS_MONTH");
  const thisMonthRows = thisMonthRange
    ? allRows.filter(
        (r) =>
          r.expenseDate >= thisMonthRange.startDate &&
          r.expenseDate <= thisMonthRange.endDate,
      )
    : allRows;

  const initialSummary = calculateExpenseDetailsSummary(thisMonthRows);

  return {
    rows: allRows,
    initialSummary,
    availableCategories,
  };
}
