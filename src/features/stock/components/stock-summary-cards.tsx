"use client";

import { CarFront, CircleDollarSign, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatTaka } from "@/lib/currency";
import type { StockSummary } from "../domain/stock-types";

type StockSummaryCardsProps = {
  summary: StockSummary;
};

export function StockSummaryCards({ summary }: StockSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card className="shadow-xs">
        <CardContent className="flex items-center gap-3.5 p-4 sm:p-5">
          <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
            <CarFront className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              Active Cars
            </p>
            <p className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">
              {summary.activeCarsCount}
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Non-completed inventory
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xs border-primary/20 bg-primary/2">
        <CardContent className="flex items-center gap-3.5 p-4 sm:p-5">
          <div className="bg-primary text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-xl shadow-xs">
            <CircleDollarSign className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              Stock Value
            </p>
            <p className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">
              {formatTaka(summary.stockValue)}
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Purchase + active car expenses
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xs">
        <CardContent className="flex items-center gap-3.5 p-4 sm:p-5">
          <div className="bg-emerald-500/10 text-emerald-600 flex size-11 shrink-0 items-center justify-center rounded-xl dark:bg-emerald-500/20 dark:text-emerald-400">
            <TrendingUp className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              Recovered from Active Stock
            </p>
            <p className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">
              {formatTaka(summary.recoveredFromActiveStock)}
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
