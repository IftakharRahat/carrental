"use server";

import { revalidatePath } from "next/cache";

import { requireActor } from "@/lib/auth/actor";
import { isDatabaseConfigured } from "@/lib/config-state";
import { db } from "@/lib/db";
import { getMonthlyReportData } from "./monthly-report-service";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export async function saveMonthlySnapshotAction(
  year: number,
  month: number,
): Promise<ActionResult<{ id: string; generatedAt: string }>> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Database is not configured." };
  }

  const actor = await requireActor();
  if (actor.role === "VIEWER") {
    return {
      ok: false,
      message: "Viewers are not permitted to generate monthly snapshots.",
    };
  }

  try {
    const reportData = await getMonthlyReportData(year, month);
    const { metrics } = reportData;

    const existingSnapshot = await db.monthlySnapshot.findUnique({
      where: { year_month: { year, month } },
    });

    const snapshot = await db.monthlySnapshot.upsert({
      where: { year_month: { year, month } },
      update: {
        closingStockCars: metrics.closingStockCars,
        closingStockValue: metrics.closingStockValue,
        closingCash: metrics.closingCash,
        realizedCarProfit: metrics.realizedCarProfit,
        netBusinessProfit: metrics.netBusinessProfit,
        carsBought: metrics.carsBought,
        carsCompleted: metrics.carsCompleted,
        purchaseAmount: metrics.purchaseAmount,
        carExpenses: metrics.carExpenses,
        businessExpenses: metrics.businessExpenses,
        totalRecovery: metrics.totalRecovery,
        generatedById: actor.profileId,
        generatedAt: new Date(),
      },
      create: {
        year,
        month,
        closingStockCars: metrics.closingStockCars,
        closingStockValue: metrics.closingStockValue,
        closingCash: metrics.closingCash,
        realizedCarProfit: metrics.realizedCarProfit,
        netBusinessProfit: metrics.netBusinessProfit,
        carsBought: metrics.carsBought,
        carsCompleted: metrics.carsCompleted,
        purchaseAmount: metrics.purchaseAmount,
        carExpenses: metrics.carExpenses,
        businessExpenses: metrics.businessExpenses,
        totalRecovery: metrics.totalRecovery,
        generatedById: actor.profileId,
      },
    });

    // Write Audit Log
    await db.auditLog.create({
      data: {
        actorId: actor.profileId,
        action: existingSnapshot ? "UPDATE" : "CREATE",
        entityType: "MonthlySnapshot",
        entityId: snapshot.id,
        reason: existingSnapshot
          ? `Regenerated month-end snapshot for ${reportData.monthLabel}`
          : `Generated initial month-end snapshot for ${reportData.monthLabel}`,
        before: existingSnapshot ? JSON.parse(JSON.stringify(existingSnapshot)) : undefined,
        after: JSON.parse(JSON.stringify(snapshot)),
      },
    });

    revalidatePath("/reports/monthly");

    return {
      ok: true,
      data: {
        id: snapshot.id,
        generatedAt: snapshot.generatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Failed to save monthly snapshot:", error);
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to save monthly snapshot.",
    };
  }
}
