import "server-only";

import { db } from "@/lib/db";
import {
  calculateFinanceSummary,
  calculateRunningBalances,
  type RawTransactionInput,
} from "../domain/finance-calculations";
import type {
  CustomCategoryItem,
  FinanceFilterParams,
  FinanceSummaryKpis,
  LedgerRowItem,
} from "../domain/finance-types";

export async function getOpeningCash(): Promise<number> {
  const openingTx = await db.cashTransaction.findFirst({
    where: {
      referenceType: "OPENING_BALANCE",
      status: "ACTIVE",
    },
    select: { amount: true },
  });

  return openingTx ? Number(openingTx.amount) : 0;
}

export async function getCustomCashCategories(): Promise<CustomCategoryItem[]> {
  const categories = await db.customCashCategory.findMany({
    orderBy: { name: "asc" },
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    direction: c.direction as "IN" | "OUT",
    createdAt: c.createdAt.toISOString(),
  }));
}

export async function getCarsForFinance() {
  return db.car.findMany({
    where: { status: { not: "VOIDED" } },
    select: {
      id: true,
      carNumber: true,
      brand: true,
      model: true,
      year: true,
    },
    orderBy: { carNumber: "desc" },
  });
}

export async function getFinanceLedgerData(filters: FinanceFilterParams = {}): Promise<{
  rows: LedgerRowItem[];
  summary: FinanceSummaryKpis;
  customCategories: CustomCategoryItem[];
  availableCars: Array<{
    id: string;
    carNumber: number;
    brand: string;
    model: string;
    year: number | null;
  }>;
  appliedFilters: FinanceFilterParams;
}> {
  const [openingCash, customCategories, availableCars, rawTransactions, itemRecoveries] =
    await Promise.all([
      getOpeningCash(),
      getCustomCashCategories(),
      getCarsForFinance(),
      db.cashTransaction.findMany({
        where: { status: "ACTIVE" },
        include: {
          car: {
            select: {
              id: true,
              carNumber: true,
              brand: true,
              model: true,
              year: true,
            },
          },
        },
        orderBy: [{ transactionDate: "asc" }, { createdAt: "asc" }],
      }),
      db.recoveryTransaction.findMany({
        where: { mode: "ITEM", status: "ACTIVE" },
        select: { id: true, itemType: true },
      }),
    ]);

  // Build itemTypeMap for Section 12.1 item categories (Engine, Body, Gearbox, etc.)
  const itemTypeMap = new Map<string, string>();
  for (const item of itemRecoveries) {
    if (item.itemType) {
      itemTypeMap.set(item.id, item.itemType);
    }
  }

  // Format raw transactions for running balance calculator
  const rawFormatted: RawTransactionInput[] = rawTransactions.map((tx) => ({
    id: tx.id,
    transactionDate: tx.transactionDate,
    createdAt: tx.createdAt,
    direction: tx.direction as "IN" | "OUT",
    category: tx.category,
    customCategory: tx.customCategory,
    referenceType: tx.referenceType,
    referenceId: tx.referenceId,
    amount: tx.amount.toString(),
    paymentMethod: tx.paymentMethod,
    description: tx.description,
    carId: tx.carId,
    carNumber: tx.car?.carNumber,
    carName: tx.car ? `${tx.car.brand} ${tx.car.model}` : null,
    status: tx.status,
  }));

  // Calculate full chronological running balance
  const allProcessedRows = calculateRunningBalances(
    rawFormatted,
    openingCash,
    itemTypeMap,
  );

  // Compute date thresholds for filter presets
  const todayStr = new Date().toISOString().slice(0, 10);
  let effectiveStartDate = filters.startDate || null;
  let effectiveEndDate = filters.endDate || null;

  if (filters.datePreset === "TODAY") {
    effectiveStartDate = todayStr;
    effectiveEndDate = todayStr;
  } else if (filters.datePreset === "THIS_WEEK") {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(now.setDate(diff));
    effectiveStartDate = monday.toISOString().slice(0, 10);
  } else if (filters.datePreset === "THIS_MONTH") {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    effectiveStartDate = firstDay.toISOString().slice(0, 10);
  }

  // Filter rows
  const filteredRows = allProcessedRows.filter((row) => {
    // Exclude opening balance row from standard display table if desired, or keep as reference
    if (row.isOpeningBalance) return false;

    // Date filtering
    if (effectiveStartDate && row.transactionDate < effectiveStartDate) {
      return false;
    }
    if (effectiveEndDate && row.transactionDate > effectiveEndDate) {
      return false;
    }

    // Direction filter
    if (filters.direction && filters.direction !== "ALL" && row.direction !== filters.direction) {
      return false;
    }

    // Category filter
    if (filters.category && filters.category !== "ALL" && row.category !== filters.category) {
      return false;
    }

    // Payment method filter
    if (
      filters.paymentMethod &&
      filters.paymentMethod !== "ALL" &&
      row.paymentMethod !== filters.paymentMethod
    ) {
      return false;
    }

    // Car ID filter
    if (filters.carId && filters.carId !== "ALL" && row.carId !== filters.carId) {
      return false;
    }

    // Search query
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      const matchDesc = row.description.toLowerCase().includes(q);
      const matchCat = row.category.toLowerCase().includes(q);
      const matchCar = row.carName?.toLowerCase().includes(q);
      const matchCarNo = row.carNumber && String(row.carNumber).includes(q);
      const matchRef = row.referenceId.toLowerCase().includes(q);
      return matchDesc || matchCat || matchCar || matchCarNo || matchRef;
    }

    return true;
  });

  const summary = calculateFinanceSummary(
    allProcessedRows,
    filteredRows,
    openingCash,
  );

  // Present display table in reverse chronological order (newest first)
  const displayRows = [...filteredRows].reverse();

  return {
    rows: displayRows,
    summary,
    customCategories,
    availableCars,
    appliedFilters: {
      ...filters,
      startDate: effectiveStartDate || undefined,
      endDate: effectiveEndDate || undefined,
    },
  };
}
