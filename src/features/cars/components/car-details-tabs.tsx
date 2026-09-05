"use client";

import { useState } from "react";
import Image from "next/image";
import {
  CarFront,
  CheckCircle2,
  ExternalLink,
  History,
  ImageIcon,
  Layers,
  Plus,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAed } from "@/lib/currency";
import {
  carStatusConfig,
  expenseCategoryLabels,
  recoveryTypeLabels,
} from "../domain/car-details-calculations";
import type { CarDetailsFull } from "../domain/car-details-types";
import { AddExpenseDialog } from "./add-expense-dialog";

type CarDetailsTabsProps = {
  car: CarDetailsFull;
};

type TabKey = "overview" | "expenses" | "recovery" | "history" | "documents";

export function CarDetailsTabs({ car }: CarDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);

  const tabs: Array<{ key: TabKey; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }> = [
    { key: "overview", label: "Overview", icon: Layers },
    { key: "expenses", label: "Expenses", icon: Receipt, count: car.expenses.length },
    { key: "recovery", label: "Recovery / Sales", icon: TrendingUp, count: car.recoveries.length },
    { key: "history", label: "History", icon: History, count: car.activities.length },
    { key: "documents", label: "Documents / Photos", icon: ImageIcon, count: car.photos.length },
  ];

  return (
    <div className="space-y-4">
      {/* Tab Navigation Pill Bar */}
      <div className="flex border-b overflow-x-auto no-scrollbar gap-1">
        {tabs.map(({ key, label, icon: Icon, count }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
              }`}
            >
              <Icon className="size-4" />
              <span>{label}</span>
              {count !== undefined && count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="pt-1">
        {activeTab === "overview" && <OverviewTab car={car} />}

        {activeTab === "expenses" && (
          <ExpensesTab car={car} onAddExpense={() => setAddExpenseOpen(true)} />
        )}

        {activeTab === "recovery" && <RecoveryTab car={car} />}

        {activeTab === "history" && <HistoryTab car={car} />}

        {activeTab === "documents" && <DocumentsTab car={car} />}
      </div>

      {/* Reusable Add Expense Dialog */}
      <AddExpenseDialog
        carId={car.id}
        carNumber={car.carNumber}
        open={addExpenseOpen}
        onOpenChange={setAddExpenseOpen}
      />
    </div>
  );
}

/* =========================================================================
   1. OVERVIEW TAB
   ========================================================================= */
function OverviewTab({ car }: { car: CarDetailsFull }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        {/* Purchase Information Card */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Wallet className="size-4 text-primary" />
              Purchase Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3.5 text-sm sm:grid-cols-2">
            <DetailItem label="Purchase Date" value={car.purchaseDate} />
            <DetailItem label="Purchase Price" value={formatAed(car.purchasePrice)} isStrong />
            <DetailItem label="Seller" value={car.seller.name} />
            <DetailItem label="Source" value={car.source ? `${car.source.name} (${car.source.type})` : "Direct Walk-In"} />
            <DetailItem label="Payment Method" value={car.paymentMethod.replaceAll("_", " ")} />
            <DetailItem label="VIN / Chassis" value={car.vinChassis || "—"} />
            <DetailItem label="Year" value={car.year?.toString() || "—"} />
            <DetailItem label="Condition" value={car.conditionOther || car.condition.replaceAll("_", " ")} />
            {car.notes && (
              <div className="sm:col-span-2 border-t pt-2 text-xs">
                <p className="text-muted-foreground">Notes:</p>
                <p className="mt-0.5 text-foreground">{car.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 7.5 Recovery Progress Example & Breakdown */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-600" />
              Recovery Progress
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {car.recoveries.length} Transactions
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {car.recoveryProgress.length > 0 ? (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="h-8 text-xs font-semibold">Item</TableHead>
                      <TableHead className="h-8 text-xs font-semibold">Status</TableHead>
                      <TableHead className="h-8 text-xs font-semibold text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {car.recoveryProgress.map((item) => (
                      <TableRow key={item.id} className="h-9">
                        <TableCell className="text-xs font-medium py-1.5">
                          {recoveryTypeLabels[item.type] || item.type}
                          {item.label ? ` (${item.label})` : ""}
                        </TableCell>
                        <TableCell className="py-1.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${
                              item.status === "SOLD"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                : item.status === "CLOSED"
                                  ? "border-muted-foreground/30 bg-muted text-muted-foreground"
                                  : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                            }`}
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-right py-1.5">
                          {item.amount !== null ? formatAed(item.amount) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">
                No individual dismantle items logged for this vehicle.
              </p>
            )}

            {/* Financial Summary Table (matching Section 7.5) */}
            <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1.5 border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Purchase:</span>
                <span className="font-medium">{formatAed(car.kpis.purchase)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Car Expenses:</span>
                <span className="font-medium">{formatAed(car.kpis.expenses)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-semibold">
                <span>Total Investment:</span>
                <span>{formatAed(car.kpis.investment)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                <span>Realized Recovery:</span>
                <span>{formatAed(car.kpis.recovery)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-bold">
                <span>Realized Car Profit:</span>
                {car.kpis.isProfitPending ? (
                  <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px]">
                    Pending
                  </Badge>
                ) : (
                  <span className={(car.kpis.realizedProfit ?? 0) >= 0 ? "text-emerald-600" : "text-destructive"}>
                    {formatAed(car.kpis.realizedProfit)}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center border-t pt-1 text-xs">
                <span className="text-muted-foreground font-medium">Status:</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    carStatusConfig[car.status]?.className ?? ""
                  }`}
                >
                  {carStatusConfig[car.status]?.label ?? car.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* =========================================================================
   2. EXPENSES TAB (Section 7.3 & 7.4)
   ========================================================================= */
function ExpensesTab({
  car,
  onAddExpense,
}: {
  car: CarDetailsFull;
  onAddExpense: () => void;
}) {
  return (
    <Card className="shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold">Car Expenses</CardTitle>
          <p className="text-muted-foreground text-xs mt-0.5">
            Operational costs linked to {car.carNumber}. Total:{" "}
            <span className="font-bold text-foreground">{formatAed(car.kpis.expenses)}</span>
          </p>
        </div>
        <Button onClick={onAddExpense} size="sm" className="gap-1.5">
          <Plus className="size-4" />
          Add Expense
        </Button>
      </CardHeader>
      <CardContent>
        {car.expenses.length > 0 ? (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs font-semibold">Date</TableHead>
                  <TableHead className="text-xs font-semibold">Category</TableHead>
                  <TableHead className="text-xs font-semibold">Description</TableHead>
                  <TableHead className="text-xs font-semibold">Payment Method</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {car.expenses.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {exp.expenseDate}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[11px] font-normal">
                        {exp.categoryOther ||
                          expenseCategoryLabels[exp.category] ||
                          exp.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium max-w-xs truncate">
                      {exp.description}
                      {exp.notes && (
                        <p className="text-muted-foreground text-[10px] truncate">{exp.notes}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {exp.paymentMethod.replaceAll("_", " ")}
                    </TableCell>
                    <TableCell className="text-xs font-semibold font-mono text-right">
                      {formatAed(exp.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          exp.status === "ACTIVE"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "border-destructive/30 bg-destructive/10 text-destructive"
                        }`}
                      >
                        {exp.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-10 border border-dashed rounded-lg">
            <Receipt className="size-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">No car expenses logged yet</p>
            <p className="text-muted-foreground text-xs mt-1">
              Add transport, repair, or parts expenses to reflect true investment.
            </p>
            <Button onClick={onAddExpense} size="sm" variant="outline" className="mt-4 gap-1.5">
              <Plus className="size-4" />
              Add Expense Now
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* =========================================================================
   3. RECOVERY / SALES TAB (Section 7.3)
   ========================================================================= */
function RecoveryTab({ car }: { car: CarDetailsFull }) {
  return (
    <div className="space-y-5">
      {/* Recovery Transactions */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Sales & Recovery Transactions</CardTitle>
          <p className="text-muted-foreground text-xs mt-0.5">
            Realized cash recovery from whole car or individual part sales. Total:{" "}
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {formatAed(car.kpis.recovery)}
            </span>
          </p>
        </CardHeader>
        <CardContent>
          {car.recoveries.length > 0 ? (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs font-semibold">Sale Date</TableHead>
                    <TableHead className="text-xs font-semibold">Mode</TableHead>
                    <TableHead className="text-xs font-semibold">Item / Description</TableHead>
                    <TableHead className="text-xs font-semibold">Buyer</TableHead>
                    <TableHead className="text-xs font-semibold">Payment</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {car.recoveries.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {rec.saleDate}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {rec.mode.replaceAll("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {rec.itemType ? recoveryTypeLabels[rec.itemType] : "Whole Car"}
                        {rec.itemLabel ? ` - ${rec.itemLabel}` : ""}
                      </TableCell>
                      <TableCell className="text-xs font-medium">{rec.buyerName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {rec.paymentMethod.replaceAll("_", " ")}
                      </TableCell>
                      <TableCell className="text-xs font-semibold font-mono text-right text-emerald-600 dark:text-emerald-400">
                        {formatAed(rec.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed rounded-lg">
              <TrendingUp className="size-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">No sales or recoveries yet</p>
              <p className="text-muted-foreground text-xs mt-1">
                Record whole-car sales or individual parts sales when items are sold.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* =========================================================================
   4. HISTORY TAB (Section 7.3)
   ========================================================================= */
function HistoryTab({ car }: { car: CarDetailsFull }) {
  return (
    <Card className="shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <History className="size-4 text-primary" />
          Vehicle Timeline & Audit History
        </CardTitle>
        <p className="text-muted-foreground text-xs">
          Chronological record of purchases, expenses, sales, and status transitions.
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative border-l border-border/80 ml-3 space-y-6 py-2">
          {car.activities.map((act) => (
            <div key={act.id} className="relative pl-6">
              {/* Timeline marker icon */}
              <div className="absolute -left-2.5 top-0.5 size-5 rounded-full border bg-background flex items-center justify-center text-primary shadow-xs">
                {act.type === "PURCHASE" ? (
                  <Wallet className="size-3 text-primary" />
                ) : act.type === "EXPENSE" ? (
                  <Receipt className="size-3 text-amber-600" />
                ) : act.type === "RECOVERY" ? (
                  <TrendingUp className="size-3 text-emerald-600" />
                ) : (
                  <CheckCircle2 className="size-3 text-sky-600" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">{act.title}</span>
                  <span className="text-[11px] font-mono text-muted-foreground">{act.date}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{act.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* =========================================================================
   5. DOCUMENTS & PHOTOS TAB (Section 7.3)
   ========================================================================= */
function DocumentsTab({ car }: { car: CarDetailsFull }) {
  return (
    <div className="space-y-6">
      {/* Photos Gallery */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ImageIcon className="size-4 text-primary" />
            Vehicle Photos
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {car.photos.length} Photo{car.photos.length === 1 ? "" : "s"}
          </Badge>
        </CardHeader>
        <CardContent>
          {car.photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {car.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative aspect-4/3 overflow-hidden rounded-xl border bg-muted"
                >
                  <Image
                    src={photo.url}
                    alt={`${car.brand} ${car.model}`}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {photo.isMain && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-primary text-primary-foreground text-[10px] font-semibold shadow-xs">
                        Main Photo
                      </Badge>
                    </div>
                  )}
                  <a
                    href={photo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                  >
                    <ExternalLink className="size-5" />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed rounded-lg">
              <CarFront className="size-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">No photos uploaded</p>
              <p className="text-muted-foreground text-xs mt-1">
                Photos uploaded during purchase will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DetailItem({
  label,
  value,
  isStrong = false,
}: {
  label: string;
  value: string;
  isStrong?: boolean;
}) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={`mt-0.5 ${isStrong ? "font-semibold text-foreground" : "font-medium"}`}>
        {value}
      </p>
    </div>
  );
}
