"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BadgeDollarSign,
  Briefcase,
  Building2,
  Calendar,
  CarFront,
  CheckCircle2,
  CircleDollarSign,
  Coins,
  DollarSign,
  FileText,
  Flame,
  Layers,
  PiggyBank,
  PlusCircle,
  Receipt,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import type { DashboardViewData } from "../domain/dashboard-types";
import { QuickExpenseDialog } from "./quick-expense-dialog";
import { QuickSellDialog } from "./quick-sell-dialog";
import { QuotationModal } from "@/features/quotations/components/quotation-modal";

type DashboardViewProps = {
  data: DashboardViewData;
};

export function DashboardView({ data }: DashboardViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Quick Action Dialogs State
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [quotationDialogOpen, setQuotationDialogOpen] = useState(false);

  const {
    overall,
    thisMonth,
    currentMonthLabel,
    lastRefreshedAt,
    activeCars,
    hasAnyData,
  } = data;

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 4.1 Header and Date Context */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Dashboard
            </h1>
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 text-primary flex items-center gap-1.5 px-3 py-1 text-xs font-semibold"
            >
              <Calendar className="size-3.5" />
              <span>{currentMonthLabel}</span>
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Operational and financial at-a-glance performance summary
          </p>
        </div>

        {/* Header Right: Live Refresh Status & Action */}
        <div className="flex items-center gap-3">
          <div
            className="text-muted-foreground flex items-center gap-1.5 text-xs"
            title="Refreshed in Dubai Time (GST - UTC+4)"
          >
            <span className="relative flex size-2">
              <span className="bg-emerald-400 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="bg-emerald-500 relative inline-flex size-2 rounded-full" />
            </span>
            <span>Refreshed: {lastRefreshedAt}</span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              Dubai
            </span>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isPending}
            title="Refresh dashboard data"
            aria-label="Refresh data"
            className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg border p-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`size-4 ${isPending ? "animate-spin text-primary" : ""}`} />
          </button>
        </div>
      </div>

      {/* 4.4 Quick Actions Bar */}
      <div className="bg-card/50 rounded-2xl border p-3 shadow-sm backdrop-blur-sm sm:p-4 space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
        <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider pl-1 block sm:inline">
          Quick Actions:
        </span>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3 w-full sm:w-auto">
          <Link
            href="/cars/new"
            className="bg-primary text-primary-foreground hover:brightness-110 flex items-center justify-center sm:justify-start gap-2 rounded-xl px-3 sm:px-4 py-2.5 text-xs font-semibold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            <PlusCircle className="size-4 shrink-0" />
            <span>+ Buy Car</span>
          </Link>

          <button
            type="button"
            onClick={() => setExpenseDialogOpen(true)}
            className="hover:bg-muted border-primary/20 hover:border-primary/40 flex items-center justify-center sm:justify-start gap-2 rounded-xl border bg-card px-3 sm:px-4 py-2.5 text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer"
          >
            <Receipt className="text-amber-500 size-4 shrink-0" />
            <span>+ Add Expense</span>
          </button>

          <button
            type="button"
            onClick={() => setSellDialogOpen(true)}
            className="hover:bg-muted border-emerald-500/20 hover:border-emerald-500/40 flex items-center justify-center sm:justify-start gap-2 rounded-xl border bg-card px-3 sm:px-4 py-2.5 text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer"
          >
            <Wrench className="text-emerald-500 size-4 shrink-0" />
            <span>+ Sell / Recovery</span>
          </button>

          <button
            type="button"
            onClick={() => setQuotationDialogOpen(true)}
            className="hover:bg-muted border-blue-500/20 hover:border-blue-500/40 flex items-center justify-center sm:justify-start gap-2 rounded-xl border bg-card px-3 sm:px-4 py-2.5 text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer"
          >
            <FileText className="text-blue-500 size-4 shrink-0" />
            <span>+ Create Quotation</span>
          </button>
        </div>
      </div>

      {/* 4.5 Empty / Onboarding State if no purchase data exists */}
      {!hasAnyData && (
        <div className="rounded-2xl border border-dashed border-primary/40 bg-gradient-to-br from-primary/5 via-card to-background p-8 text-center sm:p-12">
          <div className="bg-primary/10 text-primary mx-auto flex size-16 items-center justify-center rounded-2xl shadow-sm">
            <CarFront className="size-8" />
          </div>
          <h2 className="mt-4 text-xl font-bold">Welcome to Car Scrap Business Manager</h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-lg text-xs leading-relaxed sm:text-sm">
            No cars have been purchased yet. Start building your scrap yard inventory by recording your first vehicle acquisition.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/cars/new"
              className="bg-primary text-primary-foreground hover:brightness-110 flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold shadow-lg shadow-primary/25 transition-all cursor-pointer"
            >
              <PlusCircle className="size-4" />
              <span>Buy First Car</span>
            </Link>
          </div>
        </div>
      )}

      {/* 4.2 Overall KPI Cards Grid (11 Required Metrics) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Overall Business Lifetime KPIs
          </h2>
          <span className="text-muted-foreground text-xs">
            Read-only calculated summary &middot; Click any card to drill down
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* 1. Total Capital */}
          <KpiCard
            title="Total Capital"
            value={formatCurrency(overall.totalCapital)}
            detail="Opening capital + recorded capital injections"
            href="/finance"
            icon={Building2}
            badge="Lifetime"
          />

          {/* 2. Available Cash */}
          <KpiCard
            title="Available Cash"
            value={formatCurrency(overall.availableCash)}
            detail="Actual cash/bank balance (Stock value excluded)"
            href="/finance"
            icon={Wallet}
            badge="Liquid"
            highlight={overall.availableCash >= 0 ? "emerald" : "rose"}
          />

          {/* 3. Stock Cars */}
          <KpiCard
            title="Stock Cars"
            value={overall.stockCars.toString()}
            detail="Active vehicles not yet completed"
            href="/stock"
            icon={CarFront}
            badge="Inventory"
          />

          {/* 4. Stock Value */}
          <KpiCard
            title="Stock Value"
            value={formatCurrency(overall.stockValue)}
            detail="Purchase price + expenses on active stock"
            href="/stock"
            icon={Coins}
            badge="Asset Value"
          />

          {/* 5. Total Cars Bought */}
          <KpiCard
            title="Total Cars Bought"
            value={overall.totalCarsBought.toString()}
            detail="Total vehicle purchase records to date"
            href="/cars"
            icon={Layers}
            badge="Purchased"
          />

          {/* 6. Total Cars Completed */}
          <KpiCard
            title="Cars Sold / Completed"
            value={overall.totalCarsCompleted.toString()}
            detail="Vehicles with Completed status"
            href="/cars"
            icon={CheckCircle2}
            badge="Resolved"
          />

          {/* 7. Total Realized Recovery */}
          <KpiCard
            title="Total Realized Recovery"
            value={formatCurrency(overall.totalRealizedRecovery)}
            detail="All whole-car and item sale amounts"
            href="/sell"
            icon={Coins}
            badge="Recovered"
            highlight="emerald"
          />

          {/* 8. Total Car Expenses */}
          <KpiCard
            title="Total Car Expenses"
            value={formatCurrency(overall.totalCarExpenses)}
            detail="Accumulated vehicle-specific costs"
            href="/cars"
            icon={Wrench}
            badge="Car Costs"
          />

          {/* 9. Total Business Expenses */}
          <KpiCard
            title="Total Business Expenses"
            value={formatCurrency(overall.totalBusinessExpenses)}
            detail="General overheads, rent, utilities, tools"
            href="/expenses"
            icon={Briefcase}
            badge="Overheads"
          />

          {/* 10. Realized Car Profit */}
          <ProfitLossCard
            title="Realized Car Profit"
            amount={overall.realizedCarProfit}
            detail="Completed cars only: Recovery - Investment (Active excluded)"
            href="/reports/monthly"
          />

          {/* 11. Net Business Profit */}
          <ProfitLossCard
            title="Net Business Profit"
            amount={overall.netBusinessProfit}
            detail="Realized Car Profit minus Business Overheads"
            href="/reports/monthly"
            primary
          />
        </div>
      </div>

      {/* 4.3 This Month Panel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold sm:text-lg">
              This Month: {currentMonthLabel}
            </h2>
            <Badge variant="secondary" className="text-[10px] uppercase">
              Current Period
            </Badge>
          </div>

          <Link
            href="/reports/monthly"
            className="text-primary hover:underline flex items-center gap-1 text-xs font-semibold cursor-pointer"
          >
            <span>View Full Monthly Report</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="bg-card/70 rounded-2xl border p-5 shadow-sm backdrop-blur-sm sm:p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Operational Metrics */}
            <div className="space-y-3">
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                1. Operations
              </p>
              <div className="space-y-2.5">
                <MetricRow
                  label="Cars Bought"
                  value={`${thisMonth.carsBought} cars`}
                  subValue={formatCurrency(thisMonth.purchaseAmount)}
                />
                <MetricRow
                  label="Cars Completed"
                  value={`${thisMonth.carsCompleted} cars`}
                  subValue="Resolution in month"
                />
                <MetricRow
                  label="Closing Stock Cars"
                  value={`${thisMonth.closingStockCars} active`}
                  subValue={formatCurrency(thisMonth.closingStockValue)}
                />
              </div>
            </div>

            {/* Expenses & Cash Inflow */}
            <div className="space-y-3">
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                2. Cash & Expenses
              </p>
              <div className="space-y-2.5">
                <MetricRow
                  label="Car Expenses"
                  value={formatCurrency(thisMonth.carExpenses)}
                  subValue="Vehicle work & towing"
                />
                <MetricRow
                  label="Business Expenses"
                  value={formatCurrency(thisMonth.businessExpenses)}
                  subValue="Overhead & utilities"
                />
                <MetricRow
                  label="Total Recovery"
                  value={formatCurrency(thisMonth.totalRecovery)}
                  subValue="Sales during month"
                  valueClass="text-emerald-600 font-semibold"
                />
                <MetricRow
                  label="Closing Cash"
                  value={formatCurrency(thisMonth.closingCash)}
                  subValue="Actual cash at month-end"
                  valueClass="font-semibold text-primary"
                />
              </div>
            </div>

            {/* Profit & Loss Reconciled */}
            <div className="space-y-3 md:col-span-2 lg:col-span-1">
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                3. Financial Results
              </p>
              <div className="bg-muted/40 space-y-3 rounded-xl border p-4">
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Realized Car Profit:</span>
                    <span
                      className={`font-semibold ${
                        thisMonth.realizedCarProfit >= 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {thisMonth.realizedCarProfit < 0 ? "-" : ""}
                      {formatCurrency(Math.abs(thisMonth.realizedCarProfit))}
                    </span>
                  </div>
                  <p className="text-muted-foreground/70 text-[11px]">
                    Cars completed in {currentMonthLabel} only
                  </p>
                </div>

                <div className="border-t pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Business Overheads:</span>
                    <span className="font-semibold text-muted-foreground">
                      -{formatCurrency(thisMonth.businessExpenses)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-primary/20 pt-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Net Business Profit:</span>
                    <div className="text-right">
                      <span
                        className={`text-base font-extrabold ${
                          thisMonth.netBusinessProfit >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {thisMonth.netBusinessProfit < 0 ? "- " : "+ "}
                        {formatCurrency(Math.abs(thisMonth.netBusinessProfit))}
                      </span>
                      {thisMonth.netBusinessProfit < 0 && (
                        <p className="text-[10px] font-medium text-rose-500 uppercase tracking-wider">
                          Net Period Loss
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-muted-foreground/70 mt-1 text-[10px]">
                    Reconciles with Monthly Report for {currentMonthLabel}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog Modals */}
      <QuickExpenseDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        activeCars={activeCars}
      />

      <QuickSellDialog
        open={sellDialogOpen}
        onOpenChange={setSellDialogOpen}
        activeCars={activeCars}
      />

      <QuotationModal
        open={quotationDialogOpen}
        onOpenChange={setQuotationDialogOpen}
      />
    </div>
  );
}

/**
 * Standard KPI Card with drill-down link and hover styling
 */
function KpiCard({
  title,
  value,
  detail,
  href,
  icon: Icon,
  badge,
  highlight,
}: {
  title: string;
  value: string;
  detail: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  highlight?: "emerald" | "rose";
}) {
  return (
    <Link
      href={href}
      className="bg-card hover:border-primary/40 group relative flex flex-col justify-between rounded-2xl border p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
    >
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
              <Icon className="size-4" />
            </div>
            <span className="text-muted-foreground text-xs font-medium">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {badge && (
              <span className="bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 text-[10px] font-medium">
                {badge}
              </span>
            )}
            <ArrowUpRight className="text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 size-3.5 transition-transform" />
          </div>
        </div>

        <div className="mt-2.5">
          <p
            className={`text-lg font-bold tracking-tight sm:text-xl ${
              highlight === "emerald"
                ? "text-emerald-600 dark:text-emerald-400"
                : highlight === "rose"
                  ? "text-rose-600 dark:text-rose-400"
                  : ""
            }`}
          >
            {value}
          </p>
        </div>
      </div>

      <p className="text-muted-foreground/70 mt-2 text-[11px] leading-relaxed">
        {detail}
      </p>
    </Link>
  );
}

/**
 * Profit / Loss Card with strict compliance with 4.5:
 * "Negative profit/loss: display minus sign and loss label; never hide losses."
 */
function ProfitLossCard({
  title,
  amount,
  detail,
  href,
  primary = false,
}: {
  title: string;
  amount: number;
  detail: string;
  href: string;
  primary?: boolean;
}) {
  const isLoss = amount < 0;
  const isZero = amount === 0;

  return (
    <Link
      href={href}
      className={`group relative flex flex-col justify-between rounded-2xl border p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
        primary
          ? isLoss
            ? "border-rose-500/40 bg-gradient-to-br from-rose-500/10 via-card to-background"
            : "border-primary/40 bg-gradient-to-br from-primary/10 via-card to-background"
          : isLoss
            ? "border-rose-500/30 bg-rose-500/[0.03]"
            : "bg-card hover:border-primary/40"
      }`}
    >
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`flex size-8 items-center justify-center rounded-lg ${
                isLoss
                  ? "bg-rose-500/10 text-rose-500"
                  : isZero
                    ? "bg-muted text-muted-foreground"
                    : "bg-emerald-500/10 text-emerald-500"
              }`}
            >
              {isLoss ? (
                <TrendingDown className="size-4" />
              ) : (
                <TrendingUp className="size-4" />
              )}
            </div>
            <span className="text-muted-foreground text-xs font-medium">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                isLoss
                  ? "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                  : isZero
                    ? "bg-muted text-muted-foreground"
                    : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {isLoss ? "LOSS" : isZero ? "BREAK-EVEN" : "PROFIT"}
            </span>
            <ArrowUpRight className="text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 size-3.5 transition-transform" />
          </div>
        </div>

        <div className="mt-2.5">
          <p
            className={`text-lg font-extrabold tracking-tight sm:text-xl ${
              isLoss
                ? "text-rose-600 dark:text-rose-400"
                : isZero
                  ? "text-muted-foreground"
                  : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {isLoss ? `- ${formatCurrency(Math.abs(amount))}` : formatCurrency(amount)}
          </p>
        </div>
      </div>

      <p className="text-muted-foreground/70 mt-2 text-[11px] leading-relaxed">
        {detail}
      </p>
    </Link>
  );
}

function MetricRow({
  label,
  value,
  subValue,
  valueClass = "font-medium",
}: {
  label: string;
  value: string;
  subValue?: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-baseline justify-between border-b pb-1.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className={valueClass}>{value}</span>
        {subValue && (
          <span className="text-muted-foreground/70 ml-1.5 text-[11px]">
            ({subValue})
          </span>
        )}
      </div>
    </div>
  );
}
