"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  Car,
  Edit2,
  Filter,
  Percent,
  Receipt,
  Search,
  Tag,
  TrendingDown,
  TrendingUp,
  Trash2,
  X,
} from "lucide-react";

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
import { getDatePresetRange } from "../domain/expense-calculations";
import {
  FIXED_EXPENSE_CATEGORIES,
  OPERATING_EXPENSE_CATEGORIES,
  FINANCIAL_EXPENSE_CATEGORIES,
  OTHER_EXPENSE_CATEGORIES,
  ALL_BUSINESS_EXPENSE_CATEGORIES,
  type BusinessExpenseItem,
  type BusinessExpensesPageKpis,
} from "../domain/expense-types";
import { AddBusinessExpenseDialog } from "./add-business-expense-dialog";
import { EditBusinessExpenseDialog } from "./edit-business-expense-dialog";
import { VoidBusinessExpenseDialog } from "./void-business-expense-dialog";

type BusinessExpensesViewProps = {
  initialExpenses: BusinessExpenseItem[];
  initialPageKpis: BusinessExpensesPageKpis;
};

export function BusinessExpensesView({
  initialExpenses,
  initialPageKpis,
}: BusinessExpensesViewProps) {
  // Filters state
  const [datePreset, setDatePreset] = useState<
    "ALL" | "THIS_MONTH" | "LAST_MONTH" | "CUSTOM"
  >("ALL");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "VOIDED" | "ALL">(
    "ACTIVE",
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Modals state
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<BusinessExpenseItem | null>(
    null,
  );
  const [voidingExpense, setVoidingExpense] = useState<BusinessExpenseItem | null>(
    null,
  );

  // Compute effective date bounds
  const { effectiveStart, effectiveEnd } = useMemo(() => {
    if (datePreset === "CUSTOM") {
      return {
        effectiveStart: customStartDate || null,
        effectiveEnd: customEndDate || null,
      };
    }
    if (datePreset === "THIS_MONTH" || datePreset === "LAST_MONTH") {
      const range = getDatePresetRange(datePreset);
      return {
        effectiveStart: range?.startDate || null,
        effectiveEnd: range?.endDate || null,
      };
    }
    return { effectiveStart: null, effectiveEnd: null };
  }, [datePreset, customStartDate, customEndDate]);

  // Extra categories present in initialExpenses not in standard sets
  const extraBusinessCategories = useMemo(() => {
    const known = new Set<string>(ALL_BUSINESS_EXPENSE_CATEGORIES);
    const extras = new Set<string>();
    initialExpenses.forEach((e) => {
      const cat = e.category;
      if (cat && !known.has(cat)) {
        extras.add(cat);
      }
    });
    return Array.from(extras).sort();
  }, [initialExpenses]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return initialExpenses.filter((exp) => {
      // Status filter
      if (statusFilter !== "ALL" && exp.status !== statusFilter) return false;

      // Date range filter
      if (effectiveStart && exp.expenseDate < effectiveStart) return false;
      if (effectiveEnd && exp.expenseDate > effectiveEnd) return false;

      // Category
      if (categoryFilter !== "ALL" && exp.category !== categoryFilter) {
        return false;
      }

      // Payment method
      if (
        paymentMethodFilter !== "ALL" &&
        exp.paymentMethod !== paymentMethodFilter
      ) {
        return false;
      }

      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchDesc = exp.description.toLowerCase().includes(q);
        const matchCat = exp.category.toLowerCase().includes(q);
        const matchNotes = exp.notes?.toLowerCase().includes(q);
        if (!matchDesc && !matchCat && !matchNotes) return false;
      }

      return true;
    });
  }, [
    initialExpenses,
    statusFilter,
    effectiveStart,
    effectiveEnd,
    categoryFilter,
    paymentMethodFilter,
    searchTerm,
  ]);

  const hasActiveFilters =
    datePreset !== "ALL" ||
    categoryFilter !== "ALL" ||
    paymentMethodFilter !== "ALL" ||
    statusFilter !== "ACTIVE" ||
    searchTerm.trim().length > 0;

  const resetFilters = () => {
    setDatePreset("ALL");
    setCustomStartDate("");
    setCustomEndDate("");
    setCategoryFilter("ALL");
    setPaymentMethodFilter("ALL");
    setStatusFilter("ACTIVE");
    setSearchTerm("");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Action Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Business Expenses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Capture general overheads not attributable to one specific car (Section 13).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AddBusinessExpenseDialog
            open={addExpenseOpen}
            onOpenChange={setAddExpenseOpen}
          />
        </div>
      </div>

      {/* Section 13.3 Summary Cards (6-card responsive grid) */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        {/* 1. Total This Month */}
        <Card className="border-border/80 shadow-xs" size="sm" data-testid="kpi-biz-month-total">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3.5 space-y-0">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              This Month
            </CardTitle>
            <div className="rounded-md bg-rose-500/10 p-1 text-rose-600 dark:text-rose-400">
              <TrendingDown className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent className="px-3.5 pb-3 pt-0">
            <div
              className="text-sm sm:text-base font-bold tracking-tight text-rose-700 dark:text-rose-400 truncate"
              title={formatAed(initialPageKpis.currentMonthTotal)}
            >
              {formatAed(initialPageKpis.currentMonthTotal)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              Active expenses
            </p>
          </CardContent>
        </Card>

        {/* 2. Top Expense Category */}
        <Card className="border-border/80 shadow-xs" size="sm" data-testid="kpi-biz-top-category">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3.5 space-y-0">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Top Category
            </CardTitle>
            <div className="rounded-md bg-primary/10 p-1 text-primary">
              <Tag className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent className="px-3.5 pb-3 pt-0">
            <div
              className="text-sm sm:text-base font-bold tracking-tight truncate"
              title={initialPageKpis.topCategoryThisMonth || "None yet"}
            >
              {initialPageKpis.topCategoryThisMonth || "None yet"}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {initialPageKpis.topCategoryAmount > 0
                ? formatAed(initialPageKpis.topCategoryAmount)
                : "No expenses"}
            </p>
          </CardContent>
        </Card>

        {/* 3. Expense-to-Revenue Ratio (%) */}
        <Card className="border-border/80 shadow-xs" size="sm" data-testid="kpi-biz-expense-to-revenue">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3.5 space-y-0">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Expense / Rev
            </CardTitle>
            <div className="rounded-md bg-purple-500/10 p-1 text-purple-600 dark:text-purple-400">
              <Percent className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent className="px-3.5 pb-3 pt-0">
            <div className="text-sm sm:text-base font-bold tracking-tight text-foreground">
              {initialPageKpis.expenseToRevenueRatio.toFixed(1)}%
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {initialPageKpis.monthlyRevenue > 0
                ? `of ${formatAed(initialPageKpis.monthlyRevenue)} rev`
                : "No revenue"}
            </p>
          </CardContent>
        </Card>

        {/* 4. Avg Daily Overhead */}
        <Card className="border-border/80 shadow-xs" size="sm" data-testid="kpi-biz-avg-daily">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3.5 space-y-0">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Daily Overhead
            </CardTitle>
            <div className="rounded-md bg-amber-500/10 p-1 text-amber-600 dark:text-amber-400">
              <Calendar className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent className="px-3.5 pb-3 pt-0">
            <div
              className="text-sm sm:text-base font-bold tracking-tight text-foreground truncate"
              title={formatAed(initialPageKpis.avgDailyOverhead)}
            >
              {formatAed(initialPageKpis.avgDailyOverhead)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              Day {initialPageKpis.daysElapsedInMonth} of month
            </p>
          </CardContent>
        </Card>

        {/* 5. Overhead Cost Per Car Purchased */}
        <Card className="border-border/80 shadow-xs" size="sm" data-testid="kpi-biz-overhead-per-car">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3.5 space-y-0">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Overhead / Car
            </CardTitle>
            <div className="rounded-md bg-blue-500/10 p-1 text-blue-600 dark:text-blue-400">
              <Car className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent className="px-3.5 pb-3 pt-0">
            <div
              className="text-sm sm:text-base font-bold tracking-tight text-foreground truncate"
              title={
                initialPageKpis.carsPurchasedThisMonthCount > 0
                  ? formatAed(initialPageKpis.overheadCostPerCarPurchased)
                  : "N/A"
              }
            >
              {initialPageKpis.carsPurchasedThisMonthCount > 0
                ? formatAed(initialPageKpis.overheadCostPerCarPurchased)
                : "N/A"}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {initialPageKpis.carsPurchasedThisMonthCount > 0
                ? `${initialPageKpis.carsPurchasedThisMonthCount} bought`
                : "0 bought"}
            </p>
          </CardContent>
        </Card>

        {/* 6. MoM Expense Growth (% Change) */}
        <Card className="border-border/80 shadow-xs" size="sm" data-testid="kpi-biz-mom-growth">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3.5 space-y-0">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              MoM Growth
            </CardTitle>
            <div
              className={`rounded-md p-1 ${
                initialPageKpis.momExpenseGrowth > 0
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  : initialPageKpis.momExpenseGrowth < 0
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {initialPageKpis.momExpenseGrowth > 0 ? (
                <TrendingUp className="size-3.5" />
              ) : (
                <TrendingDown className="size-3.5" />
              )}
            </div>
          </CardHeader>
          <CardContent className="px-3.5 pb-3 pt-0">
            <div className="text-sm sm:text-base font-bold tracking-tight flex items-center gap-1">
              {initialPageKpis.momExpenseGrowth > 0 ? (
                <span className="text-rose-600 dark:text-rose-400">
                  ↗️ +{initialPageKpis.momExpenseGrowth.toFixed(1)}%
                </span>
              ) : initialPageKpis.momExpenseGrowth < 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400">
                  ↘️ {initialPageKpis.momExpenseGrowth.toFixed(1)}%
                </span>
              ) : (
                <span className="text-muted-foreground">0.0%</span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              vs {formatAed(initialPageKpis.lastMonthTotal)} last mo.
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
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground mr-1">
              Date:
            </span>
            {(["ALL", "THIS_MONTH", "LAST_MONTH", "CUSTOM"] as const).map(
              (preset) => {
                const labels: Record<typeof preset, string> = {
                  ALL: "All Time",
                  THIS_MONTH: "This Month",
                  LAST_MONTH: "Last Month",
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

          {/* Secondary Controls: Search, Category, Method, Status */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search description, notes..."
                className="h-8 pl-8 text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <select
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                data-testid="biz-exp-category-filter"
              >
                <option value="ALL">All Categories</option>
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
                <optgroup label="Other">
                  {OTHER_EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </optgroup>
                {extraBusinessCategories.length > 0 && (
                  <optgroup label="Other Recorded">
                    {extraBusinessCategories.map((c) => (
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
                data-testid="biz-exp-method-filter"
              >
                <option value="ALL">All Payment Methods</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <select
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "ACTIVE" | "VOIDED" | "ALL")
                }
                data-testid="biz-exp-status-filter"
              >
                <option value="ACTIVE">Active Expenses Only</option>
                <option value="VOIDED">Voided Only</option>
                <option value="ALL">All Records</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Expenses Table */}
      <Card className="border-border/80 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/20">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Expense Records</h2>
            <Badge variant="outline" className="text-xs font-normal">
              {filteredExpenses.length} {filteredExpenses.length === 1 ? "record" : "records"}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">
            Section 13.3 Overhead Ledger
          </span>
        </div>

        <div className="overflow-x-auto">
          <table
            className="w-full text-left text-sm"
            data-testid="business-expenses-table"
          >
            <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
              <tr>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3 text-right">Amount (AED)</th>
                <th className="py-3 px-3">Method</th>
                <th className="py-3 px-3">Notes</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-muted-foreground text-sm"
                  >
                    No business expenses found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const isVoided = exp.status === "VOIDED";
                  const displayMethod =
                    exp.paymentMethod === "BANK_TRANSFER"
                      ? "Bank Transfer"
                      : exp.paymentMethod === "CHEQUE"
                      ? "Cheque"
                      : exp.paymentMethod === "CASH"
                      ? "Cash"
                      : "Other";

                  return (
                    <tr
                      key={exp.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        isVoided ? "opacity-60 bg-muted/10" : ""
                      }`}
                      data-testid={`biz-expense-row-${exp.id}`}
                    >
                      {/* Date */}
                      <td className="py-3 px-3 font-mono text-xs whitespace-nowrap text-muted-foreground">
                        {exp.expenseDate}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 whitespace-nowrap text-xs">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-semibold ${
                              isVoided ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            {exp.category}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1 py-0 h-4 font-normal"
                          >
                            {exp.group}
                          </Badge>
                          {isVoided && (
                            <Badge
                              variant="destructive"
                              className="text-[10px] px-1 py-0 h-4"
                            >
                              Voided
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-3 text-xs max-w-xs truncate">
                        <span
                          title={exp.description}
                          className={isVoided ? "line-through" : ""}
                        >
                          {exp.description}
                        </span>
                        {isVoided && exp.voidReason && (
                          <div className="text-[10px] text-destructive italic">
                            Void Reason: {exp.voidReason}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3 whitespace-nowrap text-right font-mono text-xs font-bold text-rose-700 dark:text-rose-400">
                        {isVoided ? (
                          <span className="line-through opacity-70">
                            {formatAed(exp.amount)}
                          </span>
                        ) : (
                          formatAed(exp.amount)
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3 px-3 whitespace-nowrap text-xs text-muted-foreground">
                        {displayMethod}
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-3 text-xs text-muted-foreground max-w-[150px] truncate">
                        {exp.notes || "—"}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 whitespace-nowrap text-right">
                        {isVoided ? (
                          <span className="text-[11px] text-muted-foreground italic">
                            Voided
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="xs"
                              className="h-7 px-2 text-xs"
                              onClick={() => setEditingExpense(exp)}
                              title="Edit expense"
                            >
                              <Edit2 className="size-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setVoidingExpense(exp)}
                              title="Void expense"
                            >
                              <Trash2 className="size-3.5 mr-1" />
                              Void
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit & Void Modals */}
      <EditBusinessExpenseDialog
        expense={editingExpense}
        open={Boolean(editingExpense)}
        onOpenChange={(open) => !open && setEditingExpense(null)}
      />

      <VoidBusinessExpenseDialog
        expense={voidingExpense}
        open={Boolean(voidingExpense)}
        onOpenChange={(open) => !open && setVoidingExpense(null)}
      />
    </div>
  );
}
