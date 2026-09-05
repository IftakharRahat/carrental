import "server-only";

import { isDatabaseConfigured } from "@/lib/config-state";
import { db } from "@/lib/db";
import type { StockCarCondition } from "../domain/stock-types";

export type StockReferenceData = {
  brands: string[];
};

export const conditionLabels: Record<StockCarCondition, string> = {
  SCRAP: "Scrap",
  ACCIDENT_DAMAGED: "Accident / Damaged",
  ENGINE_ISSUE: "Engine Issue",
  GEARBOX_ISSUE: "Gearbox Issue",
  OTHER: "Other",
};

export async function getStockReferenceData(): Promise<StockReferenceData> {
  if (!isDatabaseConfigured()) {
    return { brands: [] };
  }

  const distinctBrands = await db.car.findMany({
    where: { status: { not: "VOIDED" } },
    distinct: ["brand"],
    select: { brand: true },
    orderBy: { brand: "asc" },
  });

  return {
    brands: distinctBrands.map((b) => b.brand),
  };
}
