import {
  differenceInDays,
  endOfMonth,
  endOfYear,
  format,
  parseISO,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns";

import type {
  AnalyticsDatePreset,
  AnalyticsOverview,
  BrandAnalyticsRow,
  BusinessAnalyticsData,
  BuyerCategoryAnalyticsRow,
  ConditionAnalyticsRow,
  SourceAnalyticsRow,
  TopBuyerAnalyticsRow,
} from "./analytics-types";

export type RawCarForAnalytics = {
  id: string;
  carNumber: number;
  brand: string;
  model: string;
  condition: string;
  purchasePrice: number;
  purchaseDate: string;
  status: string;
  completionDate?: string | null;
  sourceId?: string | null;
  sourceName?: string | null;
  sourceType?: string | null;
  expenses: { amount: number; expenseDate: string }[];
  recoveries: {
    id: string;
    buyerId: string;
    buyerName: string;
    buyerCompany?: string | null;
    buyerTypes: string[];
    mode: string;
    itemType?: string | null;
    amount: number;
    saleDate: string;
  }[];
};

export type RawCommissionForAnalytics = {
  carId?: string | null;
  amount: number;
};

export function getAnalyticsPresetRange(
  preset: AnalyticsDatePreset,
  now: Date = new Date(),
): { startDate: string | null; endDate: string | null } {
  switch (preset) {
    case "THIS_MONTH":
      return {
        startDate: format(startOfMonth(now), "yyyy-MM-dd"),
        endDate: format(endOfMonth(now), "yyyy-MM-dd"),
      };
    case "LAST_3_MONTHS":
      return {
        startDate: format(startOfMonth(subMonths(now, 2)), "yyyy-MM-dd"),
        endDate: format(endOfMonth(now), "yyyy-MM-dd"),
      };
    case "THIS_YEAR":
      return {
        startDate: format(startOfYear(now), "yyyy-MM-dd"),
        endDate: format(endOfYear(now), "yyyy-MM-dd"),
      };
    case "ALL_TIME":
    default:
      return { startDate: null, endDate: null };
  }
}

export function formatConditionLabel(condition: string): string {
  switch (condition) {
    case "SCRAP":
      return "Scrap";
    case "ACCIDENT_DAMAGED":
      return "Accident / Damaged";
    case "ENGINE_ISSUE":
      return "Engine Issue";
    case "GEARBOX_ISSUE":
      return "Gearbox Issue";
    case "OTHER":
    default:
      return "Other";
  }
}

export function resolveBuyerCategory(mode: string, itemType?: string | null): string {
  if (mode === "WHOLE_CAR") return "Whole Car / Body";
  if (!itemType) return "Other";
  switch (itemType) {
    case "ENGINE":
      return "Engine";
    case "BODY":
      return "Whole Car / Body";
    case "GEARBOX":
      return "Parts";
    case "COPPER":
      return "Copper";
    case "PARTS":
      return "Parts";
    default:
      return "Other";
  }
}

export function calculateBusinessAnalytics({
  cars,
  commissions = [],
  startDate,
  endDate,
}: {
  cars: RawCarForAnalytics[];
  commissions?: RawCommissionForAnalytics[];
  startDate: string | null;
  endDate: string | null;
}): BusinessAnalyticsData {
  // Filter cars by purchaseDate range if specified
  const filteredCars = cars.filter((c) => {
    if (c.status === "VOIDED") return false;
    if (startDate && c.purchaseDate < startDate) return false;
    if (endDate && c.purchaseDate > endDate) return false;
    return true;
  });

  // 1. Overview Totals
  const totalCarsBought = filteredCars.length;
  let totalCarsCompleted = 0;
  let totalInvestment = 0;
  let totalRecovery = 0;
  let totalRealizedProfit = 0;
  let totalTurnaroundDays = 0;

  for (const car of filteredCars) {
    const carExp = car.expenses.reduce((s, e) => s + e.amount, 0);
    const carInv = car.purchasePrice + carExp;
    const carRec = car.recoveries.reduce((s, r) => s + r.amount, 0);

    totalInvestment += carInv;
    totalRecovery += carRec;

    if (car.status === "COMPLETED") {
      totalCarsCompleted += 1;
      const profit = carRec - carInv;
      totalRealizedProfit += profit;

      if (car.completionDate) {
        const pDate = parseISO(car.purchaseDate);
        const cDate = parseISO(car.completionDate);
        totalTurnaroundDays += Math.max(0, differenceInDays(cDate, pDate));
      }
    }
  }

  const overview: AnalyticsOverview = {
    totalCarsBought,
    totalCarsCompleted,
    totalInvestment,
    totalRecovery,
    totalRealizedProfit,
    avgProfitPerCompletedCar:
      totalCarsCompleted > 0
        ? Math.round(totalRealizedProfit / totalCarsCompleted)
        : 0,
    avgDaysInStock:
      totalCarsCompleted > 0
        ? Math.round(totalTurnaroundDays / totalCarsCompleted)
        : 0,
  };

  // 2. Section 16.1 Brand-Wise Analytics
  const brandMap = new Map<
    string,
    {
      brand: string;
      carsBought: number;
      carsCompleted: number;
      totalInvestment: number;
      totalRecovery: number;
      realizedCarProfit: number;
    }
  >();

  for (const car of filteredCars) {
    const brandKey = car.brand.trim() || "Unknown";
    const curr = brandMap.get(brandKey) || {
      brand: brandKey,
      carsBought: 0,
      carsCompleted: 0,
      totalInvestment: 0,
      totalRecovery: 0,
      realizedCarProfit: 0,
    };

    const carExp = car.expenses.reduce((s, e) => s + e.amount, 0);
    const carInv = car.purchasePrice + carExp;
    const carRec = car.recoveries.reduce((s, r) => s + r.amount, 0);

    curr.carsBought += 1;
    curr.totalInvestment += carInv;
    curr.totalRecovery += carRec;

    if (car.status === "COMPLETED") {
      curr.carsCompleted += 1;
      curr.realizedCarProfit += carRec - carInv; // completed cars only
    }

    brandMap.set(brandKey, curr);
  }

  const brandAnalytics: BrandAnalyticsRow[] = Array.from(brandMap.values())
    .map((b) => ({
      brand: b.brand,
      carsBought: b.carsBought,
      carsCompleted: b.carsCompleted,
      totalInvestment: b.totalInvestment,
      totalRecovery: b.totalRecovery,
      realizedCarProfit: b.realizedCarProfit,
      averageRealizedCarProfit:
        b.carsCompleted > 0 ? Math.round(b.realizedCarProfit / b.carsCompleted) : 0,
    }))
    .sort((a, b) => b.carsBought - a.carsBought);

  // 3. Section 16.2 Condition-Wise Analytics
  const conditionOrder = [
    "SCRAP",
    "ACCIDENT_DAMAGED",
    "ENGINE_ISSUE",
    "GEARBOX_ISSUE",
    "OTHER",
  ];
  const conditionMap = new Map<
    string,
    {
      carsBought: number;
      carsCompleted: number;
      totalInvestment: number;
      totalRecovery: number;
      realizedCarProfit: number;
      totalDays: number;
    }
  >();

  for (const c of conditionOrder) {
    conditionMap.set(c, {
      carsBought: 0,
      carsCompleted: 0,
      totalInvestment: 0,
      totalRecovery: 0,
      realizedCarProfit: 0,
      totalDays: 0,
    });
  }

  for (const car of filteredCars) {
    const condKey = conditionMap.has(car.condition) ? car.condition : "OTHER";
    const curr = conditionMap.get(condKey)!;

    const carExp = car.expenses.reduce((s, e) => s + e.amount, 0);
    const carInv = car.purchasePrice + carExp;
    const carRec = car.recoveries.reduce((s, r) => s + r.amount, 0);

    curr.carsBought += 1;
    curr.totalInvestment += carInv;
    curr.totalRecovery += carRec;

    if (car.status === "COMPLETED") {
      curr.carsCompleted += 1;
      curr.realizedCarProfit += carRec - carInv;
      if (car.completionDate) {
        const pDate = parseISO(car.purchaseDate);
        const cDate = parseISO(car.completionDate);
        curr.totalDays += Math.max(0, differenceInDays(cDate, pDate));
      }
    }
  }

  const conditionAnalytics: ConditionAnalyticsRow[] = conditionOrder.map((cond) => {
    const stats = conditionMap.get(cond)!;
    return {
      condition: cond,
      conditionLabel: formatConditionLabel(cond),
      carsBought: stats.carsBought,
      carsCompleted: stats.carsCompleted,
      averageInvestment:
        stats.carsBought > 0 ? Math.round(stats.totalInvestment / stats.carsBought) : 0,
      averageRecovery:
        stats.carsBought > 0 ? Math.round(stats.totalRecovery / stats.carsBought) : 0,
      averageRealizedCarProfit:
        stats.carsCompleted > 0
          ? Math.round(stats.realizedCarProfit / stats.carsCompleted)
          : 0,
      averageDaysInStock:
        stats.carsCompleted > 0
          ? Math.round(stats.totalDays / stats.carsCompleted)
          : 0,
    };
  });

  // 4. Section 16.3 Source-Wise Analytics
  const sourceMap = new Map<
    string,
    {
      sourceId: string | null;
      sourceName: string;
      sourceType: string;
      carsBought: number;
      carsCompleted: number;
      purchaseValue: number;
      commissionPaid: number;
      totalRecovery: number;
      realizedCarProfit: number;
    }
  >();

  const carCommissionMap = new Map<string, number>();
  for (const comm of commissions) {
    if (comm.carId) {
      carCommissionMap.set(
        comm.carId,
        (carCommissionMap.get(comm.carId) || 0) + comm.amount,
      );
    }
  }

  for (const car of filteredCars) {
    const key = car.sourceId || `type_${car.sourceType || "WALK_IN"}`;
    const name = car.sourceName || "Direct / Walk-in";
    const type = car.sourceType || "Walk-in";

    const curr = sourceMap.get(key) || {
      sourceId: car.sourceId || null,
      sourceName: name,
      sourceType: type,
      carsBought: 0,
      carsCompleted: 0,
      purchaseValue: 0,
      commissionPaid: 0,
      totalRecovery: 0,
      realizedCarProfit: 0,
    };

    const carExp = car.expenses.reduce((s, e) => s + e.amount, 0);
    const carInv = car.purchasePrice + carExp;
    const carRec = car.recoveries.reduce((s, r) => s + r.amount, 0);
    const carComm = carCommissionMap.get(car.id) || 0;

    curr.carsBought += 1;
    curr.purchaseValue += car.purchasePrice;
    curr.commissionPaid += carComm;
    curr.totalRecovery += carRec;

    if (car.status === "COMPLETED") {
      curr.carsCompleted += 1;
      curr.realizedCarProfit += carRec - carInv;
    }

    sourceMap.set(key, curr);
  }

  const sourceAnalytics: SourceAnalyticsRow[] = Array.from(sourceMap.values())
    .map((s) => ({
      sourceId: s.sourceId,
      sourceName: s.sourceName,
      sourceType: s.sourceType,
      carsBought: s.carsBought,
      carsCompleted: s.carsCompleted,
      purchaseValue: s.purchaseValue,
      commissionPaid: s.commissionPaid,
      totalRecovery: s.totalRecovery,
      realizedCarProfit: s.realizedCarProfit,
      averageRealizedCarProfit:
        s.carsCompleted > 0 ? Math.round(s.realizedCarProfit / s.carsCompleted) : 0,
    }))
    .sort((a, b) => b.carsBought - a.carsBought);

  // 5. Section 16.4 Buyer-Wise Analytics
  const buyerCategoryOrder = [
    "Whole Car / Body",
    "Engine",
    "Scrap",
    "Copper",
    "Parts",
    "Other",
  ];
  const buyerCategoryMap = new Map<
    string,
    { count: number; totalAmount: number }
  >();
  for (const cat of buyerCategoryOrder) {
    buyerCategoryMap.set(cat, { count: 0, totalAmount: 0 });
  }

  const buyerProfileMap = new Map<
    string,
    {
      buyerId: string;
      buyerName: string;
      companyName: string | null;
      buyerTypes: Set<string>;
      totalPurchases: number;
      totalAmount: number;
      lastDate: string | null;
    }
  >();

  for (const car of filteredCars) {
    for (const rec of car.recoveries) {
      // Category aggregation
      const cat = resolveBuyerCategory(rec.mode, rec.itemType);
      const catStats = buyerCategoryMap.get(cat) || { count: 0, totalAmount: 0 };
      catStats.count += 1;
      catStats.totalAmount += rec.amount;
      buyerCategoryMap.set(cat, catStats);

      // Buyer profile aggregation
      if (rec.buyerId) {
        const curr = buyerProfileMap.get(rec.buyerId) || {
          buyerId: rec.buyerId,
          buyerName: rec.buyerName,
          companyName: rec.buyerCompany || null,
          buyerTypes: new Set<string>(),
          totalPurchases: 0,
          totalAmount: 0,
          lastDate: null,
        };

        curr.totalPurchases += 1;
        curr.totalAmount += rec.amount;
        if (rec.buyerTypes) {
          rec.buyerTypes.forEach((t) => curr.buyerTypes.add(t));
        }
        if (!curr.lastDate || rec.saleDate > curr.lastDate) {
          curr.lastDate = rec.saleDate;
        }

        buyerProfileMap.set(rec.buyerId, curr);
      }
    }
  }

  const buyerCategoryAnalytics: BuyerCategoryAnalyticsRow[] = buyerCategoryOrder.map(
    (cat) => {
      const stats = buyerCategoryMap.get(cat)!;
      return {
        category: cat,
        transactionCount: stats.count,
        totalAmount: stats.totalAmount,
        averageTransaction:
          stats.count > 0 ? Math.round(stats.totalAmount / stats.count) : 0,
      };
    },
  );

  const topBuyers: TopBuyerAnalyticsRow[] = Array.from(buyerProfileMap.values())
    .map((b) => ({
      buyerId: b.buyerId,
      buyerName: b.buyerName,
      companyName: b.companyName,
      buyerTypes: Array.from(b.buyerTypes),
      totalPurchases: b.totalPurchases,
      totalAmount: b.totalAmount,
      averageTransaction:
        b.totalPurchases > 0 ? Math.round(b.totalAmount / b.totalPurchases) : 0,
      lastPurchaseDate: b.lastDate,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  return {
    overview,
    brandAnalytics,
    conditionAnalytics,
    sourceAnalytics,
    buyerCategoryAnalytics,
    topBuyers,
    startDate,
    endDate,
  };
}
