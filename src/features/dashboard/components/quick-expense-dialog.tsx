"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Briefcase,
  CarFront,
  DollarSign,
  PlusCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { createBusinessExpenseAction } from "@/features/expenses/server/business-expense-actions";
import { createCarExpenseAction } from "@/features/cars/server/car-expense-actions";
import type { ActiveCarOption } from "../domain/dashboard-types";

type QuickExpenseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCars: ActiveCarOption[];
};

const BIZ_CATEGORIES = [
  "RENT",
  "UTILITIES",
  "TRANSPORT",
  "TOOLS",
  "SALARY",
  "MARKETING",
  "LEGAL",
  "OFFICE",
  "OTHER",
];

const CAR_CATEGORIES = [
  "TOWING",
  "REPAIR",
  "PARTS",
  "CLEANING",
  "INSPECTION",
  "AUCTION_FEE",
  "OTHER",
];

export function QuickExpenseDialog({
  open,
  onOpenChange,
  activeCars,
}: QuickExpenseDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [expenseType, setExpenseType] = useState<"BUSINESS" | "CAR">("BUSINESS");
  const [selectedCarId, setSelectedCarId] = useState<string>(
    activeCars[0]?.id || "",
  );
  const [amount, setAmount] = useState<string>("");
  const [expenseDate, setExpenseDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [category, setCategory] = useState<string>("RENT");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [description, setDescription] = useState<string>("");

  if (!open) return null;

  const handleTypeChange = (type: "BUSINESS" | "CAR") => {
    setExpenseType(type);
    setCategory(type === "BUSINESS" ? "RENT" : "TOWING");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid expense amount.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("amount", amount);
      formData.set("expenseDate", expenseDate);
      formData.set("category", category);
      formData.set("paymentMethod", paymentMethod);
      formData.set("description", description || `${expenseType} Expense`);

      if (expenseType === "CAR") {
        const car = activeCars.find((c) => c.id === selectedCarId);
        if (!car) {
          toast.error("Please select a valid car.");
          return;
        }
        formData.set("carId", car.id);
        formData.set("carNumber", String(car.carNumber));

        const res = await createCarExpenseAction(formData);
        if (res.ok) {
          toast.success(`Car expense of AED ${amount} recorded for Car #${car.carNumber}!`);
          onOpenChange(false);
          router.refresh();
        } else {
          toast.error(res.message || "Failed to save car expense.");
        }
      } else {
        const res = await createBusinessExpenseAction(formData);
        if (res.ok) {
          toast.success(`Business expense of AED ${amount} recorded!`);
          onOpenChange(false);
          router.refresh();
        } else {
          toast.error(res.message || "Failed to save business expense.");
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-card relative w-full max-w-lg rounded-2xl border p-6 shadow-2xl">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="text-muted-foreground hover:text-foreground absolute right-4 top-4 rounded-lg p-1.5 transition-colors cursor-pointer"
        >
          <X className="size-5" />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
            <PlusCircle className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Record Expense</h2>
            <p className="text-muted-foreground text-xs">
              Quickly record a business overhead or car investment
            </p>
          </div>
        </div>

        {/* Expense Type Toggle */}
        <div className="bg-muted mb-5 grid grid-cols-2 gap-1 rounded-xl p-1">
          <button
            type="button"
            onClick={() => handleTypeChange("BUSINESS")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
              expenseType === "BUSINESS"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Briefcase className="size-3.5" />
            <span>Business Expense</span>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange("CAR")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
              expenseType === "CAR"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CarFront className="size-3.5" />
            <span>Car Expense</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* If Car Expense: Car Picker */}
          {expenseType === "CAR" && (
            <div>
              <label className="text-muted-foreground mb-1 block text-xs font-medium">
                Select Vehicle
              </label>
              {activeCars.length > 0 ? (
                <select
                  value={selectedCarId}
                  onChange={(e) => setSelectedCarId(e.target.value)}
                  className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
                >
                  {activeCars.map((car) => (
                    <option key={car.id} value={car.id}>
                      #{car.carNumber} — {car.brand} {car.model} ({car.status})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-destructive text-xs">
                  No active stock cars available. Please add a car first.
                </p>
              )}
            </div>
          )}

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-muted-foreground mb-1 block text-xs font-medium">
                Amount (AED) *
              </label>
              <div className="relative">
                <DollarSign className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                <input
                  type="number"
                  step="any"
                  required
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-background w-full rounded-lg border py-2 pl-9 pr-3 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-muted-foreground mb-1 block text-xs font-medium">
                Expense Date *
              </label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-muted-foreground mb-1 block text-xs font-medium">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-background w-full rounded-lg border px-3 py-2 text-sm capitalize"
              >
                {(expenseType === "BUSINESS" ? BIZ_CATEGORIES : CAR_CATEGORIES).map(
                  (cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace("_", " ")}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label className="text-muted-foreground mb-1 block text-xs font-medium">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-muted-foreground mb-1 block text-xs font-medium">
              Description / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Workshop supplies, Tow truck from auction..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                router.push("/expenses");
              }}
              className="text-muted-foreground hover:text-primary text-xs underline cursor-pointer"
            >
              Go to Full Expenses Page →
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="hover:bg-muted rounded-lg border px-4 py-2 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || (expenseType === "CAR" && activeCars.length === 0)}
                className="bg-primary text-primary-foreground hover:brightness-110 flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {isPending ? "Recording…" : "Save Expense"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
