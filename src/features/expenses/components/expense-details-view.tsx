"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Car,
  Download,
  ExternalLink,
  Filter,
  Search,
  TrendingDown,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatAed } from "@/lib/currency";
import {
  calculateExpenseDetailsSummary,
  getDatePresetRange,
} from "../domain/expense-calculations";
import {
  FIXED_EXPENSE_CATEGORIES,
  OPERATING_EXPENSE_CATEGORIES,
  FINANCIAL_EXPENSE_CATEGORIES,
  OTHER_EXPENSE_CATEGORIES,
  ALL_BUSINESS_EXPENSE_CATEGORIES,
  type UnifiedExpenseRow,
} from "../domain/expense-types";

const CAR_EXPENSE_CATEGORIES = [
  "TRANSPORT",
  "LABOUR",
  "PARTS",
  "REPAIR",
  "RTA_DOCUMENTATION",
  "OTHER",
] as const;

type ExpenseDetailsViewProps = {
  initialRows: UnifiedExpenseRow[];
  availableCategories: string[];
};

export function ExpenseDetailsView({
  initialRows,
  availableCategories,
}: ExpenseDetailsViewProps) {
  // Filters state - default preset is THIS_MONTH per Section 14
  const [datePreset, setDatePreset] = useState<
    "THIS_WEEK" | "LAST_WEEK" | "THIS_MONTH" | "LAST_MONTH" | "ALL" | "CUSTOM"
  >("THIS_MONTH");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "CAR" | "BUSINESS">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Details Modal for business expense or view
  const [selectedRow, setSelectedRow] = useState<UnifiedExpenseRow | null>(null);

  // Extra categories present in availableCategories not covered by standard sets
  const extraCategories = useMemo(() => {
    const known = new Set<string>([
      ...ALL_BUSINESS_EXPENSE_CATEGORIES,
      ...CAR_EXPENSE_CATEGORIES,
    ]);
    return availableCategories.filter((c) => !known.has(c));
  }, [availableCategories]);

  // Compute effective date bounds based on preset
  const { effectiveStart, effectiveEnd } = useMemo(() => {
    if (datePreset === "CUSTOM") {
      return {
        effectiveStart: customStartDate || null,
        effectiveEnd: customEndDate || null,
      };
    }
    if (
      datePreset === "THIS_WEEK" ||
      datePreset === "LAST_WEEK" ||
      datePreset === "THIS_MONTH" ||
      datePreset === "LAST_MONTH"
    ) {
      const range = getDatePresetRange(datePreset);
      return {
        effectiveStart: range?.startDate || null,
        effectiveEnd: range?.endDate || null,
      };
    }
    return { effectiveStart: null, effectiveEnd: null };
  }, [datePreset, customStartDate, customEndDate]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return initialRows.filter((row) => {
      // Date range filter
      if (effectiveStart && row.expenseDate < effectiveStart) return false;
      if (effectiveEnd && row.expenseDate > effectiveEnd) return false;

      // Expense Type filter (Car vs Business)
      if (typeFilter !== "ALL" && row.expenseType !== typeFilter) return false;

      // Category filter
      if (categoryFilter !== "ALL" && row.category !== categoryFilter) {
        return false;
      }

      // Payment method filter
      if (
        paymentMethodFilter !== "ALL" &&
        row.paymentMethod !== paymentMethodFilter
      ) {
        return false;
      }

      // Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchDesc = row.description.toLowerCase().includes(q);
        const matchCat = row.category.toLowerCase().includes(q);
        const matchRef = row.reference.toLowerCase().includes(q);
        const matchCar = row.carName?.toLowerCase().includes(q);
        const matchNotes = row.notes?.toLowerCase().includes(q);
        if (!matchDesc && !matchCat && !matchRef && !matchCar && !matchNotes) {
          return false;
        }
      }

      return true;
    });
  }, [
    initialRows,
    effectiveStart,
    effectiveEnd,
    typeFilter,
    categoryFilter,
    paymentMethodFilter,
    searchTerm,
  ]);

  // Dynamic summary strictly equals the sum of visible filtered rows (Section 14.1 & 14.3)
  const dynamicSummary = useMemo(() => {
    return calculateExpenseDetailsSummary(filteredRows);
  }, [filteredRows]);

  // Export CSV Handler
  const handleExportCsv = () => {
    if (filteredRows.length === 0) {
      toast.info("No rows to export.");
      return;
    }

    const headers = [
      "Date",
      "Expense Type",
      "Category",
      "Reference",
      "Description",
      "Amount (AED)",
      "Payment Method",
      "Notes",
    ];

    const rowsCsv = filteredRows.map((r) => [
      r.expenseDate,
      r.expenseType === "CAR" ? "Car Expense" : "Business Expense",
      `"${r.category.replace(/"/g, '""')}"`,
      `"${r.reference.replace(/"/g, '""')}"`,
      `"${r.description.replace(/"/g, '""')}"`,
      r.amount.toFixed(2),
      r.paymentMethod,
      `"${(r.notes || "").replace(/"/g, '""')}"`,
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
      `expense-details-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredRows.length} expense records.`);
  };

  const hasActiveFilters =
    datePreset !== "THIS_MONTH" ||
    typeFilter !== "ALL" ||
    categoryFilter !== "ALL" ||
    paymentMethodFilter !== "ALL" ||
    searchTerm.trim().length > 0;

  const resetFilters = () => {
    setDatePreset("THIS_MONTH");
    setCustomStartDate("");
    setCustomEndDate("");
    setTypeFilter("ALL");
    setCategoryFilter("ALL");
    setPaymentMethodFilter("ALL");
    setSearchTerm("");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Export Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expense Details</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Combined transaction-level reporting for car expenses and general business overheads (Section 14).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="gap-1.5 shadow-xs"
            data-testid="export-expenses-csv-btn"
          >
            <Download className="size-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Section 14.1 Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Car Expenses */}
        <Card className="border-border/80 shadow-xs" data-testid="kpi-details-car-expenses">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Car Expenses
            </CardTitle>
            <div className="rounded-md bg-blue-500/10 p-1.5 text-blue-600 dark:text-blue-400">
              <Car className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-blue-700 dark:text-blue-400">
              {formatAed(dynamicSummary.carExpenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Vehicle-specific parts, towing & repairs
            </p>
          </CardContent>
        </Card>

        {/* Business Expenses */}
        <Card className="border-border/80 shadow-xs" data-testid="kpi-details-biz-expenses">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Business Expenses
            </CardTitle>
            <div className="rounded-md bg-amber-500/10 p-1.5 text-amber-600 dark:text-amber-400">
              <Building2 className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-amber-700 dark:text-amber-400">
              {formatAed(dynamicSummary.businessExpenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              General rent, utilities & operating overheads
            </p>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="border-rose-500/30 bg-rose-50/20 dark:bg-rose-950/10 shadow-xs" data-testid="kpi-details-total-expenses">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Total Expenses
            </CardTitle>
            <div className="rounded-md bg-rose-500/10 p-1.5 text-rose-600 dark:text-rose-400">
              <TrendingDown className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold tracking-tight text-rose-700 dark:text-rose-400">
              {formatAed(dynamicSummary.totalExpenses)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">
              Car ({formatAed(dynamicSummary.carExpenses)}) + Business ({formatAed(dynamicSummary.businessExpenses)})
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section 14.2 Date & Filter Controls */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="size-4" />
              <span>Filters</span>
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
          {/* Section 14.2 Preset Buttons: This Week, Last Week, This Month, Last Month, Custom */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground mr-1">
              Date Period:
            </span>
            {(
              [
                "THIS_WEEK",
                "LAST_WEEK",
                "THIS_MONTH",
                "LAST_MONTH",
                "ALL",
                "CUSTOM",
              ] as const
            ).map((preset) => {
              const labels: Record<typeof preset, string> = {
                THIS_WEEK: "This Week",
                LAST_WEEK: "Last Week",
                THIS_MONTH: "This Month",
                LAST_MONTH: "Last Month",
                ALL: "All Time",
                CUSTOM: "Custom Range",
              };
              return (
                <Button
                  key={preset}
                  type="button"
                  variant={datePreset === preset ? "default" : "outline"}
                  size="xs"
                  className="h-7 text-xs font-normal"
                  onClick={() => setDatePreset(preset)}
                >
                  {labels[preset]}
                </Button>
              );
            })}

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

          {/* Secondary Filters: Type, Category, Payment Method, Search */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search description, car, ref..."
                className="h-8 pl-8 text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <select
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={typeFilter}
                onChange={(e) => {
                  const newType = e.target.value as "ALL" | "CAR" | "BUSINESS";
                  setTypeFilter(newType);
                  if (
                    newType === "CAR" &&
                    (ALL_BUSINESS_EXPENSE_CATEGORIES as readonly string[]).includes(categoryFilter)
                  ) {
                    setCategoryFilter("ALL");
                  } else if (
                    newType === "BUSINESS" &&
                    (CAR_EXPENSE_CATEGORIES as readonly string[]).includes(
                      categoryFilter as (typeof CAR_EXPENSE_CATEGORIES)[number],
                    )
                  ) {
                    setCategoryFilter("ALL");
                  }
                }}
                data-testid="details-type-filter"
              >
                <option value="ALL">All Expense Types</option>
                <option value="CAR">Car Expenses Only</option>
                <option value="BUSINESS">Business Overheads Only</option>
              </select>
            </div>

            <div>
              <select
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                data-testid="details-category-filter"
              >
                <option value="ALL">All Categories</option>

                {typeFilter !== "CAR" && (
                  <>
                    <optgroup label="Fixed / Regular">
                      {FIXED_EXPENSE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Operating">
                      {OPERATING_EXPENSE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Financial">
                      {FINANCIAL_EXPENSE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Other Business Expenses">
                      {OTHER_EXPENSE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                  </>
                )}

                {typeFilter !== "BUSINESS" && (
                  <optgroup label="Car / Vehicle Expenses">
                    {CAR_EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </optgroup>
                )}

                {extraCategories.length > 0 && (
                  <optgroup label="Other Categories">
                    {extraCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

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
          </div>
        </CardContent>
      </Card>

      {/* Section 14.3 Combined Transaction Table */}
      <Card className="border-border/80 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/20">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Expense Transactions</h2>
            <Badge variant="outline" className="text-xs font-normal">
              {filteredRows.length} {filteredRows.length === 1 ? "entry" : "entries"}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">
            Report Total strictly equals visible rows sum
          </span>
        </div>

        <div className="overflow-x-auto">
          <table
            className="w-full text-left text-sm"
            data-testid="expense-details-table"
          >
            <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
              <tr>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Expense Type</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Reference</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3 text-right">Amount (AED)</th>
                <th className="py-3 px-3">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-muted-foreground text-sm"
                  >
                    No expense transactions found for the selected filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const isCar = row.expenseType === "CAR";
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
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => setSelectedRow(row)}
                      data-testid={`expense-row-${row.id}`}
                    >
                      {/* Date */}
                      <td className="py-3 px-3 font-mono text-xs whitespace-nowrap text-muted-foreground">
                        {row.expenseDate}
                      </td>

                      {/* Expense Type */}
                      <td className="py-3 px-3 whitespace-nowrap text-xs">
                        {isCar ? (
                          <Badge
                            variant="secondary"
                            className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800 gap-1 text-[11px] font-medium"
                          >
                            <Car className="size-3" />
                            Car Expense
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800 gap-1 text-[11px] font-medium"
                          >
                            <Building2 className="size-3" />
                            Business Expense
                          </Badge>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 whitespace-nowrap text-xs font-medium">
                        {row.category}
                      </td>

                      {/* Reference */}
                      <td
                        className="py-3 px-3 whitespace-nowrap text-xs"
                        onClick={(e) => {
                          if (isCar && row.carId) {
                            e.stopPropagation(); // let link navigate directly
                          }
                        }}
                      >
                        {isCar && row.carId && row.carNumber ? (
                          <Link
                            href={`/cars/${row.carId}`}
                            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                            title="Open car details"
                          >
                            <span>CAR-{row.carNumber}</span>
                            <ExternalLink className="size-3 opacity-60" />
                          </Link>
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground">
                            Business
                          </span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="py-3 px-3 text-xs max-w-xs truncate">
                        <span title={row.description}>{row.description}</span>
                        {row.carName && (
                          <span className="ml-1 text-[11px] text-muted-foreground">
                            ({row.carName})
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3 whitespace-nowrap text-right font-mono text-xs font-bold text-rose-700 dark:text-rose-400">
                        {formatAed(row.amount)}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3 px-3 whitespace-nowrap text-xs text-muted-foreground">
                        {displayMethod}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredRows.length > 0 && (
              <tfoot className="bg-muted/40 border-t font-semibold text-xs">
                <tr>
                  <td colSpan={5} className="py-2.5 px-3 text-right">
                    Visible Rows Total:
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700 dark:text-rose-400">
                    {formatAed(dynamicSummary.totalExpenses)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      {/* Row Detail View Modal */}
      {selectedRow && (
        <Dialog
          open={Boolean(selectedRow)}
          onOpenChange={(open) => !open && setSelectedRow(null)}
        >
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedRow.expenseType === "CAR" ? (
                  <Car className="size-5 text-primary" />
                ) : (
                  <Building2 className="size-5 text-primary" />
                )}
                Expense Record Details
              </DialogTitle>
              <DialogDescription>
                Transaction breakdown and source reference.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expense Type:</span>
                <span className="font-semibold">
                  {selectedRow.expenseType === "CAR"
                    ? "Car Expense"
                    : "Business Expense"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category:</span>
                <span className="font-semibold">{selectedRow.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold text-rose-600 text-sm">
                  {formatAed(selectedRow.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-mono">{selectedRow.expenseDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method:</span>
                <span>{selectedRow.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference:</span>
                <span>{selectedRow.reference}</span>
              </div>
              {selectedRow.carName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle:</span>
                  <span>{selectedRow.carName}</span>
                </div>
              )}
              <div className="pt-1 border-t space-y-0.5">
                <span className="text-muted-foreground block">Description:</span>
                <p className="font-medium text-foreground">
                  {selectedRow.description}
                </p>
              </div>
              {selectedRow.notes && (
                <div className="pt-1 border-t space-y-0.5">
                  <span className="text-muted-foreground block">Notes:</span>
                  <p className="text-muted-foreground">{selectedRow.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {selectedRow.carId && (
                <Link
                  href={`/cars/${selectedRow.carId}`}
                  className={buttonVariants({ size: "sm" })}
                >
                  <Car className="size-4 mr-1.5" />
                  Open Car Profile
                </Link>
              )}
              {selectedRow.expenseType === "BUSINESS" && (
                <Link
                  href="/expenses/business"
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  <Building2 className="size-4 mr-1.5" />
                  View in Business Expenses
                </Link>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
