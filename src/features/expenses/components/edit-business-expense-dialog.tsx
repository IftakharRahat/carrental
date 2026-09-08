"use client";

import { useState, useTransition } from "react";
import { Edit2 } from "lucide-react";
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
import type { PaymentMethod } from "@/features/sales/domain/sales-types";
import {
  FINANCIAL_EXPENSE_CATEGORIES,
  FIXED_EXPENSE_CATEGORIES,
  OPERATING_EXPENSE_CATEGORIES,
  OTHER_EXPENSE_CATEGORIES,
  type BusinessExpenseItem,
} from "../domain/expense-types";
import { updateBusinessExpenseAction } from "../server/business-expense-actions";

type EditBusinessExpenseDialogProps = {
  expense: BusinessExpenseItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function EditBusinessExpenseForm({
  expense,
  onOpenChange,
}: {
  expense: BusinessExpenseItem;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [expenseDate, setExpenseDate] = useState(expense.expenseDate);
  const [category, setCategory] = useState(expense.category);
  const [amount, setAmount] = useState(String(expense.amount));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    expense.paymentMethod,
  );
  const [description, setDescription] = useState(expense.description);
  const [notes, setNotes] = useState(expense.notes || "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const formData = new FormData();
    formData.append("id", expense.id);
    formData.append("expenseDate", expenseDate);
    formData.append("category", category);
    formData.append("amount", amount.trim());
    formData.append("paymentMethod", paymentMethod);
    formData.append("description", description.trim());
    if (notes.trim()) formData.append("notes", notes.trim());

    startTransition(async () => {
      const res = await updateBusinessExpenseAction(formData);
      if (res.ok) {
        toast.success(`Business expense updated successfully.`);
        onOpenChange(false);
      } else {
        toast.error(res.message);
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Edit2 className="size-5 text-primary" />
          Edit Business Expense
        </DialogTitle>
        <DialogDescription>
          Update business expense details. Keeps linked Finance transactions synchronized.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-3 py-1">
        {/* Date & Category */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-biz-exp-date">Date *</Label>
            <Input
              id="edit-biz-exp-date"
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
            <Label htmlFor="edit-biz-exp-category">Category *</Label>
            <select
              id="edit-biz-exp-category"
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
            <Label htmlFor="edit-biz-exp-amount">Amount (AED) *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                AED
              </span>
              <Input
                id="edit-biz-exp-amount"
                type="number"
                step="0.01"
                min="0.01"
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
            <Label htmlFor="edit-biz-exp-method">Payment Method *</Label>
            <select
              id="edit-biz-exp-method"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(
                  e.target.value as PaymentMethod,
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
          <Label htmlFor="edit-biz-exp-desc">Description / Reason *</Label>
          <Input
            id="edit-biz-exp-desc"
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
          <Label htmlFor="edit-biz-exp-notes">Notes (Optional)</Label>
          <Textarea
            id="edit-biz-exp-notes"
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
        <Button
          type="submit"
          disabled={isPending || !amount || !description.trim()}
        >
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function EditBusinessExpenseDialog({
  expense,
  open,
  onOpenChange,
}: EditBusinessExpenseDialogProps) {
  if (!expense) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <EditBusinessExpenseForm
          key={expense.id}
          expense={expense}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}
