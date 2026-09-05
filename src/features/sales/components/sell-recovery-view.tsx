"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CarFront,
  CheckCircle2,
  Clock,
  Layers,
  TrendingUp,
  UserPlus,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatAed } from "@/lib/currency";
import {
  calculateProjectedRecovery,
  checkCompletionEligibility,
} from "../domain/sales-calculations";
import type {
  BuyerOption,
  PaymentMethod,
  RecoveryItemType,
  RecoveryMode,
  SellCarSummary,
} from "../domain/sales-types";
import {
  paymentMethodLabels,
  recoveryItemTypeLabels,
} from "../domain/sales-types";
import {
  markCarCompletedAction,
  recordItemSaleAction,
  recordWholeCarSaleAction,
} from "../server/sales-actions";
import { QuickAddBuyerDialog } from "./quick-add-buyer-dialog";

const selectClassName =
  "border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm shadow-xs outline-none focus-visible:ring-3 transition-colors font-medium";

type SellRecoveryViewProps = {
  cars: SellCarSummary[];
  initialBuyers: BuyerOption[];
  preselectedCarId: string | null;
};

export function SellRecoveryView({
  cars,
  initialBuyers,
  preselectedCarId,
}: SellRecoveryViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Selected Car
  const [selectedCarId, setSelectedCarId] = useState<string>(
    preselectedCarId || (cars.length > 0 ? cars[0].id : ""),
  );

  // Mode Selection (8.1)
  const [mode, setMode] = useState<RecoveryMode>("WHOLE_CAR");

  // Buyers list (with ability to add new inline)
  const [buyers, setBuyers] = useState<BuyerOption[]>(initialBuyers);
  const [isBuyerDialogOpen, setIsBuyerDialogOpen] = useState(false);
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>(
    initialBuyers.length > 0 ? initialBuyers[0].id : "",
  );

  // Form Fields - Common & Whole Car (8.2)
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [wholeCarPrice, setWholeCarPrice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [notes, setNotes] = useState("");

  // Form Fields - Dismantle / Item Sale (8.3)
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [selectedItemType, setSelectedItemType] = useState<RecoveryItemType>("ENGINE");
  const [itemLabel, setItemLabel] = useState("");
  const [itemAmount, setItemAmount] = useState("");

  // Completion Warning Dialog State (8.4)
  const [isCompleteWarningOpen, setIsCompleteWarningOpen] = useState(false);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Active Selected Car Object
  const selectedCar = useMemo(() => {
    return cars.find((c) => c.id === selectedCarId) || null;
  }, [cars, selectedCarId]);

  // Handle buyer creation callback
  const handleBuyerCreated = (newBuyer: BuyerOption) => {
    setBuyers((prev) => [newBuyer, ...prev]);
    setSelectedBuyerId(newBuyer.id);
  };

  // Completion status check (8.4)
  const completionCheck = useMemo(() => {
    if (!selectedCar) return { canCompleteCleanly: true, pendingCount: 0 };
    return checkCompletionEligibility(selectedCar.pendingItems);
  }, [selectedCar]);

  // Projected Recovery for Live Breakdown (8.5)
  const projectedFinancials = useMemo(() => {
    if (!selectedCar) {
      return { projectedRecovery: 0, projectedProfit: null, isProfitPending: true };
    }

    const newAmount =
      mode === "WHOLE_CAR"
        ? Number(wholeCarPrice) || 0
        : Number(itemAmount) || 0;

    const willBeCompleted =
      mode === "WHOLE_CAR" || selectedCar.status === "COMPLETED";

    return calculateProjectedRecovery({
      currentRecovery: selectedCar.totalRecovery,
      newAmount,
      totalInvestment: selectedCar.totalInvestment,
      willBeCompleted,
    });
  }, [selectedCar, mode, wholeCarPrice, itemAmount]);

  // Handle Whole Car Sale Submit (8.2)
  const handleWholeCarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCar) return;
    setFieldErrors({});

    const formData = new FormData();
    formData.append("carId", selectedCar.id);
    formData.append("saleDate", saleDate);
    formData.append("buyerId", selectedBuyerId);
    formData.append("sellingPrice", wholeCarPrice);
    formData.append("paymentMethod", paymentMethod);
    if (notes) formData.append("notes", notes);

    startTransition(async () => {
      const result = await recordWholeCarSaleAction(formData);
      if (result.ok) {
        toast.success(`Whole car sale recorded. ${selectedCar.carNumber} is now Completed.`);
        router.push(`/cars/${result.data.carNumber}`);
      } else {
        toast.error(result.message);
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      }
    });
  };

  // Handle Item Sale Submit (8.3 & 8.4)
  const handleItemSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCar) return;
    setFieldErrors({});

    const formData = new FormData();
    formData.append("carId", selectedCar.id);
    if (selectedItemId) formData.append("itemId", selectedItemId);
    formData.append("itemType", selectedItemType);
    if (itemLabel) formData.append("itemLabel", itemLabel);
    formData.append("buyerId", selectedBuyerId);
    formData.append("saleDate", saleDate);
    formData.append("amount", itemAmount);
    formData.append("paymentMethod", paymentMethod);
    if (notes) formData.append("notes", notes);

    startTransition(async () => {
      const result = await recordItemSaleAction(formData);
      if (result.ok) {
        toast.success(`Item sale (${recoveryItemTypeLabels[selectedItemType]}) recorded.`);
        router.push(`/cars/${result.data.carNumber}`);
      } else {
        toast.error(result.message);
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      }
    });
  };

  // Handle Explicit Mark Completed Action (8.4)
  const handleConfirmMarkCompleted = () => {
    if (!selectedCar) return;
    startTransition(async () => {
      const result = await markCarCompletedAction(selectedCar.id);
      if (result.ok) {
        toast.success(`Vehicle ${selectedCar.carNumber} marked as Completed.`);
        setIsCompleteWarningOpen(false);
        router.push(`/cars/${result.data.carNumber}`);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            Sell / Recovery
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Record revenue from a whole-car sale or individual dismantled items.
          </p>
        </div>
        {selectedCar && (
          <Button
            nativeButton={false}
            render={<Link href={`/cars/${selectedCar.carNumber}`} />}
            variant="outline"
            size="sm"
            className="gap-1.5 self-start sm:self-auto"
          >
            View Car Details
            <ArrowRight className="size-3.5" />
          </Button>
        )}
      </div>

      {/* STEP 1: Global Car Selection */}
      <Card className="border-primary/20 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CarFront className="size-4 text-primary" />
                Select Vehicle *
              </CardTitle>
              <CardDescription className="text-xs">
                Choose a vehicle to record a sale or recovery transaction.
              </CardDescription>
            </div>
            {selectedCar && (
              <Badge
                variant="outline"
                className={`text-xs self-start ${
                  selectedCar.status === "COMPLETED"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : selectedCar.status === "PARTIALLY_RECOVERED"
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      : "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400"
                }`}
              >
                {selectedCar.status.replace("_", " ")}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-center">
            <div className="sm:col-span-2">
              <select
                id="select-car-input"
                aria-label="Select Car"
                value={selectedCarId}
                onChange={(e) => setSelectedCarId(e.target.value)}
                className={selectClassName}
              >
                {cars.length === 0 && (
                  <option value="" disabled>
                    No vehicles in stock
                  </option>
                )}
                {cars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.carNumber} — {c.brand} {c.model} ({c.year || "N/A"}) · {c.status.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            {selectedCar && (
              <>
                <div className="rounded-lg bg-muted/40 p-2.5 text-xs border">
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                    Total Investment
                  </span>
                  <span className="font-bold text-sm text-foreground">
                    {formatAed(selectedCar.totalInvestment)}
                  </span>
                </div>
                <div className="rounded-lg bg-muted/40 p-2.5 text-xs border">
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                    Recovered So Far
                  </span>
                  <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    {formatAed(selectedCar.totalRecovery)}
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* MAIN TWO-COLUMN SECTION */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Mode Selector & Transaction Form */}
        <div className="space-y-6 lg:col-span-2">
          {/* 8.1 Mode Selector */}
          <div role="tablist" aria-label="Sale Mode" className="grid grid-cols-2 gap-3 p-1 rounded-xl bg-muted/60 border">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "WHOLE_CAR"}
              data-testid="mode-whole-car-btn"
              onClick={() => setMode("WHOLE_CAR")}
              className={`flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                mode === "WHOLE_CAR"
                  ? "bg-background text-foreground shadow-xs border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CarFront className="size-4 shrink-0 text-primary" />
              <span>Whole Car Sale</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "ITEM"}
              data-testid="mode-dismantle-item-btn"
              onClick={() => setMode("ITEM")}
              className={`flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                mode === "ITEM"
                  ? "bg-background text-foreground shadow-xs border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Wrench className="size-4 shrink-0 text-amber-600" />
              <span>Dismantle / Item Sale</span>
            </button>
          </div>

          {/* Mode Guidance Alert */}
          <div className="rounded-lg border bg-muted/30 p-3.5 text-xs text-muted-foreground flex items-start gap-2.5">
            <Clock className="size-4 text-primary shrink-0 mt-0.5" />
            <div>
              {mode === "WHOLE_CAR" ? (
                <p>
                  <strong className="text-foreground font-semibold">Whole Car Sale (Section 8.1):</strong> Entire vehicle is sold in one transaction. Recording this sale will automatically transition {selectedCar?.carNumber} to <strong className="text-emerald-600">Completed</strong> and record money into Finance.
                </p>
              ) : (
                <p>
                  <strong className="text-foreground font-semibold">Dismantle / Item Sale (Section 8.1):</strong> Vehicle is broken down and recoveries are recorded incrementally. First item sale changes vehicle from <strong className="text-sky-600">In Stock</strong> to <strong className="text-amber-600">Partially Recovered</strong>.
                </p>
              )}
            </div>
          </div>

          {/* 8.2 WHOLE CAR SALE FORM */}
          {mode === "WHOLE_CAR" && (
            <Card className="shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  Whole Car Sale Details
                </CardTitle>
                <CardDescription className="text-xs">
                  Enter buyer, date, and final selling price in AED.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleWholeCarSubmit} className="space-y-4">
                  {/* Sale Date & Buyer */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="whole-sale-date">Sale Date *</Label>
                      <Input
                        id="whole-sale-date"
                        type="date"
                        value={saleDate}
                        onChange={(e) => setSaleDate(e.target.value)}
                        required
                      />
                      {fieldErrors.saleDate && (
                        <p className="text-destructive text-xs">{fieldErrors.saleDate[0]}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="whole-buyer-select">Buyer *</Label>
                        <button
                          type="button"
                          data-testid="quick-add-buyer-btn"
                          onClick={() => setIsBuyerDialogOpen(true)}
                          className="text-primary hover:text-primary/80 hover:underline text-xs flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <UserPlus className="size-3" />
                          + Add Buyer
                        </button>
                      </div>
                      <select
                        id="whole-buyer-select"
                        value={selectedBuyerId}
                        onChange={(e) => setSelectedBuyerId(e.target.value)}
                        className={selectClassName}
                        required
                      >
                        <option value="" disabled selected={!selectedBuyerId}>
                          {buyers.length === 0
                            ? "-- No buyers registered yet (Click + Add Buyer) --"
                            : "-- Select Buyer --"}
                        </option>
                        {buyers.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} {b.companyName ? `(${b.companyName})` : ""}
                          </option>
                        ))}
                      </select>
                      {buyers.length === 0 && (
                        <div className="flex items-center justify-between rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs text-amber-900 dark:text-amber-300">
                          <span>No buyers registered yet.</span>
                          <button
                            type="button"
                            onClick={() => setIsBuyerDialogOpen(true)}
                            className="font-semibold underline hover:text-amber-950 dark:hover:text-amber-100 cursor-pointer"
                          >
                            + Add Buyer
                          </button>
                        </div>
                      )}
                      {fieldErrors.buyerId && (
                        <p className="text-destructive text-xs">{fieldErrors.buyerId[0]}</p>
                      )}
                    </div>
                  </div>

                  {/* Selling Price & Payment Method */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="whole-selling-price">Selling Price (AED) *</Label>
                      <Input
                        id="whole-selling-price"
                        inputMode="decimal"
                        placeholder="e.g. 12000.00"
                        value={wholeCarPrice}
                        onChange={(e) => setWholeCarPrice(e.target.value)}
                        required
                      />
                      {fieldErrors.sellingPrice && (
                        <p className="text-destructive text-xs">{fieldErrors.sellingPrice[0]}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="whole-payment-method">Payment Method *</Label>
                      <select
                        id="whole-payment-method"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className={selectClassName}
                        required
                      >
                        {Object.entries(paymentMethodLabels).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <Label htmlFor="whole-notes">Notes (Optional)</Label>
                    <Textarea
                      id="whole-notes"
                      placeholder="Sale agreement number, buyer terms..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isPending || !selectedCar}
                    className="w-full sm:w-auto gap-2"
                  >
                    <CheckCircle2 className="size-4" />
                    {isPending ? "Recording Whole Car Sale..." : "Record Whole Car Sale & Complete"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* 8.3 DISMANTLE / ITEM SALE FORM */}
          {mode === "ITEM" && (
            <Card className="shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  Dismantle / Item Sale Details
                </CardTitle>
                <CardDescription className="text-xs">
                  Record sale of specific dismantled parts (Engine, Body, Gearbox, etc.).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleItemSaleSubmit} className="space-y-4">
                  {/* Item Selector */}
                  <div className="space-y-1.5">
                    <Label htmlFor="item-type-select">Item *</Label>
                    {selectedCar && selectedCar.pendingItems.length > 0 ? (
                      <select
                        id="item-type-select"
                        value={selectedItemId || selectedItemType}
                        onChange={(e) => {
                          const val = e.target.value;
                          const matchingPending = selectedCar.pendingItems.find((p) => p.id === val);
                          if (matchingPending) {
                            setSelectedItemId(matchingPending.id);
                            setSelectedItemType(matchingPending.type);
                            setItemLabel(matchingPending.label || "");
                          } else {
                            setSelectedItemId("");
                            setSelectedItemType(val as RecoveryItemType);
                          }
                        }}
                        className={selectClassName}
                        required
                      >
                        <optgroup label="Pending Dismantle Items">
                          {selectedCar.pendingItems.map((p) => (
                            <option key={p.id} value={p.id}>
                              {recoveryItemTypeLabels[p.type] || p.type} {p.label ? `(${p.label})` : ""} · Pending
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Other Standard Items">
                          {Object.entries(recoveryItemTypeLabels).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    ) : (
                      <select
                        id="item-type-select"
                        value={selectedItemType}
                        onChange={(e) => setSelectedItemType(e.target.value as RecoveryItemType)}
                        className={selectClassName}
                        required
                      >
                        {Object.entries(recoveryItemTypeLabels).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    )}
                    {fieldErrors.itemType && (
                      <p className="text-destructive text-xs">{fieldErrors.itemType[0]}</p>
                    )}
                  </div>

                  {/* Buyer & Date */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="item-buyer-select">Buyer *</Label>
                        <button
                          type="button"
                          onClick={() => setIsBuyerDialogOpen(true)}
                          className="text-primary hover:text-primary/80 hover:underline text-xs flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <UserPlus className="size-3" />
                          + Add Buyer
                        </button>
                      </div>
                      <select
                        id="item-buyer-select"
                        value={selectedBuyerId}
                        onChange={(e) => setSelectedBuyerId(e.target.value)}
                        className={selectClassName}
                        required
                      >
                        <option value="" disabled selected={!selectedBuyerId}>
                          {buyers.length === 0
                            ? "-- No buyers registered yet (Click + Add Buyer) --"
                            : "-- Select Buyer --"}
                        </option>
                        {buyers.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} {b.companyName ? `(${b.companyName})` : ""}
                          </option>
                        ))}
                      </select>
                      {buyers.length === 0 && (
                        <div className="flex items-center justify-between rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs text-amber-900 dark:text-amber-300">
                          <span>No buyers registered yet.</span>
                          <button
                            type="button"
                            onClick={() => setIsBuyerDialogOpen(true)}
                            className="font-semibold underline hover:text-amber-950 dark:hover:text-amber-100 cursor-pointer"
                          >
                            + Add Buyer
                          </button>
                        </div>
                      )}
                      {fieldErrors.buyerId && (
                        <p className="text-destructive text-xs">{fieldErrors.buyerId[0]}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="item-sale-date">Sale Date *</Label>
                      <Input
                        id="item-sale-date"
                        type="date"
                        value={saleDate}
                        onChange={(e) => setSaleDate(e.target.value)}
                        required
                      />
                      {fieldErrors.saleDate && (
                        <p className="text-destructive text-xs">{fieldErrors.saleDate[0]}</p>
                      )}
                    </div>
                  </div>

                  {/* Amount & Payment Method */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="item-amount">Amount (AED) *</Label>
                      <Input
                        id="item-amount"
                        inputMode="decimal"
                        placeholder="e.g. 4000.00"
                        value={itemAmount}
                        onChange={(e) => setItemAmount(e.target.value)}
                        required
                      />
                      {fieldErrors.amount && (
                        <p className="text-destructive text-xs">{fieldErrors.amount[0]}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="item-payment-method">Payment Method *</Label>
                      <select
                        id="item-payment-method"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className={selectClassName}
                        required
                      >
                        {Object.entries(paymentMethodLabels).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <Label htmlFor="item-notes">Notes (Optional)</Label>
                    <Textarea
                      id="item-notes"
                      placeholder="Part serial number, scrap yard weight, condition..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                    <Button
                      type="submit"
                      disabled={isPending || !selectedCar}
                      className="gap-2"
                    >
                      <CheckCircle2 className="size-4" />
                      {isPending ? "Recording Sale..." : "Record Item Sale"}
                    </Button>

                    {/* Section 8.4 Explicit Completion Button */}
                    {selectedCar && selectedCar.status !== "COMPLETED" && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (completionCheck.canCompleteCleanly) {
                            handleConfirmMarkCompleted();
                          } else {
                            setIsCompleteWarningOpen(true);
                          }
                        }}
                        disabled={isPending}
                        className="text-xs gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      >
                        <CheckCircle2 className="size-3.5" />
                        Mark Car as Completed
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right 1 Column: Section 8.5 Recovery Progress & Financial Breakdown */}
        <div className="space-y-5">
          {selectedCar ? (
            <Card className="shadow-xs">
              <CardHeader className="pb-3" data-testid="live-recovery-summary-card">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="size-4 text-emerald-600" />
                  Live Recovery Summary
                </CardTitle>
                <CardDescription className="text-xs">
                  Section 8.5 recovery summary and projected profit calculation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Vehicle Thumbnail & ID */}
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 border">
                  {selectedCar.mainPhotoUrl ? (
                    <div className="relative size-12 shrink-0 rounded-md overflow-hidden border">
                      <Image
                        src={selectedCar.mainPhotoUrl}
                        alt={selectedCar.brand}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="size-12 shrink-0 rounded-md bg-muted flex items-center justify-center border">
                      <CarFront className="size-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {selectedCar.brand} {selectedCar.model}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {selectedCar.carNumber} · {selectedCar.condition}
                    </p>
                  </div>
                </div>

                {/* Section 8.5 Financial Breakdown Strip */}
                <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-2 border">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purchase:</span>
                    <span className="font-medium">{formatAed(selectedCar.purchasePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Car Expenses:</span>
                    <span className="font-medium">{formatAed(selectedCar.totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1 font-semibold">
                    <span>Total Investment:</span>
                    <span>{formatAed(selectedCar.totalInvestment)}</span>
                  </div>

                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Current Recovery:</span>
                    <span>{formatAed(selectedCar.totalRecovery)}</span>
                  </div>

                  {/* Projected Recovery if user enters an amount */}
                  {(Number(wholeCarPrice) > 0 || Number(itemAmount) > 0) && (
                    <div className="flex justify-between text-primary font-semibold border-t border-dashed pt-1">
                      <span>Projected Recovery:</span>
                      <span>{formatAed(projectedFinancials.projectedRecovery)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center border-t pt-1.5 font-bold">
                    <span>Realized Car Profit:</span>
                    {projectedFinancials.isProfitPending ? (
                      <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px]">
                        Pending
                      </Badge>
                    ) : (
                      <span className={(projectedFinancials.projectedProfit ?? 0) >= 0 ? "text-emerald-600 font-bold" : "text-destructive font-bold"}>
                        {formatAed(projectedFinancials.projectedProfit)}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center border-t pt-1.5 text-xs">
                    <span className="text-muted-foreground font-medium">Status:</span>
                    <Badge variant="outline" className="text-[10px]">
                      {mode === "WHOLE_CAR" ? "Completed (Post-Sale)" : selectedCar.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>

                {/* Dismantle Items Status List */}
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Layers className="size-3.5 text-muted-foreground" />
                    Pending Dismantle Items ({selectedCar.pendingItemsCount})
                  </p>
                  {selectedCar.pendingItems.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedCar.pendingItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-md border bg-background p-2 text-xs"
                        >
                          <span className="font-medium">
                            {recoveryItemTypeLabels[item.type] || item.type}
                            {item.label ? ` (${item.label})` : ""}
                          </span>
                          <Badge variant="outline" className="text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                            Pending
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No unresolved pending items for this vehicle.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-xs p-6 text-center text-muted-foreground text-xs">
              Select a vehicle to view financial details.
            </Card>
          )}
        </div>
      </div>

      {/* Quick Add Buyer Dialog */}
      <QuickAddBuyerDialog
        open={isBuyerDialogOpen}
        onOpenChange={setIsBuyerDialogOpen}
        onBuyerCreated={handleBuyerCreated}
      />

      {/* Section 8.4 Completion Warning Dialog */}
      <Dialog open={isCompleteWarningOpen} onOpenChange={setIsCompleteWarningOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="size-5" />
              Pending Items Warning
            </DialogTitle>
            <DialogDescription>
              {selectedCar?.carNumber} still has{" "}
              <strong>{completionCheck.pendingCount} pending dismantle item(s)</strong>.
              According to Section 8.4, vehicles are typically marked completed only after all required items are resolved.
            </DialogDescription>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Are you sure you want to mark this vehicle cycle as Completed now?
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCompleteWarningOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmMarkCompleted}
              disabled={isPending}
            >
              {isPending ? "Completing..." : "Confirm & Mark Completed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
