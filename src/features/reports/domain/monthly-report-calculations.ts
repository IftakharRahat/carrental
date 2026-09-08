import {
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from "date-fns";

import type {
  CompletedCarRow,
  MonthlyExpenseBreakdownItem,
  MonthlyMetrics,
  PurchasedCarRow,
} from "./monthly-report-types";

export type RawCarForReport = {
  id: string;
  carNumber: number;
  brand: string;
  model: string;
  purchaseDate: string;
  purchasePrice: number;
  status: string;
  completionDate?: string | null;
  sellerName: string;
  sourceName?: string | null;
  paymentMethod: string;
  expenses: { amount: number; expenseDate: string; category: string }[];
  recoveries: { amount: number; saleDate: string }[];
};

export type RawExpenseForReport = {
  id: string;
  amount: number;
  expenseDate: string;
  category: string;
  type: "CAR" | "BUSINESS";
};

export type RawCashTxForReport = {
  id: string;
  amount: number;
  direction: "IN" | "OUT";
  transactionDate: string;
};

export function getMonthDateRange(year: number, month: number): {
  startDate: string;
  endDate: string;
  monthLabel: string;
} {
  const date = new Date(year, month - 1, 1);
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return {
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),
    monthLabel: format(date, "MMMM yyyy"),
  };
}

