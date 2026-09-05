import "server-only";

import { isDatabaseConfigured } from "@/lib/config-state";
import { db } from "@/lib/db";

export type StockReferenceData = {
  brands: string[];
};

export { conditionLabels } from "../domain/stock-types";

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
