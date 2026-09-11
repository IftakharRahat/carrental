import "server-only";

import {
  formatCarNumber,
  parseCarNumber,
} from "@/features/cars/domain/car-number";
import { isDatabaseConfigured } from "@/lib/config-state";
import { db } from "@/lib/db";
import {
  calculateDaysInStock,
  calculateStockSummary,
} from "../domain/stock-calculations";
import type {
  StockCarCondition,
  StockCarItem,
  StockCarStatus,
  StockFilterCriteria,
} from "../domain/stock-types";
import type { StockQueryResult, StockRepository } from "./stock-repository";

export class PrismaStockRepository implements StockRepository {
  async getStock(
    criteria: StockFilterCriteria = {},
  ): Promise<StockQueryResult> {
    if (!isDatabaseConfigured()) {
      return {
        items: [],
        summary: {
          activeCarsCount: 0,
          stockValue: 0,
          recoveredFromActiveStock: 0,
          avgCarBuyPrice: 0,
          avgCarExpenses: 0,
          avgDaysToComplete: 0,
          avgNetProfit: 0,
        },
      };
    }

    // Determine status filter
    const statusFilter = criteria.status
      ? [criteria.status as StockCarStatus]
      : criteria.includeCompleted
        ? (["IN_STOCK", "PARTIALLY_RECOVERED", "COMPLETED"] as StockCarStatus[])
        : (["IN_STOCK", "PARTIALLY_RECOVERED"] as StockCarStatus[]);

    const parsedCarNum = criteria.search
      ? parseCarNumber(criteria.search)
      : null;

    const whereClause: Record<string, unknown> = {
      status: { in: statusFilter },
    };

    if (criteria.condition) {
      whereClause.condition = criteria.condition;
    }

    if (criteria.brand) {
      whereClause.brand = { equals: criteria.brand, mode: "insensitive" };
    }

    if (criteria.purchaseDateFrom || criteria.purchaseDateTo) {
      const dateFilter: Record<string, Date> = {};
      if (criteria.purchaseDateFrom) {
        dateFilter.gte = new Date(`${criteria.purchaseDateFrom}T00:00:00.000Z`);
      }
      if (criteria.purchaseDateTo) {
        dateFilter.lte = new Date(`${criteria.purchaseDateTo}T23:59:59.999Z`);
      }
      whereClause.purchaseDate = dateFilter;
    }

    if (criteria.search) {
      const searchTerms = [
        { brand: { contains: criteria.search, mode: "insensitive" } },
        { model: { contains: criteria.search, mode: "insensitive" } },
        { vinChassis: { contains: criteria.search, mode: "insensitive" } },
      ];

      if (parsedCarNum) {
        searchTerms.push({ carNumber: parsedCarNum } as never);
      }

      whereClause.OR = searchTerms;
    }

    const cars = await db.car.findMany({
      where: whereClause,
      orderBy: [{ purchaseDate: "desc" }, { carNumber: "desc" }],
      include: {
        expenses: {
          where: { status: "ACTIVE" },
          select: { amount: true },
        },
        recoveries: {
          where: { status: "ACTIVE" },
          select: { amount: true },
        },
        recoveryItems: {
          select: { id: true, status: true },
        },
      },
    });

    const now = new Date();

    const items: StockCarItem[] = cars
      .map((car) => {
        const purchasePrice = Number(car.purchasePrice);
        const totalExpenses = car.expenses.reduce(
          (sum, exp) => sum + Number(exp.amount),
          0,
        );
        const totalInvestment = purchasePrice + totalExpenses;
        const recovery = car.recoveries.reduce(
          (sum, rec) => sum + Number(rec.amount),
          0,
        );

        const totalItems = car.recoveryItems.length;
        const pendingItemsCount =
          totalItems === 0
            ? null
            : car.recoveryItems.filter((item) => item.status === "PENDING")
                .length;
        const totalItemsCount = totalItems === 0 ? null : totalItems;

        const purchaseDateStr = car.purchaseDate.toISOString().split("T")[0];
        const completionDateStr = car.completionDate
          ? car.completionDate.toISOString().split("T")[0]
          : null;

        const daysInStock = calculateDaysInStock(
          car.purchaseDate,
          car.completionDate,
          now,
        );

        return {
          id: car.id,
          carNumber: formatCarNumber(car.carNumber),
          rawCarNumber: car.carNumber,
          brand: car.brand,
          model: car.model,
          year: car.year,
          condition: car.condition as StockCarCondition,
          conditionOther: car.conditionOther,
          status: car.status as StockCarStatus,
          purchaseDate: purchaseDateStr,
          completionDate: completionDateStr,
          purchasePrice,
          totalExpenses,
          totalInvestment,
          recovery,
          pendingItemsCount,
          totalItemsCount,
          mainPhotoUrl: car.mainPhotoUrl,
          daysInStock,
          vinChassis: car.vinChassis,
          notes: car.notes,
        };
      })
      .filter((item) => {
        if (
          criteria.daysInStockMin !== undefined &&
          item.daysInStock < criteria.daysInStockMin
        ) {
          return false;
        }
        if (
          criteria.daysInStockMax !== undefined &&
          item.daysInStock > criteria.daysInStockMax
        ) {
          return false;
        }
        return true;
      });

    // Compute summary metrics (Active cars, Stock value, Recovered from active stock)
    const summary = calculateStockSummary(items);

    return {
      items,
      summary,
    };
  }
}
