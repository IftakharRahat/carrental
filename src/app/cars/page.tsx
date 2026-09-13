import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StockView } from "@/features/stock/components/stock-view";
import { PrismaStockRepository } from "@/features/stock/repositories/prisma-stock-repository";
import { getStockReferenceData } from "@/features/stock/server/stock-reference-service";
import StockLoading from "../stock/loading";

export const metadata: Metadata = {
  title: "All Cars | Car Scrap Business",
  description: "Complete vehicle directory across active, dismantled, and completed lifecycle stages.",
};

const repository = new PrismaStockRepository();

export default async function AllCarsPage() {
  const [stockData, refData] = await Promise.all([
    repository.getStock({ includeCompleted: true }),
    getStockReferenceData(),
  ]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header with Title and Primary Action */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            All Cars
          </h1>
          <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">
            Complete vehicle directory across active, dismantled, and completed lifecycle stages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            nativeButton={false}
            render={<Link href="/cars/new" />}
            className="gap-2 font-medium shadow-sm"
            data-testid="buy-car-header-btn"
          >
            <PlusCircle className="size-4" />
            Buy Car
          </Button>
        </div>
      </div>

      {/* Interactive Cars View */}
      <Suspense fallback={<StockLoading />}>
        <StockView
          initialItems={stockData.items}
          initialSummary={stockData.summary}
          brands={refData.brands}
          defaultIncludeCompleted={true}
        />
      </Suspense>
    </div>
  );
}
