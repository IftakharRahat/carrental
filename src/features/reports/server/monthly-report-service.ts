import "server-only";

import { db } from "@/lib/db";
import {
  calculateMonthlyReportMetrics,
  getMonthDateRange,
  type RawCarForReport,
  type RawCashTxForReport,
  type RawExpenseForReport,
} from "../domain/monthly-report-calculations";
import type {
  MonthEndSnapshot,
  MonthlyReportViewData,
} from "../domain/monthly-report-types";

export async function getMonthlyReportData(
  selectedYear?: number,
  selectedMonth?: number,
): Promise<MonthlyReportViewData> {
  const now = new Date();
  const year = selectedYear || now.getFullYear();
  const month = selectedMonth || now.getMonth() + 1;

  const { startDate, endDate, monthLabel } = getMonthDateRange(year, month);

  // Concurrently fetch all necessary records from database
  const [
    rawCars,
    rawCarExpenses,
    rawBusinessExpenses,
    rawRecoveries,
    rawCashTransactions,
    openingCashRecord,
    savedSnapshot,
  ] = await Promise.all([
    db.car.findMany({
      where: { status: { not: "VOIDED" } },
      include: {
        seller: { select: { name: true } },
        source: { select: { name: true } },
        expenses: {
          where: { status: "ACTIVE" },
          select: { amount: true, expenseDate: true, category: true },
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
      select: {
        id: true,
        amount: true,
        expenseDate: true,
        category: true,
      },
    }),
    db.businessExpense.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        amount: true,
        expenseDate: true,
        category: true,
      },
    }),
    db.recoveryTransaction.findMany({
      where: { status: "ACTIVE" },
      select: {
        amount: true,
        saleDate: true,
      },
    }),
    db.cashTransaction.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        amount: true,
        direction: true,
        transactionDate: true,
      },
    }),
    db.cashTransaction.findFirst({
      where: {
        category: "ADJUSTMENT",
        referenceType: "OPENING_BALANCE",
        status: "ACTIVE",
      },
    }),
    db.monthlySnapshot.findUnique({
      where: {
        year_month: { year, month },
      },
    }),
  ]);

  const openingCash = openingCashRecord ? Number(openingCashRecord.amount) : 0;

  // Format raw cars
  const cars: RawCarForReport[] = rawCars.map((c) => ({
    id: c.id,
    carNumber: c.carNumber,
    brand: c.brand,
    model: c.model,
    purchaseDate: c.purchaseDate.toISOString().slice(0, 10),
    purchasePrice: Number(c.purchasePrice),
    status: c.status,
    completionDate: c.completionDate
      ? c.completionDate.toISOString().slice(0, 10)
      : null,
    sellerName: c.seller.name,
    sourceName: c.source?.name || null,
    paymentMethod: c.paymentMethod,
    expenses: c.expenses.map((e) => ({
      amount: Number(e.amount),
      expenseDate: e.expenseDate.toISOString().slice(0, 10),
      category: e.category.replace(/_/g, " "),
    })),
    recoveries: c.recoveries.map((r) => ({
      amount: Number(r.amount),
      saleDate: r.saleDate.toISOString().slice(0, 10),
    })),
  }));

  // Format expenses
  const carExpenses: RawExpenseForReport[] = rawCarExpenses.map((e) => ({
    id: e.id,
    amount: Number(e.amount),
    expenseDate: e.expenseDate.toISOString().slice(0, 10),
    category: e.category.replace(/_/g, " "),
    type: "CAR",
  }));

  const businessExpenses: RawExpenseForReport[] = rawBusinessExpenses.map((e) => ({
    id: e.id,
    amount: Number(e.amount),
    expenseDate: e.expenseDate.toISOString().slice(0, 10),
    category: e.category.replace(/_/g, " "),
    type: "BUSINESS",
  }));

  // Format recoveries
  const recoveryTransactions = rawRecoveries.map((r) => ({
    amount: Number(r.amount),
    saleDate: r.saleDate.toISOString().slice(0, 10),
  }));

  // Format cash transactions
  const cashTransactions: RawCashTxForReport[] = rawCashTransactions.map((tx) => ({
    id: tx.id,
    amount: Number(tx.amount),
    direction: tx.direction,
    transactionDate: tx.transactionDate.toISOString().slice(0, 10),
  }));

  // Derive metrics
  const { metrics, completedCars, purchasedCars, expenseBreakdown } =
    calculateMonthlyReportMetrics({
      cars,
      carExpenses,
      businessExpenses,
      recoveryTransactions,
      cashTransactions,
      openingCash,
      startDate,
      endDate,
    });

  // Snapshot handling & drift check
  let snapshot: MonthEndSnapshot | null = null;
  if (savedSnapshot) {
    const hasDrift =
      savedSnapshot.closingStockCars !== metrics.closingStockCars ||
      Number(savedSnapshot.closingStockValue) !== metrics.closingStockValue ||
      Number(savedSnapshot.closingCash) !== metrics.closingCash ||
      Number(savedSnapshot.realizedCarProfit) !== metrics.realizedCarProfit;

    snapshot = {
      id: savedSnapshot.id,
      year: savedSnapshot.year,
      month: savedSnapshot.month,
      closingStockCars: savedSnapshot.closingStockCars,
      closingStockValue: Number(savedSnapshot.closingStockValue),
      closingCash: Number(savedSnapshot.closingCash),
      realizedCarProfit: Number(savedSnapshot.realizedCarProfit),
      netBusinessProfit: Number(savedSnapshot.netBusinessProfit),
      carsBought: savedSnapshot.carsBought,
      carsCompleted: savedSnapshot.carsCompleted,
      purchaseAmount: Number(savedSnapshot.purchaseAmount),
      carExpenses: Number(savedSnapshot.carExpenses),
      businessExpenses: Number(savedSnapshot.businessExpenses),
      totalRecovery: Number(savedSnapshot.totalRecovery),
      generatedById: savedSnapshot.generatedById,
      generatedAt: savedSnapshot.generatedAt.toISOString(),
      isPreserved: true,
      hasDrift,
    };
  }

  // Generate list of available months (current year down to 2025)
  const availableMonths: { year: number; month: number; label: string }[] = [];
  const currentY = now.getFullYear();
  const currentM = now.getMonth() + 1;

  for (let y = currentY; y >= currentY - 1; y--) {
    const maxM = y === currentY ? currentM : 12;
    for (let m = maxM; m >= 1; m--) {
      const d = new Date(y, m - 1, 1);
      availableMonths.push({
        year: y,
        month: m,
        label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      });
    }
  }

  return {
    year,
    month,
    monthLabel,
    metrics,
    snapshot,
    completedCars,
    purchasedCars,
    expenseBreakdown,
    availableMonths,
  };
}
