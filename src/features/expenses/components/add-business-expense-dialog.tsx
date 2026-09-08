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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FINANCIAL_EXPENSE_CATEGORIES,
  FIXED_EXPENSE_CATEGORIES,
  OPERATING_EXPENSE_CATEGORIES,
  OTHER_EXPENSE_CATEGORIES,
} from "../domain/expense-types";
import { createBusinessExpenseAction } from "../server/business-expense-actions";

type AddBusinessExpenseDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerButton?: boolean;
};

export function AddBusinessExpenseDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  triggerButton = true,
}: AddBusinessExpenseDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const onOpenChange = isControlled ? controlledOnOpenChange : setInternalOpen;

  const [isPending, startTransition] = useTransition();
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [category, setCategory] = useState<string>("Shop Rent");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "BANK_TRANSFER" | "CHEQUE" | "OTHER"
  >("BANK_TRANSFER");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const formData = new FormData();
    formData.append("expenseDate", expenseDate);
    formData.append("category", category);
    formData.append("amount", amount.trim());
    formData.append("paymentMethod", paymentMethod);
    formData.append("description", description.trim());
    if (notes.trim()) formData.append("notes", notes.trim());

    startTransition(async () => {
      const res = await createBusinessExpenseAction(formData);
      if (res.ok) {
        toast.success(`Business expense recorded successfully.`);
        setAmount("");
        setDescription("");
        setNotes("");
        onOpenChange?.(false);
      } else {
        toast.error(res.message);
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {triggerButton && (
        <DialogTrigger
          render={
            <Button
              size="sm"
              className="gap-1.5 shadow-xs"
              data-testid="add-business-expense-btn"
            >
              <Plus className="size-4" />
              Add Business Expense
            </Button>
          }
        />
      )}
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="size-5 text-primary" />
              Add Business Expense
            </DialogTitle>
            <DialogDescription>
              Capture general business overheads (Section 13). Creates an automatic Money Out entry in Finance.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-1">
            {/* Date & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="biz-exp-date">Date *</Label>
                <Input
                  id="biz-exp-date"
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  required
                />
                {fieldErrors.expenseDate && (
                  <p className="text-destructive text-xs">
                    {fieldErrors.expenseDate[0]}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="biz-exp-category">Category *</Label>
                <select
                  id="biz-exp-category"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
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
                <Label htmlFor="biz-exp-amount">Amount (AED) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                    AED
                  </span>
                  <Input
                    id="biz-exp-amount"
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
                  <p className="text-destructive text-xs">
                    {fieldErrors.amount[0]}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="biz-exp-method">Payment Method *</Label>
                <select
                  id="biz-exp-method"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(
                      e.target.value as "CASH" | "BANK_TRANSFER" | "CHEQUE" | "OTHER",
                    )
                  }
                >
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="biz-exp-desc">Description / Reason *</Label>
              <Input
                id="biz-exp-desc"
                placeholder="e.g. Monthly workshop warehouse rent"
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

            {/* Notes (Optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="biz-exp-notes">Notes (Optional)</Label>
              <Textarea
                id="biz-exp-notes"
                placeholder="Additional details, invoice number, or vendor reference"
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
              onClick={() => onOpenChange?.(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !amount || !description.trim()}
            >
              {isPending ? "Recording..." : "Save Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
