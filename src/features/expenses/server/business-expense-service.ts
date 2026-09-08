import "server-only";

import { db } from "@/lib/db";
import { calculateBusinessExpensesKpis } from "../domain/expense-calculations";
import {
  getCategoryGroup,
  type BusinessExpenseItem,
  type BusinessExpensesPageKpis,
} from "../domain/expense-types";

export async function getBusinessExpensesPageData(): Promise<{
  expenses: BusinessExpenseItem[];
  pageKpis: BusinessExpensesPageKpis;
}> {
  const rawExpenses = await db.businessExpense.findMany({
    orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
  });

  const expenses: BusinessExpenseItem[] = rawExpenses.map((exp) => {
    const categoryName = exp.subcategory || exp.category.replace(/_/g, " ");
    return {
      id: exp.id,
      expenseDate: exp.expenseDate.toISOString().slice(0, 10),
      category: categoryName,
      group: getCategoryGroup(categoryName),
      amount: Number(exp.amount),
      paymentMethod: exp.paymentMethod,
      description: exp.description,
      notes: exp.notes,
      status: exp.status as "ACTIVE" | "VOIDED",
      voidReason: exp.voidReason,
      voidedAt: exp.voidedAt?.toISOString() || null,
      createdAt: exp.createdAt.toISOString(),
    };
  });

  const pageKpis = calculateBusinessExpensesKpis(expenses);

  return {
    expenses,
    pageKpis,
  };
}
