"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  Car,
  Clock,
  Download,
  Flame,
  GitFork,
  Search,
  ShoppingBag,
  TrendingUp,
  Wrench,
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
import { Input } from "@/components/ui/input";
import { formatAed } from "@/lib/currency";
import type {
  BusinessAnalyticsData,
} from "../domain/analytics-types";

type AnalyticsViewProps = {
  initialData: BusinessAnalyticsData;
  isViewer?: boolean;
};

export function AnalyticsView({ initialData, isViewer = false }: AnalyticsViewProps) {
  const [activeTab, setActiveTab] = useState<
    "BRANDS" | "CONDITIONS" | "SOURCES" | "BUYERS"
  >("BRANDS");

  const [searchTerm, setSearchTerm] = useState("");

  const {
    overview,
    brandAnalytics,
    conditionAnalytics,
    sourceAnalytics,
    buyerCategoryAnalytics,
    topBuyers,
  } = initialData;

  // Search filtering per tab
  const filteredBrands = useMemo(() => {
    if (!searchTerm.trim()) return brandAnalytics;
    const q = searchTerm.toLowerCase().trim();
    return brandAnalytics.filter((b) => b.brand.toLowerCase().includes(q));
  }, [brandAnalytics, searchTerm]);

  const filteredSources = useMemo(() => {
    if (!searchTerm.trim()) return sourceAnalytics;
    const q = searchTerm.toLowerCase().trim();
    return sourceAnalytics.filter(
      (s) =>
        s.sourceName.toLowerCase().includes(q) ||
        s.sourceType.toLowerCase().includes(q),
    );
  }, [sourceAnalytics, searchTerm]);

  const filteredBuyers = useMemo(() => {
    if (!searchTerm.trim()) return topBuyers;
    const q = searchTerm.toLowerCase().trim();
    return topBuyers.filter(
      (b) =>
        b.buyerName.toLowerCase().includes(q) ||
        b.companyName?.toLowerCase().includes(q) ||
        b.buyerTypes.some((t) => t.toLowerCase().includes(q)),
    );
  }, [topBuyers, searchTerm]);

  const handleExportCsv = () => {
    const lines: string[] = [];
    lines.push("BUSINESS ANALYTICS REPORT (SECTION 16)");
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push("");

    lines.push("--- OVERVIEW ---");
    lines.push(`Total Cars Bought,${overview.totalCarsBought}`);
    lines.push(`Total Cars Completed,${overview.totalCarsCompleted}`);
    lines.push(`Total Investment (AED),${overview.totalInvestment}`);
    lines.push(`Total Recovery (AED),${overview.totalRecovery}`);
    lines.push(`Total Realized Profit (AED),${overview.totalRealizedProfit}`);
    lines.push(`Avg Profit Per Completed Car (AED),${overview.avgProfitPerCompletedCar}`);
    lines.push(`Avg Turnaround Days,${overview.avgDaysInStock}`);
    lines.push("");

    lines.push("--- 16.1 BRAND-WISE ANALYTICS ---");
    lines.push("Brand,Cars Bought,Cars Completed,Investment (AED),Recovery (AED),Realized Profit (AED),Avg Profit (AED)");
    for (const b of brandAnalytics) {
      lines.push(
        `"${b.brand}",${b.carsBought},${b.carsCompleted},${b.totalInvestment},${b.totalRecovery},${b.realizedCarProfit},${b.averageRealizedCarProfit}`,
      );
    }
    lines.push("");

    lines.push("--- 16.2 CONDITION-WISE ANALYTICS ---");
    lines.push("Condition,Cars Bought,Cars Completed,Avg Investment (AED),Avg Recovery (AED),Avg Realized Profit (AED),Avg Days in Stock");
    for (const c of conditionAnalytics) {
      lines.push(
        `"${c.conditionLabel}",${c.carsBought},${c.carsCompleted},${c.averageInvestment},${c.averageRecovery},${c.averageRealizedCarProfit},${c.averageDaysInStock}`,
      );
    }
    lines.push("");

    if (!isViewer) {
      lines.push("--- 16.3 SOURCE-WISE ANALYTICS ---");
      lines.push("Source Name,Source Type,Cars Bought,Cars Completed,Purchase Value (AED),Commission Paid (AED),Recovery (AED),Realized Profit (AED),Avg Profit (AED)");
      for (const s of sourceAnalytics) {
        lines.push(
          `"${s.sourceName}","${s.sourceType}",${s.carsBought},${s.carsCompleted},${s.purchaseValue},${s.commissionPaid},${s.totalRecovery},${s.realizedCarProfit},${s.averageRealizedCarProfit}`,
        );
      }
      lines.push("");

      lines.push("--- 16.4 BUYER CATEGORIES ---");
      lines.push("Category,Transactions Count,Total Amount (AED),Average Transaction (AED)");
      for (const bc of buyerCategoryAnalytics) {
        lines.push(`"${bc.category}",${bc.transactionCount},${bc.totalAmount},${bc.averageTransaction}`);
      }
      lines.push("");

      lines.push("--- 16.4 TOP BUYERS ---");
      lines.push("Buyer Name,Company,Categories,Total Purchases,Total Amount (AED),Avg Transaction (AED),Last Purchase");
      for (const b of topBuyers) {
        lines.push(
          `"${b.buyerName}","${b.companyName || "N/A"}","${b.buyerTypes.join("; ")}",${b.totalPurchases},${b.totalAmount},${b.averageTransaction},${b.lastPurchaseDate || "N/A"}`,
        );
      }
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `business-analytics-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Business Analytics report exported to CSV.");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Business Analytics</h1>
            <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5">
              Section 16
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Analyze buying and recovery performance across brands, conditions, sources, and buyers.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCsv}
          className="gap-1.5 shadow-xs"
          data-testid="export-analytics-csv-btn"
        >
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      {/* Top Overview KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Bought */}
        <Card className="border-border/80 shadow-xs" size="sm" data-testid="kpi-analytics-bought">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3.5 space-y-0">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total Sourced
            </CardTitle>
            <div className="rounded-md bg-blue-500/10 p-1 text-blue-600 dark:text-blue-400">
              <Car className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent className="px-3.5 pb-3 pt-0">
            <div className="text-base sm:text-lg font-bold tracking-tight">
              {overview.totalCarsBought}{" "}
              <span className="text-[11px] font-normal text-muted-foreground">cars</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {overview.totalCarsCompleted} completed ({overview.totalCarsBought > 0 ? Math.round((overview.totalCarsCompleted / overview.totalCarsBought) * 100) : 0}%)
            </p>
          </CardContent>
        </Card>

        {/* Total Investment */}
        <Card className="border-border/80 shadow-xs" size="sm" data-testid="kpi-analytics-investment">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3.5 space-y-0">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Capital Invested
            </CardTitle>
            <div className="rounded-md bg-indigo-500/10 p-1 text-indigo-600 dark:text-indigo-400">
              <Building2 className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent className="px-3.5 pb-3 pt-0">
            <div
              className="text-sm sm:text-base font-bold tracking-tight text-indigo-700 dark:text-indigo-400 truncate"
              title={formatAed(overview.totalInvestment)}
            >
              {formatAed(overview.totalInvestment)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              Purchases + expenses
            </p>
          </CardContent>
        </Card>

        {/* Total Realized Profit */}
        <Card className="border-border/80 shadow-xs" size="sm" data-testid="kpi-analytics-profit">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3.5 space-y-0">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Realized Profit
            </CardTitle>
            <div className="rounded-md bg-emerald-500/10 p-1 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent className="px-3.5 pb-3 pt-0">
            <div
              className={`text-sm sm:text-base font-bold tracking-tight truncate ${
                overview.totalRealizedProfit >= 0
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-rose-700 dark:text-rose-400"
              }`}
              title={formatAed(overview.totalRealizedProfit)}
            >
              {overview.totalRealizedProfit >= 0 ? "+" : ""}
              {formatAed(overview.totalRealizedProfit)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              Completed cars only
            </p>
          </CardContent>
        </Card>

        {/* Avg Profit Per Car */}
        <Card className="border-border/80 shadow-xs" size="sm" data-testid="kpi-analytics-avg-profit">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3.5 space-y-0">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Avg Profit / Car
            </CardTitle>
            <div className="rounded-md bg-amber-500/10 p-1 text-amber-600 dark:text-amber-400">
              <Flame className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent className="px-3.5 pb-3 pt-0">
            <div
              className="text-sm sm:text-base font-bold tracking-tight text-amber-700 dark:text-amber-400 truncate"
              title={formatAed(overview.avgProfitPerCompletedCar)}
            >
              {formatAed(overview.avgProfitPerCompletedCar)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              Per completed car
            </p>
          </CardContent>
        </Card>

        {/* Turnaround Days */}
        <Card className="border-border/80 shadow-xs" size="sm" data-testid="kpi-analytics-turnaround">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3.5 space-y-0">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Turnaround
            </CardTitle>
            <div className="rounded-md bg-purple-500/10 p-1 text-purple-600 dark:text-purple-400">
              <Clock className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent className="px-3.5 pb-3 pt-0">
            <div className="text-base sm:text-lg font-bold tracking-tight">
              {overview.avgDaysInStock}{" "}
              <span className="text-[11px] font-normal text-muted-foreground">days</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              Purchase to completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Segmented Tabs & Content */}
      <Card className="border-border/80 shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b bg-muted/20 px-4 pt-3 pb-2 gap-3">
          {/* Segmented Tab Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              variant={activeTab === "BRANDS" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("BRANDS")}
              className="text-xs gap-1.5"
              data-testid="tab-brands"
            >
              <Car className="size-3.5" />
              16.1 Brands ({brandAnalytics.length})
            </Button>

            <Button
              type="button"
              variant={activeTab === "CONDITIONS" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("CONDITIONS")}
              className="text-xs gap-1.5"
              data-testid="tab-conditions"
            >
              <Wrench className="size-3.5" />
              16.2 Conditions ({conditionAnalytics.length})
            </Button>

            {!isViewer && (
              <>
                <Button
                  type="button"
                  variant={activeTab === "SOURCES" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("SOURCES")}
                  className="text-xs gap-1.5"
                  data-testid="tab-sources"
                >
                  <GitFork className="size-3.5" />
                  16.3 Sources ({sourceAnalytics.length})
                </Button>

                <Button
                  type="button"
                  variant={activeTab === "BUYERS" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("BUYERS")}
                  className="text-xs gap-1.5"
                  data-testid="tab-buyers"
                >
                  <ShoppingBag className="size-3.5" />
                  16.4 Buyers ({topBuyers.length})
                </Button>
              </>
            )}
          </div>

          {/* Quick Search filter */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter current tab..."
              className="h-8 pl-8 text-xs bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="analytics-search-input"
            />
          </div>
        </div>

        {/* Tab 1: Brand-Wise Analytics (16.1) */}
        {activeTab === "BRANDS" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs" data-testid="table-brands">
              <thead>
                <tr className="border-b bg-muted/30 text-muted-foreground">
                  <th className="py-3 px-3 font-semibold">Brand</th>
                  <th className="py-3 px-3 font-semibold text-right">Cars Bought</th>
                  <th className="py-3 px-3 font-semibold text-right">Cars Completed</th>
                  <th className="py-3 px-3 font-semibold text-right">Total Investment (AED)</th>
                  <th className="py-3 px-3 font-semibold text-right">Total Recovery (AED)</th>
                  <th className="py-3 px-3 font-semibold text-right">Realized Car Profit (AED)</th>
                  <th className="py-3 px-3 font-semibold text-right">Avg Profit / Completed (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredBrands.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No brand records match your search.
                    </td>
                  </tr>
                ) : (
                  filteredBrands.map((b) => (
                    <tr key={b.brand} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3 font-semibold text-foreground">
                        {b.brand}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium">
                        {b.carsBought}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-muted-foreground">
                        {b.carsCompleted}
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        {formatAed(b.totalInvestment)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatAed(b.totalRecovery)}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-mono font-bold ${
                          b.realizedCarProfit >= 0
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-rose-700 dark:text-rose-400"
                        }`}
                      >
                        {b.realizedCarProfit >= 0 ? "+" : ""}
                        {formatAed(b.realizedCarProfit)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-amber-700 dark:text-amber-400">
                        {formatAed(b.averageRealizedCarProfit)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Condition-Wise Analytics (16.2) */}
        {activeTab === "CONDITIONS" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs" data-testid="table-conditions">
              <thead>
                <tr className="border-b bg-muted/30 text-muted-foreground">
                  <th className="py-3 px-3 font-semibold">Condition</th>
                  <th className="py-3 px-3 font-semibold text-right">Cars Bought</th>
                  <th className="py-3 px-3 font-semibold text-right">Completed</th>
                  <th className="py-3 px-3 font-semibold text-right">Avg Investment (AED)</th>
                  <th className="py-3 px-3 font-semibold text-right">Avg Recovery (AED)</th>
                  <th className="py-3 px-3 font-semibold text-right">Avg Realized Profit (AED)</th>
                  <th className="py-3 px-3 font-semibold text-right">Avg Days in Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {conditionAnalytics.map((c) => (
                  <tr key={c.condition} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-3 font-medium">
                      <Badge variant="outline" className="text-xs">
                        {c.conditionLabel}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold">
                      {c.carsBought}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-muted-foreground">
                      {c.carsCompleted}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      {formatAed(c.averageInvestment)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      {formatAed(c.averageRecovery)}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-mono font-bold ${
                        c.averageRealizedCarProfit >= 0
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-rose-700 dark:text-rose-400"
                      }`}
                    >
                      {c.averageRealizedCarProfit >= 0 ? "+" : ""}
                      {formatAed(c.averageRealizedCarProfit)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-purple-700 dark:text-purple-400 font-semibold">
                      {c.averageDaysInStock} d
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Source-Wise Analytics (16.3) */}
        {activeTab === "SOURCES" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs" data-testid="table-sources">
              <thead>
                <tr className="border-b bg-muted/30 text-muted-foreground">
                  <th className="py-3 px-3 font-semibold">Source / Channel</th>
                  <th className="py-3 px-3 font-semibold">Source Type</th>
                  <th className="py-3 px-3 font-semibold text-right">Cars Bought</th>
                  <th className="py-3 px-3 font-semibold text-right">Capital Sourced (AED)</th>
                  <th className="py-3 px-3 font-semibold text-right">Commission Paid (AED)</th>
                  <th className="py-3 px-3 font-semibold text-right">Total Recovery (AED)</th>
                  <th className="py-3 px-3 font-semibold text-right">Realized Profit (AED)</th>
                  <th className="py-3 px-3 font-semibold text-right">Avg Profit (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredSources.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      No source records found.
                    </td>
                  </tr>
                ) : (
                  filteredSources.map((s, idx) => (
                    <tr key={s.sourceId || idx} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3 font-semibold text-foreground">
                        {s.sourceName}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="secondary" className="text-[10px]">
                          {s.sourceType}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium">
                        {s.carsBought}
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        {formatAed(s.purchaseValue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-rose-700 dark:text-rose-400">
                        {formatAed(s.commissionPaid)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatAed(s.totalRecovery)}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-mono font-bold ${
                          s.realizedCarProfit >= 0
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-rose-700 dark:text-rose-400"
                        }`}
                      >
                        {s.realizedCarProfit >= 0 ? "+" : ""}
                        {formatAed(s.realizedCarProfit)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-700 dark:text-amber-400 font-semibold">
                        {formatAed(s.averageRealizedCarProfit)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Buyer-Wise Analytics (16.4) */}
        {activeTab === "BUYERS" && (
          <div className="p-4 space-y-6">
            {/* Category Breakdown */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Buyer Category Distribution
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {buyerCategoryAnalytics.map((cat) => (
                  <Card key={cat.category} className="border-border/70 shadow-2xs">
                    <CardHeader className="py-2.5 px-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-semibold">
                          {cat.category}
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px]">
                          {cat.transactionCount} sales
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="px-3 pb-2.5 pt-0">
                      <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                        {formatAed(cat.totalAmount)}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Avg: {formatAed(cat.averageTransaction)} / sale
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Top Buyers List */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Top Buyers by Purchase Volume
              </h3>
              <div className="overflow-x-auto border rounded-md">
                <table className="w-full text-left border-collapse text-xs" data-testid="table-buyers">
                  <thead>
                    <tr className="border-b bg-muted/30 text-muted-foreground">
                      <th className="py-2.5 px-3 font-semibold">Buyer Name</th>
                      <th className="py-2.5 px-3 font-semibold">Company</th>
                      <th className="py-2.5 px-3 font-semibold">Types</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Purchases</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Total Amount (AED)</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Avg Ticket (AED)</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Last Purchase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredBuyers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          No buyer records match your search.
                        </td>
                      </tr>
                    ) : (
                      filteredBuyers.map((b) => (
                        <tr key={b.buyerId} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-foreground">
                            {b.buyerName}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground">
                            {b.companyName || "—"}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-wrap gap-1">
                              {b.buyerTypes.map((t) => (
                                <Badge
                                  key={t}
                                  variant="secondary"
                                  className="text-[9px] px-1 py-0 h-4 font-normal"
                                >
                                  {t}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium">
                            {b.totalPurchases}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {formatAed(b.totalAmount)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                            {formatAed(b.averageTransaction)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                            {b.lastPurchaseDate || "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
