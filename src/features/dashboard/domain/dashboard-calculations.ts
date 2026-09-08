import { endOfMonth, format, startOfMonth } from "date-fns";

import type {
  OverallKpiMetrics,
  ThisMonthMetrics,
} from "./dashboard-types";

export type RawDashboardCar = {
  id: string;
  carNumber: number;
  brand: string;
  model: string;
  year?: number | null;
  purchaseDate: string;
  purchasePrice: number;
  status: string;
  completionDate?: string | null;
  expenses: { amount: number; expenseDate: string }[];
  recoveries: { amount: number; saleDate: string }[];
};

export type RawDashboardExpense = {
  amount: number;
  expenseDate: string;
};

export type RawDashboardRecovery = {
  amount: number;
  saleDate: string;
};

export type RawDashboardCashTx = {
  amount: number;
  direction: "IN" | "OUT";
  category: string;
  transactionDate: string;
};

export type CalculateDashboardInput = {
  cars: RawDashboardCar[];
  carExpenses: RawDashboardExpense[];
  businessExpenses: RawDashboardExpense[];
  recoveries: RawDashboardRecovery[];
  cashTransactions: RawDashboardCashTx[];
  openingCash: number;
  year?: number;
  month?: number;
};

export function getDashboardMonthRange(year: number, month: number) {
  const date = new Date(year, month - 1, 1);
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return {
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),
    monthLabel: format(date, "MMMM yyyy"),
  };
}

/**
 * Calculates overall lifetime KPI metrics according to section 4.2.
 */
export function calculateOverallKpis({
  cars,
  carExpenses,
  businessExpenses,
  recoveries,
  cashTransactions,
  openingCash,
}: {
  cars: RawDashboardCar[];
  carExpenses: RawDashboardExpense[];
  businessExpenses: RawDashboardExpense[];
  recoveries: RawDashboardRecovery[];
  cashTransactions: RawDashboardCashTx[];
  openingCash: number;
}): OverallKpiMetrics {
  const validCars = cars.filter((c) => c.status !== "VOIDED");

  // 1. Total Capital = Opening Capital + Capital Injections
  const capitalInjections = cashTransactions
    .filter((tx) => tx.category === "CAPITAL_INJECTION" && tx.direction === "IN")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalCapital = openingCash + capitalInjections;

  // 2. Available Cash = Opening Cash + all Money In - all Money Out
  const moneyIn = cashTransactions
    .filter((tx) => tx.direction === "IN")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const moneyOut = cashTransactions
    .filter((tx) => tx.direction === "OUT")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const availableCash = openingCash + moneyIn - moneyOut;

  // 3. Stock Cars = Count of cars not yet Completed
  const activeStockCars = validCars.filter((c) => c.status !== "COMPLETED");
  const stockCars = activeStockCars.length;

  // 4. Stock Value = Sum of Purchase Price + accumulated Car Expenses for cars not yet Completed
  const stockValue = activeStockCars.reduce((sum, car) => {
    const carExpTotal = car.expenses.reduce((s, e) => s + e.amount, 0);
    return sum + car.purchasePrice + carExpTotal;
  }, 0);

  // 5. Total Cars Bought = count of all purchase records
  const totalCarsBought = validCars.length;

  // 6. Total Cars Sold / Completed = count of cars with Completed status
  const completedCars = validCars.filter((c) => c.status === "COMPLETED");
  const totalCarsCompleted = completedCars.length;

  // 7. Total Realized Recovery = sum of all sale/recovery amounts
  const totalRealizedRecovery = recoveries.reduce((sum, r) => sum + r.amount, 0);

  // 8. Total Car Expenses
  const totalCarExpenses = carExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 9. Total Business Expenses
  const totalBusinessExpenses = businessExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 10. Realized Car Profit = Sum of (Total Recovery - Total Investment) for Completed cars only
  const realizedCarProfit = completedCars.reduce((sum, car) => {
    const carExpTotal = car.expenses.reduce((s, e) => s + e.amount, 0);
    const totalInvestment = car.purchasePrice + carExpTotal;
    const totalRecovery = car.recoveries.reduce((s, r) => s + r.amount, 0);
    return sum + (totalRecovery - totalInvestment);
  }, 0);

  // 11. Net Business Profit = Realized Car Profit - Total Business Expenses
  const netBusinessProfit = realizedCarProfit - totalBusinessExpenses;

  return {
    totalCapital: Math.round(totalCapital * 100) / 100,
    availableCash: Math.round(availableCash * 100) / 100,
    stockCars,
    stockValue: Math.round(stockValue * 100) / 100,
    totalCarsBought,
    totalCarsCompleted,
    totalRealizedRecovery: Math.round(totalRealizedRecovery * 100) / 100,
    totalCarExpenses: Math.round(totalCarExpenses * 100) / 100,
    totalBusinessExpenses: Math.round(totalBusinessExpenses * 100) / 100,
    realizedCarProfit: Math.round(realizedCarProfit * 100) / 100,
    netBusinessProfit: Math.round(netBusinessProfit * 100) / 100,
  };
}

