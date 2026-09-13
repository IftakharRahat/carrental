"use client";

import {
  CalendarDays,
  CarFront,
  CircleDollarSign,
  Receipt,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatAed } from "@/lib/currency";
import type { StockSummary } from "../domain/stock-types";

type StockSummaryCardsProps = {
  summary: StockSummary;
  variant?: "all-cars" | "stock";
};

export function StockSummaryCards({
  summary,
  variant = "stock",
}: StockSummaryCardsProps) {
  if (variant === "all-cars") {
    const isProfitable = summary.avgNetProfit >= 0;

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* 1. Average Car Buy Price */}
        <Card className="border bg-card shadow-2xs hover:border-primary/30 transition-colors">
          <CardContent className="p-3 sm:p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase truncate">
                Avg Buy Price
              </span>
              <div className="bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex size-7 shrink-0 items-center justify-center rounded-lg">
                <ShoppingCart className="size-3.5" />
              </div>
            </div>
            <p className="text-foreground mt-1 text-base sm:text-lg lg:text-xl font-bold tracking-tight whitespace-nowrap leading-none">
              {formatAed(summary.avgCarBuyPrice)}
            </p>
            <p className="text-muted-foreground mt-1.5 text-[11px] truncate leading-none">
              Capital per acquired car
            </p>
          </CardContent>
        </Card>

        {/* 2. Average Car Expenses */}
        <Card className="border bg-card shadow-2xs hover:border-primary/30 transition-colors">
          <CardContent className="p-3 sm:p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase truncate">
                Avg Expenses
              </span>
              <div className="bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 flex size-7 shrink-0 items-center justify-center rounded-lg">
                <Receipt className="size-3.5" />
              </div>
            </div>
            <p className="text-foreground mt-1 text-base sm:text-lg lg:text-xl font-bold tracking-tight whitespace-nowrap leading-none">
              {formatAed(summary.avgCarExpenses)}
            </p>
            <p className="text-muted-foreground mt-1.5 text-[11px] truncate leading-none">
              Parts & repairs per car
            </p>
          </CardContent>
        </Card>

        {/* 3. Average Days to Complete */}
        <Card className="border bg-card shadow-2xs hover:border-primary/30 transition-colors">
          <CardContent className="p-3 sm:p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase truncate">
                Days to Complete
              </span>
              <div className="bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex size-7 shrink-0 items-center justify-center rounded-lg">
                <CalendarDays className="size-3.5" />
              </div>
            </div>
            <p className="text-foreground mt-1 text-base sm:text-lg lg:text-xl font-bold tracking-tight whitespace-nowrap leading-none">
              {summary.avgDaysToComplete} Days
            </p>
            <p className="text-muted-foreground mt-1.5 text-[11px] truncate leading-none">
              {summary.completedCarsCount
                ? `Across ${summary.completedCarsCount} completed`
                : "Turnaround cycle"}
            </p>
          </CardContent>
        </Card>

        {/* 4. Average Net Profit */}
        <Card className="border bg-card shadow-2xs hover:border-primary/30 transition-colors">
          <CardContent className="p-3 sm:p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase truncate">
                Avg Net Profit
              </span>
              <div
                className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${
                  isProfitable
                    ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400"
                }`}
              >
                <TrendingUp className="size-3.5" />
              </div>
            </div>
            <p
              className={`mt-1 text-base sm:text-lg lg:text-xl font-bold tracking-tight whitespace-nowrap leading-none ${
                isProfitable
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {formatAed(summary.avgNetProfit)}
            </p>
            <p className="text-muted-foreground mt-1.5 text-[11px] truncate leading-none">
              {summary.completedCarsCount
                ? "Profit per completed car"
                : "Net recovery balance"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Stock page default: 3 cards
  return (
    <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-3">
      <Card className="border bg-card shadow-2xs hover:border-primary/30 transition-colors">
        <CardContent className="p-3 sm:p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase truncate">
              Active Cars
            </span>
            <div className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-lg">
              <CarFront className="size-3.5" />
            </div>
          </div>
          <p className="text-foreground mt-1 text-base sm:text-lg lg:text-xl font-bold tracking-tight whitespace-nowrap leading-none">
            {summary.activeCarsCount}
          </p>
          <p className="text-muted-foreground mt-1.5 text-[11px] truncate leading-none">
            Non-completed inventory
          </p>
        </CardContent>
      </Card>

      <Card className="border border-primary/20 bg-primary/2 shadow-2xs hover:border-primary/40 transition-colors">
        <CardContent className="p-3 sm:p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase truncate">
              Stock Value
            </span>
            <div className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-lg shadow-2xs">
              <CircleDollarSign className="size-3.5" />
            </div>
          </div>
          <p className="text-foreground mt-1 text-base sm:text-lg lg:text-xl font-bold tracking-tight whitespace-nowrap leading-none">
            {formatAed(summary.stockValue)}
          </p>
          <p className="text-muted-foreground mt-1.5 text-[11px] truncate leading-none">
            Purchase + active expenses
          </p>
        </CardContent>
      </Card>

      <Card className="border bg-card shadow-2xs hover:border-primary/30 transition-colors">
        <CardContent className="p-3 sm:p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase truncate">
              Recovered from Stock
            </span>
            <div className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex size-7 shrink-0 items-center justify-center rounded-lg">
              <TrendingUp className="size-3.5" />
            </div>
          </div>
          <p className="text-foreground mt-1 text-base sm:text-lg lg:text-xl font-bold tracking-tight whitespace-nowrap leading-none">
            {formatAed(summary.recoveredFromActiveStock)}
          </p>
          <p className="text-muted-foreground mt-1.5 text-[11px] truncate leading-none">
            Realized from active inventory
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
