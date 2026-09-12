import "server-only";

import { requireActor } from "@/lib/auth/actor";
import { db } from "@/lib/db";
import {
  calculateOverallKpis,
  calculateThisMonthMetrics,
  getDashboardMonthRange,
  type RawDashboardCar,
  type RawDashboardCashTx,
  type RawDashboardExpense,
  type RawDashboardRecovery,
} from "../domain/dashboard-calculations";
import type {
  ActiveCarOption,
  DashboardViewData,
} from "../domain/dashboard-types";
import { formatDubaiTime, getDubaiCurrentYearMonth } from "@/lib/date-utils";

export async function getDashboardData(
  selectedYear?: number,
  selectedMonth?: number,
): Promise<DashboardViewData> {
  // Enforce session authentication
  await requireActor();

  const { year: dubaiYear, month: dubaiMonth } = getDubaiCurrentYearMonth();
  const year = selectedYear || dubaiYear;
  const month = selectedMonth || dubaiMonth;

  const { startDate, endDate, monthLabel } = getDashboardMonthRange(year, month);

  // Concurrently fetch all necessary records from database
  const [
    rawCars,
    rawCarExpenses,
    rawBusinessExpenses,
    rawRecoveries,
    rawCashTransactions,
    openingCashRecord,
  ] = await Promise.all([
    db.car.findMany({
      where: { status: { not: "VOIDED" } },
      include: {
        expenses: {
          where: { status: "ACTIVE" },
          select: { amount: true, expenseDate: true },
        },
        recoveries: {
          where: { status: "ACTIVE" },
          select: { amount: true, saleDate: true },
        },
      },
      orderBy: { carNumber: "desc" },
    }),
    db.carExpense.findMany({
      where: { status: "ACTIVE" },
      select: { amount: true, expenseDate: true },
    }),
    db.businessExpense.findMany({
      where: { status: "ACTIVE" },
      select: { amount: true, expenseDate: true },
    }),
    db.recoveryTransaction.findMany({
      where: { status: "ACTIVE" },
      select: { amount: true, saleDate: true },
    }),
    db.cashTransaction.findMany({
      where: { status: "ACTIVE" },
      select: {
        amount: true,
        direction: true,
        category: true,
        transactionDate: true,
      },
    }),
    db.cashTransaction.findFirst({
      where: {
        referenceType: "OPENING_BALANCE",
        status: "ACTIVE",
      },
      select: { amount: true },
    }),
  ]);

  const openingCash = openingCashRecord ? Number(openingCashRecord.amount) : 0;

  // Format database records for the calculation engine
  const cars: RawDashboardCar[] = rawCars.map((c) => ({
    id: c.id,
    carNumber: c.carNumber,
    brand: c.brand,
    model: c.model,
    year: c.year,
    purchaseDate: c.purchaseDate.toISOString().slice(0, 10),
    purchasePrice: Number(c.purchasePrice),
    status: c.status,
    completionDate: c.completionDate ? c.completionDate.toISOString().slice(0, 10) : null,
    expenses: c.expenses.map((e) => ({
      amount: Number(e.amount),
      expenseDate: e.expenseDate.toISOString().slice(0, 10),
    })),
    recoveries: c.recoveries.map((r) => ({
      amount: Number(r.amount),
      saleDate: r.saleDate.toISOString().slice(0, 10),
    })),
  }));

  const carExpenses: RawDashboardExpense[] = rawCarExpenses.map((e) => ({
    amount: Number(e.amount),
    expenseDate: e.expenseDate.toISOString().slice(0, 10),
  }));

  const businessExpenses: RawDashboardExpense[] = rawBusinessExpenses.map((e) => ({
    amount: Number(e.amount),
    expenseDate: e.expenseDate.toISOString().slice(0, 10),
  }));

  const recoveries: RawDashboardRecovery[] = rawRecoveries.map((r) => ({
    amount: Number(r.amount),
    saleDate: r.saleDate.toISOString().slice(0, 10),
  }));

  const cashTransactions: RawDashboardCashTx[] = rawCashTransactions.map((tx) => ({
    amount: Number(tx.amount),
    direction: tx.direction as "IN" | "OUT",
    category: tx.category,
    transactionDate: tx.transactionDate.toISOString().slice(0, 10),
  }));

  // Perform pure calculations
  const overall = calculateOverallKpis({
    cars,
    carExpenses,
    businessExpenses,
    recoveries,
    cashTransactions,
    openingCash,
  });

  const thisMonth = calculateThisMonthMetrics({
    cars,
    carExpenses,
    businessExpenses,
    recoveries,
    cashTransactions,
    openingCash,
    startDate,
    endDate,
  });

  // Prepare active cars list for Quick Action modals
  const activeCars: ActiveCarOption[] = cars
    .filter((c) => c.status !== "COMPLETED")
    .map((c) => ({
      id: c.id,
      carNumber: c.carNumber,
      brand: c.brand,
      model: c.model,
      year: c.year,
      status: c.status,
      purchasePrice: c.purchasePrice,
      expensesTotal: c.expenses.reduce((s, e) => s + e.amount, 0),
      recoveryTotal: c.recoveries.reduce((s, r) => s + r.amount, 0),
    }));

  return {
    overall,
    thisMonth,
    currentMonthLabel: monthLabel,
    currentYear: year,
    currentMonth: month,
    lastRefreshedAt: formatDubaiTime(new Date()),
    activeCars,
    hasAnyData: cars.length > 0,
  };
}