/**
 * Calculates current-month metrics according to section 4.3.
 */
export function calculateThisMonthMetrics({
  cars,
  carExpenses,
  businessExpenses,
  recoveries,
  cashTransactions,
  openingCash,
  startDate,
  endDate,
}: {
  cars: RawDashboardCar[];
  carExpenses: RawDashboardExpense[];
  businessExpenses: RawDashboardExpense[];
  recoveries: RawDashboardRecovery[];
  cashTransactions: RawDashboardCashTx[];
  openingCash: number;
  startDate: string;
  endDate: string;
}): ThisMonthMetrics {
  const validCars = cars.filter((c) => c.status !== "VOIDED");

  // 1. Cars Bought in month
  const carsBoughtInMonth = validCars.filter(
    (c) => c.purchaseDate >= startDate && c.purchaseDate <= endDate,
  );
  const carsBought = carsBoughtInMonth.length;
  const purchaseAmount = carsBoughtInMonth.reduce((sum, c) => sum + c.purchasePrice, 0);

  // 2. Cars Sold / Completed in month
  const completedInMonth = validCars.filter(
    (c) =>
      c.status === "COMPLETED" &&
      c.completionDate &&
      c.completionDate >= startDate &&
      c.completionDate <= endDate,
  );
  const carsCompleted = completedInMonth.length;

  // 3. Realized Car Profit for cars completed in month
  const realizedCarProfit = completedInMonth.reduce((sum, car) => {
    const carExpTotal = car.expenses.reduce((s, e) => s + e.amount, 0);
    const totalInvestment = car.purchasePrice + carExpTotal;
    const totalRecovery = car.recoveries.reduce((s, r) => s + r.amount, 0);
    return sum + (totalRecovery - totalInvestment);
  }, 0);

  // 4. Car Expenses & Business Expenses in month
  const carExpensesInMonth = carExpenses.filter(
    (e) => e.expenseDate >= startDate && e.expenseDate <= endDate,
  );
  const monthlyCarExpenses = carExpensesInMonth.reduce((s, e) => s + e.amount, 0);

  const businessExpensesInMonth = businessExpenses.filter(
    (e) => e.expenseDate >= startDate && e.expenseDate <= endDate,
  );
  const monthlyBusinessExpenses = businessExpensesInMonth.reduce((s, e) => s + e.amount, 0);

  // 5. Total Recovery in month
  const recoveriesInMonth = recoveries.filter(
    (r) => r.saleDate >= startDate && r.saleDate <= endDate,
  );
  const totalRecovery = recoveriesInMonth.reduce((s, r) => s + r.amount, 0);

  // 6. Net Business Profit = Realized Car Profit - Business Expenses in month
  const netBusinessProfit = realizedCarProfit - monthlyBusinessExpenses;

  // 7. Closing Stock Cars as of month end:
  // Active inventory purchased on or before month end, and either not completed or completed after month end
  const activeAsOfMonthEnd = validCars.filter((car) => {
    if (car.purchaseDate > endDate) return false;
    if (car.completionDate && car.completionDate <= endDate) return false;
    return true;
  });
  const closingStockCars = activeAsOfMonthEnd.length;

  // 8. Closing Stock Value
  const closingStockValue = activeAsOfMonthEnd.reduce((sum, car) => {
    const expensesUpToMonthEnd = car.expenses
      .filter((e) => e.expenseDate <= endDate)
      .reduce((s, e) => s + e.amount, 0);
    return sum + car.purchasePrice + expensesUpToMonthEnd;
  }, 0);

  // 9. Closing Cash as of month end
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

  return {
    carsBought,
    carsCompleted,
    purchaseAmount: Math.round(purchaseAmount * 100) / 100,
    carExpenses: Math.round(monthlyCarExpenses * 100) / 100,
    businessExpenses: Math.round(monthlyBusinessExpenses * 100) / 100,
    totalRecovery: Math.round(totalRecovery * 100) / 100,
    realizedCarProfit: Math.round(realizedCarProfit * 100) / 100,
    netBusinessProfit: Math.round(netBusinessProfit * 100) / 100,
    closingStockCars,
    closingStockValue: Math.round(closingStockValue * 100) / 100,
    closingCash: Math.round(closingCash * 100) / 100,
  };
}
