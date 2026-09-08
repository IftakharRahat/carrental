import "server-only";

import { db } from "@/lib/db";
import {
  calculateBusinessAnalytics,
  getAnalyticsPresetRange,
  type RawCarForAnalytics,
  type RawCommissionForAnalytics,
} from "../domain/analytics-calculations";
import type {
  AnalyticsDatePreset,
  BusinessAnalyticsData,
} from "../domain/analytics-types";

export async function getBusinessAnalyticsPageData(params?: {
  preset?: AnalyticsDatePreset;
  customStart?: string;
  customEnd?: string;
}): Promise<BusinessAnalyticsData> {
  const preset = params?.preset || "ALL_TIME";
  let startDate: string | null = null;
  let endDate: string | null = null;

  if (preset === "CUSTOM") {
    startDate = params?.customStart || null;
    endDate = params?.customEnd || null;
  } else {
    const range = getAnalyticsPresetRange(preset);
    startDate = range.startDate;
    endDate = range.endDate;
  }

  // Concurrently query cars, recoveries with buyers, expenses, commissions
  const [rawCars, rawCommissions] = await Promise.all([
    db.car.findMany({
      where: { status: { not: "VOIDED" } },
      include: {
        source: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        expenses: {
          where: { status: "ACTIVE" },
          select: {
            amount: true,
            expenseDate: true,
          },
        },
        recoveries: {
          where: { status: "ACTIVE" },
          include: {
            buyer: {
              select: {
                id: true,
                name: true,
                companyName: true,
                buyerTypes: {
                  select: {
                    buyerType: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { carNumber: "desc" },
    }),
    db.cashTransaction.findMany({
      where: {
        status: "ACTIVE",
        category: "COMMISSION",
      },
      select: {
        carId: true,
        amount: true,
      },
    }),
  ]);

  const cars: RawCarForAnalytics[] = rawCars.map((c) => ({
    id: c.id,
    carNumber: c.carNumber,
    brand: c.brand,
    model: c.model,
    condition: c.condition,
    purchasePrice: Number(c.purchasePrice),
    purchaseDate: c.purchaseDate.toISOString().slice(0, 10),
    status: c.status,
    completionDate: c.completionDate
      ? c.completionDate.toISOString().slice(0, 10)
      : null,
    sourceId: c.source?.id || null,
    sourceName: c.source?.name || null,
    sourceType: c.source?.type || null,
    expenses: c.expenses.map((e) => ({
      amount: Number(e.amount),
      expenseDate: e.expenseDate.toISOString().slice(0, 10),
    })),
    recoveries: c.recoveries.map((r) => ({
      id: r.id,
      buyerId: r.buyerId,
      buyerName: r.buyer.name,
      buyerCompany: r.buyer.companyName,
      buyerTypes: r.buyer.buyerTypes.map((bt) => bt.buyerType.name),
      mode: r.mode,
      itemType: r.itemType,
      amount: Number(r.amount),
      saleDate: r.saleDate.toISOString().slice(0, 10),
    })),
  }));

  const commissions: RawCommissionForAnalytics[] = rawCommissions.map((comm) => ({
    carId: comm.carId,
    amount: Number(comm.amount),
  }));

  return calculateBusinessAnalytics({
    cars,
    commissions,
    startDate,
    endDate,
  });
}
