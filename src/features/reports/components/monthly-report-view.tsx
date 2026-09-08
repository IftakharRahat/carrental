"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BookmarkCheck,
  Calendar,
  Car,
  CheckCircle2,
  Download,
  Package,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatAed } from "@/lib/currency";
import type { MonthlyReportViewData } from "../domain/monthly-report-types";
import { saveMonthlySnapshotAction } from "../server/monthly-report-actions";

type MonthlyReportViewProps = {
  data: MonthlyReportViewData;
};

export function MonthlyReportView({ data }: MonthlyReportViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"COMPLETED" | "PURCHASES" | "EXPENSES">(
    "COMPLETED",
  );

  const {
    year,
    month,
    monthLabel,
    metrics,
    snapshot,
    completedCars,
    purchasedCars,
    expenseBreakdown,
    availableMonths,
  } = data;

  const handleMonthChange = (val: string) => {
    const [y, m] = val.split("-").map(Number);
    router.push(`/reports/monthly?year=${y}&month=${m}`);
  };

  const handleSaveSnapshot = () => {
    startTransition(async () => {
      const res = await saveMonthlySnapshotAction(year, month);
      if (res.ok) {
        toast.success(
          snapshot?.isPreserved
            ? `Snapshot regenerated for ${monthLabel}.`
            : `Month-end snapshot saved for ${monthLabel}.`,
        );
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleExportCsv = () => {
    const lines: string[] = [];
    lines.push(`MONTHLY REPORT - ${monthLabel.toUpperCase()}`);
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push("");

    lines.push("--- SECTION 15.1 MONTHLY METRICS ---");
    lines.push(`Cars Bought,${metrics.carsBought}`);
    lines.push(`Cars Sold / Completed,${metrics.carsCompleted}`);
    lines.push(`Purchase Amount (AED),${metrics.purchaseAmount}`);
    lines.push(`Car Expenses (AED),${metrics.carExpenses}`);
    lines.push(`Business Expenses (AED),${metrics.businessExpenses}`);
    lines.push(`Total Recovery (AED),${metrics.totalRecovery}`);
    lines.push(`Realized Car Profit (AED),${metrics.realizedCarProfit}`);
    lines.push(`Net Business Profit (AED),${metrics.netBusinessProfit}`);
    lines.push(`Closing Stock Cars,${metrics.closingStockCars}`);
    lines.push(`Closing Stock Value (AED),${metrics.closingStockValue}`);
    lines.push(`Closing Cash (AED),${metrics.closingCash}`);
    lines.push("");

    lines.push("--- COMPLETED CARS IN MONTH ---");
    lines.push("Car Number,Brand,Model,Purchase Date,Completion Date,Days In Stock,Investment (AED),Recovery (AED),Realized Profit (AED)");
    for (const c of completedCars) {
      lines.push(
        `CAR-${c.carNumber},"${c.brand}","${c.model}",${c.purchaseDate},${c.completionDate},${c.daysInStock},${c.totalInvestment},${c.totalRecovery},${c.realizedProfit}`,
      );
    }
    lines.push("");

    lines.push("--- CARS PURCHASED IN MONTH ---");
    lines.push("Car Number,Brand,Model,Purchase Date,Seller,Source,Purchase Price (AED),Payment Method");
    for (const p of purchasedCars) {
      lines.push(
        `CAR-${p.carNumber},"${p.brand}","${p.model}",${p.purchaseDate},"${p.sellerName}","${p.sourceName || "N/A"}",${p.purchasePrice},${p.paymentMethod}`,
      );
    }
    lines.push("");

    lines.push("--- MONTHLY EXPENSES BREAKDOWN ---");
    lines.push("Category,Type,Transactions Count,Total Amount (AED)");
    for (const e of expenseBreakdown) {
      lines.push(`"${e.category}",${e.type},${e.count},${e.amount}`);
    }

    const csvContent = lines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `monthly-report-${year}-${String(month).padStart(2, "0")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Monthly report exported to CSV.");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Monthly Report</h1>
            <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5">
              Section 15
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            View each month separately and preserve month-end business snapshots (Section 15).
          </p>
        </div>

        {/* Month Selector, Snapshot & Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="size-4 text-muted-foreground" />
            <select
              value={`${year}-${month}`}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              data-testid="month-year-selector"
            >
              {availableMonths.map((m) => (
                <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant={snapshot?.isPreserved ? "outline" : "default"}
            size="sm"
            onClick={handleSaveSnapshot}
            disabled={isPending}
            className="gap-1.5 shadow-xs"
            data-testid="save-snapshot-btn"
          >
            {isPending ? (
              <RefreshCw className="size-3.5 animate-spin" />
            ) : snapshot?.isPreserved ? (
              <RefreshCw className="size-3.5" />
            ) : (
              <BookmarkCheck className="size-3.5" />
            )}
            {snapshot?.isPreserved ? "Regenerate Snapshot" : "Save Month-End Snapshot"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="gap-1.5 shadow-xs"
            data-testid="export-monthly-csv-btn"
          >
            <Download className="size-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Snapshot Preservation Banner */}
      {snapshot?.isPreserved ? (
        <Card className={`border shadow-xs ${snapshot.hasDrift ? "border-amber-400 bg-amber-500/10" : "border-emerald-400 bg-emerald-500/10"}`}>
          <CardContent className="py-3 px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              {snapshot.hasDrift ? (
                <AlertTriangle className="size-4 text-amber-600 shrink-0" />
              ) : (
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              )}
              <div>
                <span className="font-semibold text-foreground">
                  {snapshot.hasDrift
                    ? "Snapshot Drift Detected"
                    : "Preserved Month-End Snapshot"}
                </span>
                <span className="text-muted-foreground ml-1.5">
                  (Snapshot preserved on{" "}
                  {snapshot.generatedAt
                    ? new Date(snapshot.generatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "record"}
                  )
                </span>
                {snapshot.hasDrift && (
                  <p className="text-amber-800 dark:text-amber-300 mt-0.5">
                    Source transactions have been modified since this snapshot was saved. You can regenerate the snapshot to sync historical records.
                  </p>
                )}
              </div>
            </div>

            <Badge
              variant={snapshot.hasDrift ? "outline" : "secondary"}
              className={snapshot.hasDrift ? "border-amber-400 text-amber-700" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"}
            >
              {snapshot.hasDrift ? "Modified Since Save" : "Snapshot Preserved"}
            </Badge>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-2.5 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="size-3.5 text-muted-foreground" />
            Showing <strong>Live Derived</strong> figures for {monthLabel}. Click &quot;Save Month-End Snapshot&quot; to preserve historical figures.
          </span>
          <Badge variant="outline" className="text-[10px]">
            Live Derived
          </Badge>
        </div>
      )}

      {/* Section 15.2 Month-End Snapshot Callout Cards */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Section 15.2 Month-End Closing References
          </h2>
          <span className="text-[11px] text-muted-foreground italic">
            Carried as opening references into next month
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Closing Stock Cars */}
          <Card className="border-border/80 shadow-xs" data-testid="kpi-closing-stock-cars">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Closing Stock Cars
              </CardTitle>
              <div className="rounded-md bg-blue-500/10 p-1.5 text-blue-600 dark:text-blue-400">
                <Car className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">
                {metrics.closingStockCars} <span className="text-sm font-normal text-muted-foreground">cars</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Active non-completed inventory as of month end
              </p>
            </CardContent>
          </Card>

          {/* Closing Stock Value */}
          <Card className="border-border/80 shadow-xs" data-testid="kpi-closing-stock-value">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Closing Stock Value
              </CardTitle>
              <div className="rounded-md bg-indigo-500/10 p-1.5 text-indigo-600 dark:text-indigo-400">
                <Package className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-indigo-700 dark:text-indigo-400">
                {formatAed(metrics.closingStockValue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Purchase Price + active car expenses as of month end
              </p>
            </CardContent>
          </Card>

          {/* Closing Cash */}
          <Card className="border-border/80 shadow-xs" data-testid="kpi-closing-cash">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Closing Available Cash
              </CardTitle>
              <div className="rounded-md bg-emerald-500/10 p-1.5 text-emerald-600 dark:text-emerald-400">
                <Wallet className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
                {formatAed(metrics.closingCash)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Actual cash/bank balance (stock value excluded)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section 15.1 Monthly Metrics Grid */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Section 15.1 Monthly Operational &amp; Financial Metrics
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Cars Bought */}
          <Card className="border-border/70 shadow-2xs" data-testid="kpi-cars-bought">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase">
                Cars Bought
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-xl font-bold">{metrics.carsBought} cars</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Purchase: {formatAed(metrics.purchaseAmount)}
              </div>
            </CardContent>
          </Card>

          {/* Cars Sold / Completed */}
          <Card className="border-border/70 shadow-2xs" data-testid="kpi-cars-completed">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase">
                Cars Sold / Completed
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-xl font-bold">{metrics.carsCompleted} completed</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Total Recovery: {formatAed(metrics.totalRecovery)}
              </div>
            </CardContent>
          </Card>

          {/* Car & Business Expenses */}
          <Card className="border-border/70 shadow-2xs" data-testid="kpi-expenses">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase">
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-xl font-bold text-rose-700 dark:text-rose-400">
                {formatAed(metrics.carExpenses + metrics.businessExpenses)}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Car: {formatAed(metrics.carExpenses)} | Biz: {formatAed(metrics.businessExpenses)}
              </div>
            </CardContent>
          </Card>

          {/* Realized Car Profit & Net Business Profit */}
          <Card className="border-border/70 shadow-2xs" data-testid="kpi-profit">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase">
                Net Business Profit
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div
                className={`text-xl font-bold ${
                  metrics.netBusinessProfit >= 0
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-rose-700 dark:text-rose-400"
                }`}
              >
                {metrics.netBusinessProfit >= 0 ? "+" : ""}
                {formatAed(metrics.netBusinessProfit)}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Realized Car Profit: {formatAed(metrics.realizedCarProfit)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Subsidiary Detailed Breakdown Tables */}
      <Card className="border-border/80 shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b bg-muted/20 px-4 pt-2 gap-2">
          <Button
            type="button"
            variant={activeTab === "COMPLETED" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("COMPLETED")}
            className="text-xs rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary"
            data-testid="tab-completed-cars"
          >
            Completed Cars ({completedCars.length})
          </Button>

          <Button
            type="button"
            variant={activeTab === "PURCHASES" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("PURCHASES")}
            className="text-xs rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary"
            data-testid="tab-purchases"
          >
            Purchases in Month ({purchasedCars.length})
          </Button>

          <Button
            type="button"
            variant={activeTab === "EXPENSES" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("EXPENSES")}
            className="text-xs rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary"
            data-testid="tab-expenses"
          >
            Expense Breakdown ({expenseBreakdown.length})
          </Button>
        </div>

        {/* Tab 1: Completed Cars */}
        {activeTab === "COMPLETED" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b bg-muted/30 text-muted-foreground">
                  <th className="py-2.5 px-3 font-semibold">Car #</th>
                  <th className="py-2.5 px-3 font-semibold">Vehicle</th>
                  <th className="py-2.5 px-3 font-semibold">Purchase Date</th>
                  <th className="py-2.5 px-3 font-semibold">Completion Date</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Days in Stock</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Investment (AED)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Recovery (AED)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Realized Profit (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {completedCars.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      No cars completed during {monthLabel}.
                    </td>
                  </tr>
                ) : (
                  completedCars.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold">
                        <Link
                          href={`/cars/${c.id}`}
                          className="text-primary hover:underline"
                        >
                          CAR-{c.carNumber}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 font-medium">
                        {c.brand} {c.model}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground font-mono">
                        {c.purchaseDate}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground font-mono">
                        {c.completionDate}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {c.daysInStock} d
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {formatAed(c.totalInvestment)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatAed(c.totalRecovery)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono font-bold ${
                          c.realizedProfit >= 0
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-rose-700 dark:text-rose-400"
                        }`}
                      >
                        {c.realizedProfit >= 0 ? "+" : ""}
                        {formatAed(c.realizedProfit)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Purchases */}
        {activeTab === "PURCHASES" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b bg-muted/30 text-muted-foreground">
                  <th className="py-2.5 px-3 font-semibold">Car #</th>
                  <th className="py-2.5 px-3 font-semibold">Vehicle</th>
                  <th className="py-2.5 px-3 font-semibold">Purchase Date</th>
                  <th className="py-2.5 px-3 font-semibold">Seller</th>
                  <th className="py-2.5 px-3 font-semibold">Source</th>
                  <th className="py-2.5 px-3 font-semibold">Method</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Price (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {purchasedCars.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No cars purchased during {monthLabel}.
                    </td>
                  </tr>
                ) : (
                  purchasedCars.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold">
                        <Link
                          href={`/cars/${p.id}`}
                          className="text-primary hover:underline"
                        >
                          CAR-{p.carNumber}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 font-medium">
                        {p.brand} {p.model}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground font-mono">
                        {p.purchaseDate}
                      </td>
                      <td className="py-2.5 px-3">{p.sellerName}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {p.sourceName || "Walk-in"}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className="text-[10px]">
                          {p.paymentMethod}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700 dark:text-rose-400">
                        {formatAed(p.purchasePrice)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Monthly Expenses Breakdown */}
        {activeTab === "EXPENSES" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b bg-muted/30 text-muted-foreground">
                  <th className="py-2.5 px-3 font-semibold">Category</th>
                  <th className="py-2.5 px-3 font-semibold">Type</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Entries</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Total Amount (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {expenseBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No expenses recorded during {monthLabel}.
                    </td>
                  </tr>
                ) : (
                  expenseBreakdown.map((exp) => (
                    <tr key={`${exp.type}-${exp.category}`} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-medium">{exp.category}</td>
                      <td className="py-2.5 px-3">
                        {exp.type === "CAR" ? (
                          <Badge
                            variant="secondary"
                            className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 text-[10px]"
                          >
                            Car Specific
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 text-[10px]"
                          >
                            Business Overhead
                          </Badge>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">{exp.count}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700 dark:text-rose-400">
                        {formatAed(exp.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
