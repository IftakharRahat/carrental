import "server-only";

import { isDatabaseConfigured } from "@/lib/config-state";
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
  if (!isDatabaseConfigured()) {
    return {
      expenses: [],
      pageKpis: {
        currentMonthTotal: 0,
        currentMonthCount: 0,
        topCategoryThisMonth: null,
        topCategoryAmount: 0,
        expenseToRevenueRatio: 0,
        avgDailyOverhead: 0,
        daysElapsedInMonth: 1,
        overheadCostPerCarPurchased: 0,
        carsPurchasedThisMonthCount: 0,
        momExpenseGrowth: 0,
        lastMonthTotal: 0,
        monthlyRevenue: 0,
      },
    };
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthStart = new Date(year, month, 1);
  const nextMonthStart = new Date(year, month + 1, 1);

  const [rawExpenses, carsPurchasedCount, recoveryRevenueAgg] =
    await Promise.all([
      db.businessExpense.findMany({
        orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
      }),
      db.car.count({
        where: {
          status: { not: "VOIDED" },
          purchaseDate: {
            gte: monthStart,
            lt: nextMonthStart,
          },
        },
      }),
      db.recoveryTransaction.aggregate({
        where: {
          status: "ACTIVE",
          saleDate: {
            gte: monthStart,
            lt: nextMonthStart,
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

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

  const monthlyRevenue = Number(recoveryRevenueAgg._sum.amount ?? 0);

  const pageKpis = calculateBusinessExpensesKpis(expenses, {
    referenceDate: now,
    carsPurchasedCount,
    monthlyRevenue,
  });

  return {
    expenses,
    pageKpis,
  };
}
