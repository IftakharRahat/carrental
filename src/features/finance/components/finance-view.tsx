"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Filter,
  Landmark,
  Search,
  Settings,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
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
  CustomCategoryItem,
  FinanceSummaryKpis,
  LedgerRowItem,
} from "../domain/finance-types";
import { AddCategoryDialog } from "./add-category-dialog";
import { ConfigureOpeningCashDialog } from "./configure-opening-cash-dialog";
import { ManualTransactionDialog } from "./manual-transaction-dialog";

type FinanceViewProps = {
  initialRows: LedgerRowItem[];
  initialSummary: FinanceSummaryKpis;
  customCategories: CustomCategoryItem[];
  availableCars: Array<{
    id: string;
    carNumber: number;
    brand: string;
    model: string;
    year: number | null;
  }>;
  isViewer?: boolean;
};

export function FinanceView({
  initialRows,
  initialSummary,
  customCategories,
  availableCars,
  isViewer = false,
}: FinanceViewProps) {
  // Filters state
  const [datePreset, setDatePreset] = useState<
    "ALL" | "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "CUSTOM"
  >("ALL");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [directionFilter, setDirectionFilter] = useState<"ALL" | "IN" | "OUT">(
    "ALL",
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("ALL");
  const [carFilter, setCarFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Dialogs state
  const [manualTxOpen, setManualTxOpen] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [openingCashOpen, setOpeningCashOpen] = useState(false);

  // Derive unique categories present in ledger or custom lists
  const allUniqueCategories = useMemo(() => {
    const set = new Set<string>();
    initialRows.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    customCategories.forEach((c) => set.add(c.name));
    return Array.from(set).sort();
  }, [initialRows, customCategories]);

  // Compute effective date bounds
  const { effectiveStart, effectiveEnd } = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (datePreset === "TODAY") {
      return { effectiveStart: todayStr, effectiveEnd: todayStr };
    }
    if (datePreset === "THIS_WEEK") {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      return {
        effectiveStart: monday.toISOString().slice(0, 10),
        effectiveEnd: null,
      };
    }
    if (datePreset === "THIS_MONTH") {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        effectiveStart: firstDay.toISOString().slice(0, 10),
        effectiveEnd: null,
      };
    }
    if (datePreset === "CUSTOM") {
      return {
        effectiveStart: customStartDate || null,
        effectiveEnd: customEndDate || null,
      };
    }
    return { effectiveStart: null, effectiveEnd: null };
  }, [datePreset, customStartDate, customEndDate]);

  // Filtered rows (client-side interactive)
  const filteredRows = useMemo(() => {
    return initialRows.filter((row) => {
      // Exclude synthetic opening balance from display table
      if (row.isOpeningBalance) return false;

      // Date range filter
      if (effectiveStart && row.transactionDate < effectiveStart) return false;
      if (effectiveEnd && row.transactionDate > effectiveEnd) return false;

      // Direction
      if (directionFilter !== "ALL" && row.direction !== directionFilter) {
        return false;
      }

      // Category
      if (categoryFilter !== "ALL" && row.category !== categoryFilter) {
        return false;
      }

      // Payment method
      if (
        paymentMethodFilter !== "ALL" &&
        row.paymentMethod !== paymentMethodFilter
      ) {
        return false;
      }

      // Car filter
      if (carFilter !== "ALL" && row.carId !== carFilter) {
        return false;
      }

      // Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchDesc = row.description.toLowerCase().includes(q);
        const matchCat = row.category.toLowerCase().includes(q);
        const matchCar = row.carName?.toLowerCase().includes(q);
        const matchCarNo = row.carNumber && String(row.carNumber).includes(q);
        const matchRef = row.referenceId.toLowerCase().includes(q);
        if (!matchDesc && !matchCat && !matchCar && !matchCarNo && !matchRef) {
          return false;
        }
      }

      return true;
    });
  }, [
    initialRows,
    effectiveStart,
    effectiveEnd,
    directionFilter,
    categoryFilter,
    paymentMethodFilter,
    carFilter,
    searchTerm,
  ]);

  // Dynamic summary based on filtered rows + core formula
  const dynamicSummary = useMemo(() => {
    let filteredIn = 0;
    let filteredOut = 0;

    for (const r of filteredRows) {
      if (r.moneyIn !== null) filteredIn += r.moneyIn;
      if (r.moneyOut !== null) filteredOut += r.moneyOut;
    }

    return {
      openingCash: initialSummary.openingCash,
      moneyIn: filteredIn,
      moneyOut: filteredOut,
      availableCash: initialSummary.availableCash,
    };
  }, [filteredRows, initialSummary]);

  // Export CSV Handler
  const handleExportCsv = () => {
    if (filteredRows.length === 0) {
      toast.info("No rows to export.");
      return;
    }

    const headers = [
      "Date",
      "Direction",
      "Category",
      "Reference",
      "Description",
      "Payment Method",
      "Money In (AED)",
      "Money Out (AED)",
      "Running Balance (AED)",
    ];

    const rowsCsv = filteredRows.map((r) => [
      r.transactionDate,
      r.direction === "IN" ? "Money In" : "Money Out",
      `"${r.category.replace(/"/g, '""')}"`,
      `"${(r.carNumber ? `CAR-${r.carNumber}` : r.referenceType).replace(/"/g, '""')}"`,
      `"${r.description.replace(/"/g, '""')}"`,
      r.paymentMethod,
      r.moneyIn !== null ? r.moneyIn.toFixed(2) : "",
      r.moneyOut !== null ? r.moneyOut.toFixed(2) : "",
      r.runningBalance.toFixed(2),
    ]);

    const csvContent = [headers.join(","), ...rowsCsv.map((row) => row.join(","))].join(
      "\r\n",
    );

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `finance-ledger-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredRows.length} ledger rows.`);
  };

  const hasActiveFilters =
    datePreset !== "ALL" ||
    directionFilter !== "ALL" ||
    categoryFilter !== "ALL" ||
    paymentMethodFilter !== "ALL" ||
    carFilter !== "ALL" ||
    searchTerm.trim().length > 0;

  const resetFilters = () => {
    setDatePreset("ALL");
    setCustomStartDate("");
    setCustomEndDate("");
    setDirectionFilter("ALL");
    setCategoryFilter("ALL");
    setPaymentMethodFilter("ALL");
    setCarFilter("ALL");
    setSearchTerm("");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance / Cash Flow</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Single ledger-based view of money entering and leaving the business.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="gap-1.5 shadow-xs"
            data-testid="export-csv-btn"
          >
            <Download className="size-4" />
            Export CSV
          </Button>

          {!isViewer && (
            <>
              <AddCategoryDialog
                open={addCategoryOpen}
                onOpenChange={setAddCategoryOpen}
              />

              <ManualTransactionDialog
                customCategories={customCategories}
                availableCars={availableCars}
                open={manualTxOpen}
                onOpenChange={setManualTxOpen}
              />
            </>
          )}
        </div>
      </div>

      {/* Section 12.3: Finance Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Opening Cash */}
        <Card className="relative overflow-hidden border-border/80 shadow-xs" data-testid="kpi-opening-cash">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Opening Cash
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground hover:text-foreground"
                title="Configure Opening Cash"
                aria-label="Configure Opening Cash"
                data-testid="configure-opening-cash-trigger"
                onClick={() => setOpeningCashOpen(true)}
              >
                <Settings className="size-3.5" />
              </Button>
              <div className="rounded-md bg-blue-500/10 p-1.5 text-blue-600 dark:text-blue-400">
                <Landmark className="size-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {formatAed(dynamicSummary.openingCash)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              Configured starting balance
            </p>
          </CardContent>
        </Card>

        {/* Money In */}
        <Card className="relative overflow-hidden border-border/80 shadow-xs" data-testid="kpi-money-in">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Money In
            </CardTitle>
            <div className="rounded-md bg-emerald-500/10 p-1.5 text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
              +{formatAed(dynamicSummary.moneyIn)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="size-3.5 text-emerald-600" />
              Sum within current filter
            </p>
          </CardContent>
        </Card>

        {/* Money Out */}
        <Card className="relative overflow-hidden border-border/80 shadow-xs" data-testid="kpi-money-out">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Money Out
            </CardTitle>
            <div className="rounded-md bg-rose-500/10 p-1.5 text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-rose-700 dark:text-rose-400">
              -{formatAed(dynamicSummary.moneyOut)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingDown className="size-3.5 text-rose-600" />
              Sum within current filter
            </p>
          </CardContent>
        </Card>

        {/* Available Cash (Core Formula) */}
        <Card className="relative overflow-hidden border-primary/40 bg-primary/5 shadow-xs" data-testid="kpi-available-cash">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-primary">
              Available Cash
            </CardTitle>
            <div className="rounded-md bg-primary/10 p-1.5 text-primary">
              <Wallet className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold tracking-tight text-primary">
              {formatAed(dynamicSummary.availableCash)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">
              Opening + In - Out (Stock Excl.)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="size-4" />
              <span>Filters & Ledger View</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  Active
                </Badge>
              )}
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="xs"
                onClick={resetFilters}
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 self-start sm:self-auto"
              >
                <X className="size-3.5" />
                Reset Filters
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 pt-0 space-y-3">
          {/* Preset Buttons + Date Range */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground mr-1">
              Date Preset:
            </span>
            {(["ALL", "TODAY", "THIS_WEEK", "THIS_MONTH", "CUSTOM"] as const).map(
              (preset) => {
                const labels: Record<typeof preset, string> = {
                  ALL: "All Time",
                  TODAY: "Today",
                  THIS_WEEK: "This Week",
                  THIS_MONTH: "This Month",
                  CUSTOM: "Custom Range",
                };
                const isActive = datePreset === preset;
                return (
                  <Button
                    key={preset}
                    type="button"
                    variant={isActive ? "default" : "outline"}
                    size="xs"
                    className="h-7 text-xs font-normal"
                    onClick={() => setDatePreset(preset)}
                  >
                    {labels[preset]}
                  </Button>
                );
              },
            )}

            {datePreset === "CUSTOM" && (
              <div className="flex items-center gap-2 ml-2 mt-1 sm:mt-0">
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="h-7 text-xs w-32"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="h-7 text-xs w-32"
                />
              </div>
            )}
          </div>

          {/* Secondary Filters: Direction, Category, Payment Method, Car, Search */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search description, ref, car..."
                className="h-8 pl-8 text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Direction Filter */}
            <div>
              <select
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={directionFilter}
                onChange={(e) =>
                  setDirectionFilter(e.target.value as "ALL" | "IN" | "OUT")
                }
              >
                <option value="ALL">All Flows (In & Out)</option>
                <option value="IN">Money In Only</option>
                <option value="OUT">Money Out Only</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                {allUniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method Filter */}
            <div>
              <select
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
              >
                <option value="ALL">All Payment Methods</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Car Filter */}
            <div>
              <select
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={carFilter}
                onChange={(e) => setCarFilter(e.target.value)}
              >
                <option value="ALL">All Associated Cars</option>
                {availableCars.map((car) => (
                  <option key={car.id} value={car.id}>
                    CAR-{car.carNumber} ({car.brand} {car.model})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 12.4: Ledger Table */}
      <Card className="border-border/80 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/20">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Cash Ledger Records</h2>
            <Badge variant="outline" className="text-xs font-normal">
              {filteredRows.length} {filteredRows.length === 1 ? "entry" : "entries"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground hidden sm:block">
            Chronological balance recalculated dynamically
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="finance-ledger-table">
            <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
              <tr>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Reference</th>
                <th className="py-3 px-3">Description / Reason</th>
                <th className="py-3 px-3">Method</th>
                <th className="py-3 px-3 text-right">Money In (AED)</th>
                <th className="py-3 px-3 text-right">Money Out (AED)</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-12 text-center text-muted-foreground text-sm"
                  >
                    No financial transactions found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const isMoneyIn = row.direction === "IN";
                  const displayMethod =
                    row.paymentMethod === "BANK_TRANSFER"
                      ? "Bank Transfer"
                      : row.paymentMethod === "CHEQUE"
                      ? "Cheque"
                      : row.paymentMethod === "CASH"
                      ? "Cash"
                      : "Other";

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-muted/30 transition-colors group"
                      data-testid={`ledger-row-${row.id}`}
                    >
                      {/* Date */}
                      <td className="py-3 px-3 font-mono text-xs whitespace-nowrap text-muted-foreground">
                        {row.transactionDate}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isMoneyIn ? (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 gap-1 text-[11px] font-medium"
                          >
                            <ArrowDownLeft className="size-3" />
                            Money In
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800 gap-1 text-[11px] font-medium"
                          >
                            <ArrowUpRight className="size-3" />
                            Money Out
                          </Badge>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 whitespace-nowrap font-medium text-xs">
                        <div className="flex items-center gap-1.5">
                          <span>{row.category}</span>
                          {row.customCategory && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1 py-0 h-4 text-muted-foreground font-normal"
                            >
                              Custom
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Reference */}
                      <td className="py-3 px-3 whitespace-nowrap text-xs">
                        {row.carId && row.carNumber ? (
                          <Link
                            href={`/cars/${row.carId}`}
                            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                          >
                            <span>CAR-{row.carNumber}</span>
                          </Link>
                        ) : (
                          <span className="text-muted-foreground font-mono text-[11px]">
                            {row.referenceType === "MANUAL_ENTRY"
                              ? "Manual"
                              : row.referenceType}
                          </span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="py-3 px-3 text-xs max-w-xs truncate text-foreground">
                        <span title={row.description}>{row.description}</span>
                        {row.carName && (
                          <span className="ml-1 text-[11px] text-muted-foreground">
                            ({row.carName})
                          </span>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3 px-3 whitespace-nowrap text-xs text-muted-foreground">
                        {displayMethod}
                      </td>

                      {/* Money In */}
                      <td className="py-3 px-3 whitespace-nowrap text-right font-mono text-xs">
                        {row.moneyIn !== null ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                            +{formatAed(row.moneyIn)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>

                      {/* Money Out */}
                      <td className="py-3 px-3 whitespace-nowrap text-right font-mono text-xs">
                        {row.moneyOut !== null ? (
                          <span className="text-rose-700 dark:text-rose-400 font-semibold">
                            -{formatAed(row.moneyOut)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>

                      {/* Running Balance */}
                      <td className="py-3 px-4 whitespace-nowrap text-right font-mono text-xs font-bold text-foreground">
                        {formatAed(row.runningBalance)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Opening Cash Modal */}
      <ConfigureOpeningCashDialog
        currentOpeningCash={initialSummary.openingCash}
        open={openingCashOpen}
        onOpenChange={setOpeningCashOpen}
        triggerButton={false}
      />
    </div>
  );
}