export function calculateMonthlyReportMetrics({
  cars,
  carExpenses,
  businessExpenses,
  recoveryTransactions,
  cashTransactions,
  openingCash,
  startDate,
  endDate,
}: {
  cars: RawCarForReport[];
  carExpenses: RawExpenseForReport[];
  businessExpenses: RawExpenseForReport[];
  recoveryTransactions: { amount: number; saleDate: string }[];
  cashTransactions: RawCashTxForReport[];
  openingCash: number;
  startDate: string;
  endDate: string;
}): {
  metrics: MonthlyMetrics;
  completedCars: CompletedCarRow[];
  purchasedCars: PurchasedCarRow[];
  expenseBreakdown: MonthlyExpenseBreakdownItem[];
} {
  // 1. Cars Bought in month
  const carsBoughtList = cars.filter(
    (car) => car.purchaseDate >= startDate && car.purchaseDate <= endDate,
  );
  const carsBought = carsBoughtList.length;
  const purchaseAmount = carsBoughtList.reduce(
    (sum, car) => sum + car.purchasePrice,
    0,
  );

  const purchasedCars: PurchasedCarRow[] = carsBoughtList.map((car) => ({
    id: car.id,
    carNumber: car.carNumber,
    brand: car.brand,
    model: car.model,
    purchaseDate: car.purchaseDate,
    sellerName: car.sellerName,
    sourceName: car.sourceName,
    purchasePrice: car.purchasePrice,
    paymentMethod: car.paymentMethod,
  }));

  // 2. Cars Sold / Completed in month
  const completedCarsList = cars.filter(
    (car) =>
      car.status === "COMPLETED" &&
      car.completionDate &&
      car.completionDate >= startDate &&
      car.completionDate <= endDate,
  );
  const carsCompleted = completedCarsList.length;

  // Realized Car Profit: Sum of (Recovery - Investment) for completed cars ONLY.
  let realizedCarProfit = 0;
  const completedCars: CompletedCarRow[] = completedCarsList.map((car) => {
    const totalExp = car.expenses.reduce((s, e) => s + e.amount, 0);
    const totalInv = car.purchasePrice + totalExp;
    const totalRec = car.recoveries.reduce((s, r) => s + r.amount, 0);
    const profit = totalRec - totalInv;
    realizedCarProfit += profit;

    const pDate = parseISO(car.purchaseDate);
    const cDate = parseISO(car.completionDate!);
    const daysInStock = Math.max(
      0,
      Math.round((cDate.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24)),
    );

    return {
      id: car.id,
      carNumber: car.carNumber,
      brand: car.brand,
      model: car.model,
      purchaseDate: car.purchaseDate,
      completionDate: car.completionDate!,
      daysInStock,
      totalInvestment: totalInv,
      totalRecovery: totalRec,
      realizedProfit: profit,
    };
  });

  // 3. Monthly Car Expenses & Business Expenses
  const monthlyCarExp = carExpenses.filter(
    (e) => e.expenseDate >= startDate && e.expenseDate <= endDate,
  );
  const carExpensesTotal = monthlyCarExp.reduce((s, e) => s + e.amount, 0);

  const monthlyBizExp = businessExpenses.filter(
    (e) => e.expenseDate >= startDate && e.expenseDate <= endDate,
  );
  const businessExpensesTotal = monthlyBizExp.reduce((s, e) => s + e.amount, 0);

  // 4. Total Recovery in month
  const monthlyRecoveries = recoveryTransactions.filter(
    (r) => r.saleDate >= startDate && r.saleDate <= endDate,
  );
  const totalRecovery = monthlyRecoveries.reduce((s, r) => s + r.amount, 0);

  // 5. Net Business Profit = Realized Car Profit - Business Expenses
  const netBusinessProfit = realizedCarProfit - businessExpensesTotal;

  // 6. Closing Stock Cars (active inventory as of month end)
  // Car was purchased on or before month-end, and either not completed or completed AFTER month-end
  const activeStockCarsAsOfMonthEnd = cars.filter((car) => {
    if (car.purchaseDate > endDate) return false;
    if (car.status === "VOIDED") return false;
    if (car.completionDate && car.completionDate <= endDate) return false;
    return true;
  });
  const closingStockCars = activeStockCarsAsOfMonthEnd.length;

  // 7. Closing Stock Value: Purchase price + car expenses up to month-end for active cars
  const closingStockValue = activeStockCarsAsOfMonthEnd.reduce((sum, car) => {
    const expensesUpToMonthEnd = car.expenses
      .filter((e) => e.expenseDate <= endDate)
      .reduce((s, e) => s + e.amount, 0);
    return sum + car.purchasePrice + expensesUpToMonthEnd;
  }, 0);

  // 8. Closing Cash as of month end:
  // Lifetime Opening cash + Money In (<= endDate) - Money Out (<= endDate)
  const cashUpToMonthEnd = cashTransactions.filter(
    (tx) => tx.transactionDate <= endDate,
  );
  const moneyIn = cashUpToMonthEnd
    .filter((tx) => tx.direction === "IN")
    .reduce((s, tx) => s + tx.amount, 0);
  const moneyOut = cashUpToMonthEnd
    .filter((tx) => tx.direction === "OUT")
    .reduce((s, tx) => s + tx.amount, 0);
  const closingCash = openingCash + moneyIn - moneyOut;

  // 9. Expense Breakdown by Category
  const expenseMap = new Map<string, MonthlyExpenseBreakdownItem>();
  for (const exp of monthlyCarExp) {
    const key = `CAR_${exp.category}`;
    const curr = expenseMap.get(key) || {
      category: exp.category,
      type: "CAR",
      amount: 0,
      count: 0,
    };
    curr.amount += exp.amount;
    curr.count += 1;
    expenseMap.set(key, curr);
  }
  for (const exp of monthlyBizExp) {
    const key = `BIZ_${exp.category}`;
    const curr = expenseMap.get(key) || {
      category: exp.category,
      type: "BUSINESS",
      amount: 0,
      count: 0,
    };
    curr.amount += exp.amount;
    curr.count += 1;
    expenseMap.set(key, curr);
  }
  const expenseBreakdown = Array.from(expenseMap.values()).sort(
    (a, b) => b.amount - a.amount,
  );

  return {
    metrics: {
      carsBought,
      carsCompleted,
      purchaseAmount,
      carExpenses: carExpensesTotal,
      businessExpenses: businessExpensesTotal,
      totalRecovery,
      realizedCarProfit,
      netBusinessProfit,
      closingStockCars,
      closingStockValue,
      closingCash,
    },
    completedCars,
    purchasedCars,
    expenseBreakdown,
  };
}
