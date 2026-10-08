"use client";

import { useEffect, useState, useTransition } from "react";
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
import type { LedgerRowItem } from "../domain/finance-types";
import { updateCashTransactionAction } from "../server/finance-actions";

type EditCashTransactionDialogProps = {
  transaction: LedgerRowItem | null;
  availableCars: Array<{
    id: string;
    carNumber: number;
    brand: string;
    model: string;
  }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditCashTransactionDialog({
  transaction,
  availableCars,
  open,
  onOpenChange,
}: EditCashTransactionDialogProps) {
  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <EditCashTransactionForm
          key={transaction.id}
          transaction={transaction}
          availableCars={availableCars}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}

function EditCashTransactionForm({
  transaction,
  availableCars,
  onOpenChange,
}: {
  transaction: LedgerRowItem;
  availableCars: Array<{
    id: string;
    carNumber: number;
    brand: string;
    model: string;
  }>;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const initialAmount = String(
    transaction.moneyIn ?? transaction.moneyOut ?? "",
  );

  const [transactionDate, setTransactionDate] = useState(
    transaction.transactionDate,
  );
  const [amount, setAmount] = useState(initialAmount);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    transaction.paymentMethod,
  );
  const [description, setDescription] = useState(transaction.description);
  const [category, setCategory] = useState(
    transaction.customCategory || transaction.category,
  );
  const [carId, setCarId] = useState(transaction.carId || "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    setTransactionDate(transaction.transactionDate);
    setAmount(String(transaction.moneyIn ?? transaction.moneyOut ?? ""));
    setPaymentMethod(transaction.paymentMethod);
    setDescription(transaction.description);
    setCategory(transaction.customCategory || transaction.category);
    setCarId(transaction.carId || "");
  }, [transaction]);

  const isMoneyIn = transaction.direction === "IN";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const formData = new FormData();
    formData.append("id", transaction.id);
    formData.append("transactionDate", transactionDate);
    formData.append("amount", amount.trim());
    formData.append("paymentMethod", paymentMethod);
    formData.append("description", description.trim());
    if (category.trim()) formData.append("category", category.trim());
    if (carId.trim()) formData.append("carId", carId.trim());

    startTransition(async () => {
      const res = await updateCashTransactionAction(formData);
      if (res.ok) {
        toast.success("Transaction updated successfully.");
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
          Edit Cash Transaction
        </DialogTitle>
        <DialogDescription>
          Update transaction details. Linked records and Available Cash will recalculate automatically.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-3 py-1">
        {/* Flow & Reference summary */}
        <div className="flex items-center justify-between text-xs rounded-md bg-muted/40 p-2.5 border">
          <span className="text-muted-foreground">
            Type:{" "}
            <span
              className={
                isMoneyIn
                  ? "font-semibold text-emerald-600"
                  : "font-semibold text-rose-600"
              }
            >
              {isMoneyIn ? "Money In" : "Money Out"}
            </span>
          </span>
          <span className="text-muted-foreground font-mono">
            Ref: {transaction.carNumber ? `CAR-${transaction.carNumber}` : transaction.referenceType}
          </span>
        </div>

        {/* Date & Amount */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-tx-date">Date *</Label>
            <Input
              id="edit-tx-date"
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

          <div className="space-y-1.5">
            <Label htmlFor="edit-tx-amount">Amount (AED) *</Label>
            <Input
              id="edit-tx-amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
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
        </div>

        {/* Payment Method & Category */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-tx-method">Payment Method *</Label>
            <select
              id="edit-tx-method"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as PaymentMethod)
              }
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

          <div className="space-y-1.5">
            <Label htmlFor="edit-tx-category">Category</Label>
            <Input
              id="edit-tx-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Parts Sale, Rent"
            />
            {fieldErrors.category && (
              <p className="text-destructive text-xs">
                {fieldErrors.category[0]}
              </p>
            )}
          </div>
        </div>

        {/* Associated Car */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-tx-car">Associated Vehicle (Optional)</Label>
          <select
            id="edit-tx-car"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={carId}
            onChange={(e) => setCarId(e.target.value)}
          >
            <option value="">No Vehicle Associated</option>
            {availableCars.map((car) => (
              <option key={car.id} value={car.id}>
                CAR-{car.carNumber} ({car.brand} {car.model})
              </option>
            ))}
          </select>
          {fieldErrors.carId && (
            <p className="text-destructive text-xs">
              {fieldErrors.carId[0]}
            </p>
          )}
        </div>

        {/* Description / Reason */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-tx-desc">Description / Reason *</Label>
          <Textarea
            id="edit-tx-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Details of the payment or cash entry"
            required
          />
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
          onClick={() => onOpenChange(false)}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}
