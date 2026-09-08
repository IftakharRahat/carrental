"use client";

import { useState, useTransition } from "react";
import { ArrowDownLeft, ArrowUpRight, Plus, Receipt } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CustomCategoryItem } from "../domain/finance-types";
import { recordManualTransactionAction } from "../server/finance-actions";
import { AddCategoryDialog } from "./add-category-dialog";

type ManualTransactionDialogProps = {
  customCategories: CustomCategoryItem[];
  availableCars: Array<{
    id: string;
    carNumber: number;
    brand: string;
    model: string;
    year: number | null;
  }>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerButton?: boolean;
};

const STANDARD_MANUAL_IN_CATEGORIES = [
  "Other Income",
  "Capital Injection",
];

const STANDARD_MANUAL_OUT_CATEGORIES = [
  "Car Expenses",
  "Business Expenses",
  "Commission",
  "Other",
  "Capital Withdrawal",
];

export function ManualTransactionDialog({
  customCategories,
  availableCars,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  triggerButton = true,
}: ManualTransactionDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const onOpenChange = isControlled ? controlledOnOpenChange : setInternalOpen;

  const [isPending, startTransition] = useTransition();
  const [direction, setDirection] = useState<"IN" | "OUT">("IN");
  const [category, setCategory] = useState<string>("Other Income");
  const [amount, setAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "BANK_TRANSFER" | "CHEQUE" | "OTHER"
  >("CASH");
  const [carId, setCarId] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Sub-dialog for adding custom category directly from here
  const [addCatOpen, setAddCatOpen] = useState(false);

  // Available categories based on direction
  const relevantCustom = customCategories.filter(
    (c) => c.direction === direction,
  );
  const standardCategories =
    direction === "IN"
      ? STANDARD_MANUAL_IN_CATEGORIES
      : STANDARD_MANUAL_OUT_CATEGORIES;

  const handleDirectionChange = (newDir: "IN" | "OUT") => {
    setDirection(newDir);
    setCategory(newDir === "IN" ? "Other Income" : "Business Expenses");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const formData = new FormData();
    formData.append("direction", direction);
    formData.append("category", category);
    formData.append("amount", amount.trim());
    formData.append("transactionDate", transactionDate);
    formData.append("paymentMethod", paymentMethod);
    if (carId) formData.append("carId", carId);
    formData.append("description", description.trim());

    startTransition(async () => {
      const res = await recordManualTransactionAction(formData);
      if (res.ok) {
        toast.success(
          `${direction === "IN" ? "Money In" : "Money Out"} recorded successfully.`,
        );
        setAmount("");
        setDescription("");
        setCarId("");
        onOpenChange?.(false);
      } else {
        toast.error(res.message);
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
      }
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {triggerButton && (
          <DialogTrigger
            render={
              <Button
                size="sm"
                className="gap-1.5 shadow-xs"
                data-testid="record-transaction-btn"
              >
                <Plus className="size-4" />
                Record Transaction
              </Button>
            }
          />
        )}
        <DialogContent className="sm:max-w-[520px]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="size-5 text-primary" />
                Record Financial Transaction
              </DialogTitle>
              <DialogDescription>
                Manual ledger adjustment or entry (Section 12.5 Controls & Integrity).
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-1">
              {/* Direction Toggle */}
              <div className="space-y-1.5">
                <Label>Transaction Flow *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDirectionChange("IN")}
                    className={`flex items-center justify-center gap-1.5 rounded-md border p-2.5 text-sm font-semibold transition-colors ${
                      direction === "IN"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : "border-input bg-transparent text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <ArrowDownLeft className="size-4" />
                    Money In
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirectionChange("OUT")}
                    className={`flex items-center justify-center gap-1.5 rounded-md border p-2.5 text-sm font-semibold transition-colors ${
                      direction === "OUT"
                        ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                        : "border-input bg-transparent text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <ArrowUpRight className="size-4" />
                    Money Out
                  </button>
                </div>
              </div>

              {/* Category Selection + Add New Category shortcut */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tx-category">Category *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="h-6 text-xs text-primary gap-1"
                    onClick={() => setAddCatOpen(true)}
                  >
                    <Plus className="size-3" />
                    New Category
                  </Button>
                </div>
                <select
                  id="tx-category"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <optgroup label="Standard Categories">
                    {standardCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </optgroup>
                  {relevantCustom.length > 0 && (
                    <optgroup label="Custom Categories">
                      {relevantCustom.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                {fieldErrors.category && (
                  <p className="text-destructive text-xs">{fieldErrors.category[0]}</p>
                )}
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="tx-amount">Amount (AED) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                      AED
                    </span>
                    <Input
                      id="tx-amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      className="pl-11"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                  {fieldErrors.amount && (
                    <p className="text-destructive text-xs">{fieldErrors.amount[0]}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tx-date">Date *</Label>
                  <Input
                    id="tx-date"
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    required
                  />
                  {fieldErrors.transactionDate && (
                    <p className="text-destructive text-xs">
                      {fieldErrors.transactionDate[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Payment Method & Associated Car */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="tx-method">Payment Method *</Label>
                  <select
                    id="tx-method"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(
                        e.target.value as "CASH" | "BANK_TRANSFER" | "CHEQUE" | "OTHER",
                      )
                    }
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tx-car">Linked Car (Optional)</Label>
                  <select
                    id="tx-car"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={carId}
                    onChange={(e) => setCarId(e.target.value)}
                  >
                    <option value="">None / General</option>
                    {availableCars.map((car) => (
                      <option key={car.id} value={car.id}>
                        CAR-{car.carNumber} ({car.brand} {car.model})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mandatory Description / Reason */}
              <div className="space-y-1.5">
                <Label htmlFor="tx-desc">Description / Reason *</Label>
                <Textarea
                  id="tx-desc"
                  placeholder="Mandatory explanation for audit integrity (e.g. Owner capital deposit, Workshop repair supplies)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Section 12.5: Mandatory reason required for ledger transparency.
                </p>
                {fieldErrors.description && (
                  <p className="text-destructive text-xs">
                    {fieldErrors.description[0]}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange?.(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !amount || !description.trim()}>
                {isPending ? "Recording..." : "Record Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Embedded Add Category Dialog for fast creation */}
      <AddCategoryDialog
        open={addCatOpen}
        onOpenChange={setAddCatOpen}
        triggerButton={false}
        defaultDirection={direction}
        onSuccess={(newCat) => {
          setCategory(newCat.name);
        }}
      />
    </>
  );
}
