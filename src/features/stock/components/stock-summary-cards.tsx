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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Average Car Buy Price */}
        <Card className="shadow-xs border">
          <CardContent className="flex items-center gap-3.5 p-4 sm:p-5">
            <div className="bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex size-11 shrink-0 items-center justify-center rounded-xl">
              <ShoppingCart className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Average Car Buy Price
              </p>
              <p className="text-foreground mt-0.5 text-2xl font-bold tracking-tight">
                {formatAed(summary.avgCarBuyPrice)}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs truncate">
                Average capital per acquired car
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 2. Average Car Expenses */}
        <Card className="shadow-xs border">
          <CardContent className="flex items-center gap-3.5 p-4 sm:p-5">
            <div className="bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 flex size-11 shrink-0 items-center justify-center rounded-xl">
              <Receipt className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Average Car Expenses
              </p>
              <p className="text-foreground mt-0.5 text-2xl font-bold tracking-tight">
                {formatAed(summary.avgCarExpenses)}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs truncate">
                Repairs, parts & logistics per car
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 3. Average Days to Complete */}
        <Card className="shadow-xs border">
          <CardContent className="flex items-center gap-3.5 p-4 sm:p-5">
            <div className="bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex size-11 shrink-0 items-center justify-center rounded-xl">
              <CalendarDays className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Average Days to Complete
              </p>
              <p className="text-foreground mt-0.5 text-2xl font-bold tracking-tight">
                {summary.avgDaysToComplete} Days
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs truncate">
                {summary.completedCarsCount
                  ? `Across ${summary.completedCarsCount} completed cars`
                  : "Turnaround lifecycle"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 4. Average Net Profit */}
        <Card className="shadow-xs border">
          <CardContent className="flex items-center gap-3.5 p-4 sm:p-5">
            <div
              className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
                isProfitable
                  ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400"
              }`}
            >
              <TrendingUp className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Average Net Profit
              </p>
              <p
                className={`mt-0.5 text-2xl font-bold tracking-tight ${
                  isProfitable
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {formatAed(summary.avgNetProfit)}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs truncate">
                {summary.completedCarsCount
                  ? "Realized profit per completed car"
                  : "Net recovery vs investment"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Stock page default: 3 cards
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card className="shadow-xs">
        <CardContent className="flex items-center gap-3.5 p-4 sm:p-5">
          <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
            <CarFront className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Active Cars
            </p>
            <p className="text-foreground mt-0.5 text-2xl font-bold tracking-tight">
              {summary.activeCarsCount}
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Non-completed inventory
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/2 shadow-xs">
        <CardContent className="flex items-center gap-3.5 p-4 sm:p-5">
          <div className="bg-primary text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-xl shadow-xs">
            <CircleDollarSign className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Stock Value
            </p>
            <p className="text-foreground mt-0.5 text-2xl font-bold tracking-tight">
              {formatAed(summary.stockValue)}
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Purchase + active car expenses
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xs">
        <CardContent className="flex items-center gap-3.5 p-4 sm:p-5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            <TrendingUp className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Recovered from Active Stock
            </p>
            <p className="text-foreground mt-0.5 text-2xl font-bold tracking-tight">
              {formatAed(summary.recoveredFromActiveStock)}
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Realized from active inventory
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
