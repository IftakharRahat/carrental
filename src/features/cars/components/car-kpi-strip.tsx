"use client";

import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Layers,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatAed } from "@/lib/currency";
import type { CarKpis } from "../domain/car-details-types";

type CarKpiStripProps = {
  kpis: CarKpis;
};

export function CarKpiStrip({ kpis }: CarKpiStripProps) {
  return (
    <div className="space-y-3">
      {/* 5 KPI Cards in responsive grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {/* 1. Purchase */}
        <Card className="shadow-xs">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
                Purchase
              </p>
              <div className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-lg">
                <Wallet className="size-3.5" />
              </div>
            </div>
            <p className="text-foreground mt-2 text-lg sm:text-xl font-bold tracking-tight">
              {formatAed(kpis.purchase)}
            </p>
            <p className="text-muted-foreground mt-0.5 text-[11px]">
              Initial car acquisition
            </p>
          </CardContent>
        </Card>

        {/* 2. Expenses */}
        <Card className="shadow-xs">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
                Expenses
              </p>
              <div className="bg-muted text-muted-foreground flex size-7 items-center justify-center rounded-lg">
                <Receipt className="size-3.5" />
              </div>
            </div>
            <p className="text-foreground mt-2 text-lg sm:text-xl font-bold tracking-tight">
              {formatAed(kpis.expenses)}
            </p>
            <p className="text-muted-foreground mt-0.5 text-[11px]">
              Parts, labour & transport
            </p>
          </CardContent>
        </Card>

        {/* 3. Investment */}
        <Card className="border-primary/20 bg-primary/2 shadow-xs">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
                Investment
              </p>
              <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg shadow-xs">
                <Layers className="size-3.5" />
              </div>
            </div>
            <p className="text-foreground mt-2 text-lg sm:text-xl font-bold tracking-tight">
              {formatAed(kpis.investment)}
            </p>
            <p className="text-muted-foreground mt-0.5 text-[11px]">
              Purchase + Expenses
            </p>
          </CardContent>
        </Card>

        {/* 4. Recovery */}
        <Card className="shadow-xs">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
                Recovery
              </p>
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <TrendingUp className="size-3.5" />
              </div>
            </div>
            <p className="text-foreground mt-2 text-lg sm:text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatAed(kpis.recovery)}
            </p>
            <p className="text-muted-foreground mt-0.5 text-[11px]">
              Whole car + part sales
            </p>
          </CardContent>
        </Card>

        {/* 5. Realized Car Profit (Section 7.2 Accounting Rule) */}
        <Card className="col-span-2 sm:col-span-1 shadow-xs">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
                Realized Profit
              </p>
              <div
                className={`flex size-7 items-center justify-center rounded-lg ${
                  kpis.isProfitPending
                    ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                    : (kpis.realizedProfit ?? 0) >= 0
                      ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                      : "bg-destructive/10 text-destructive"
                }`}
              >
                {kpis.isProfitPending ? (
                  <Clock className="size-3.5" />
                ) : (kpis.realizedProfit ?? 0) >= 0 ? (
                  <ArrowUpRight className="size-3.5" />
                ) : (
                  <ArrowDownRight className="size-3.5" />
                )}
              </div>
            </div>

            {kpis.isProfitPending ? (
              <div className="mt-2">
                <Badge
                  variant="outline"
                  className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold px-2 py-0.5"
                  data-testid="realized-profit-pending-badge"
                >
                  Pending
                </Badge>
                <p className="text-muted-foreground mt-1 text-[11px]">
                  Realized when completed
                </p>
              </div>
            ) : (
              <div>
                <p
                  className={`mt-2 text-lg sm:text-xl font-bold tracking-tight ${
                    (kpis.realizedProfit ?? 0) >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-destructive"
                  }`}
                  data-testid="realized-profit-value"
                >
                  {formatAed(kpis.realizedProfit)}
                </p>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  Closed car net result
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Helper note for pending profit according to Spec 7.2 */}
      {kpis.isProfitPending && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Accounting note:</strong> Realized Car Profit stays Pending until the vehicle inventory cycle is Completed. Recovery and Investment remain visible separately.
          </span>
        </div>
      )}
    </div>
  );
}
