import type { Metadata } from "next";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StockView } from "@/features/stock/components/stock-view";
import { PrismaStockRepository } from "@/features/stock/repositories/prisma-stock-repository";
import { getStockReferenceData } from "@/features/stock/server/stock-reference-service";

export const metadata: Metadata = {
  title: "Stock & Cars",
  description: "Operational view of all currently active vehicles.",
};

const repository = new PrismaStockRepository();

export default async function StockPage() {
  const [stockData, refData] = await Promise.all([
    repository.getStock({ includeCompleted: true }),
    getStockReferenceData(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header with Title and Primary Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Stock
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Operational view of all currently active vehicles.
          </p>
        </div>
        <div>
          <Button
            nativeButton={false}
            render={<Link href="/cars/new" />}
            size="sm"
            className="shadow-xs gap-1.5"
          >
            <PlusCircle className="size-4" />
            Buy Car
          </Button>
        </div>
      </div>

      {/* Interactive Stock View (Summary Cards, Filters, and Table) */}
      <StockView
        initialItems={stockData.items}
        initialSummary={stockData.summary}
        brands={refData.brands}
      />
    </div>
  );
}
