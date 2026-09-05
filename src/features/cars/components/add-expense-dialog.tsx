"use client";

import { useState, useTransition } from "react";
import { Plus, Receipt } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { expenseCategoryLabels } from "../domain/car-details-calculations";
import { createCarExpenseAction } from "../server/car-expense-actions";

type AddExpenseDialogProps = {
  carId: string;
  carNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddExpenseDialog({
  carId,
  carNumber,
  open,
  onOpenChange,
}: AddExpenseDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("TRANSPORT");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [notes, setNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const formData = new FormData();
    formData.append("carId", carId);
    formData.append("carNumber", carNumber);
    formData.append("expenseDate", date);
    formData.append("category", category);
    formData.append("amount", amount);
    formData.append("description", description);
    formData.append("paymentMethod", paymentMethod);
    if (notes) formData.append("notes", notes);

    startTransition(async () => {
      const result = await createCarExpenseAction(formData);
      if (result.ok) {
        toast.success("Car expense recorded successfully.");
        // Reset form
        setAmount("");
        setDescription("");
        setNotes("");
        onOpenChange(false);
      } else {
        toast.error(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="size-5 text-primary" />
              Add Car Expense ({carNumber})
            </DialogTitle>
            <DialogDescription>
              Record an operational cost for this vehicle. Total Investment and Finance Money Out will update immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3.5 py-1">
            {/* Date & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="expense-date">Expense Date *</Label>
                <Input
                  id="expense-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
                {fieldErrors.expenseDate && (
                  <p className="text-destructive text-xs">
                    {fieldErrors.expenseDate[0]}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expense-category">Category *</Label>
                <select
                  id="expense-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-3"
                  required
                >
                  {Object.entries(expenseCategoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                {fieldErrors.category && (
                  <p className="text-destructive text-xs">
                    {fieldErrors.category[0]}
                  </p>
                )}
              </div>
            </div>

            {/* Amount & Payment Method */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="expense-amount">Amount (AED) *</Label>
                <Input
                  id="expense-amount"
                  inputMode="decimal"
                  placeholder="500.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                {fieldErrors.amount && (
                  <p className="text-destructive text-xs">
                    {fieldErrors.amount[0]}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expense-payment-method">Payment Method *</Label>
                <select
                  id="expense-payment-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-3"
                  required
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="OTHER">Other</option>
                </select>
                {fieldErrors.paymentMethod && (
                  <p className="text-destructive text-xs">
                    {fieldErrors.paymentMethod[0]}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="expense-description">Description *</Label>
              <Input
                id="expense-description"
                placeholder="e.g. Recovery winch transport from Sharjah"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              {fieldErrors.description && (
                <p className="text-destructive text-xs">
                  {fieldErrors.description[0]}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="expense-notes">Notes (Optional)</Label>
              <Textarea
                id="expense-notes"
                placeholder="Additional details or invoice reference..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="gap-1.5">
              <Plus className="size-4" />
              {isPending ? "Saving expense…" : "Save Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
