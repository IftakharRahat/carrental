"use client";

import { useState, useTransition } from "react";
import { AlertTriangle } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatAed } from "@/lib/currency";
import type { LedgerRowItem } from "../domain/finance-types";
import { voidCashTransactionAction } from "../server/finance-actions";

type VoidCashTransactionDialogProps = {
  transaction: LedgerRowItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function VoidCashTransactionDialog({
  transaction,
  open,
  onOpenChange,
}: VoidCashTransactionDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [voidReason, setVoidReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!transaction) return null;

  const isMoneyIn = transaction.direction === "IN";
  const amount = transaction.moneyIn ?? transaction.moneyOut ?? 0;

  const handleVoid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidReason.trim()) {
      setError("Please provide a reason for voiding this transaction.");
      return;
    }
    setError(null);

    const formData = new FormData();
    formData.append("id", transaction.id);
    formData.append("voidReason", voidReason.trim());

    startTransition(async () => {
      const res = await voidCashTransactionAction(formData);
      if (res.ok) {
        toast.success("Transaction voided. Available cash recalculated.");
        setVoidReason("");
        onOpenChange(false);
      } else {
        toast.error(res.message);
        setError(res.message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <form onSubmit={handleVoid} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Void Cash Transaction
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to void this transaction? This will reverse its effect on Available Cash and synchronize the linked records.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-mono">{transaction.transactionDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category:</span>
              <span className="font-semibold">{transaction.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Flow:</span>
              <span className={isMoneyIn ? "font-semibold text-emerald-600" : "font-semibold text-rose-600"}>
                {isMoneyIn ? "Money In" : "Money Out"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span
                className={`font-semibold font-mono ${
                  isMoneyIn ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {isMoneyIn ? `+${formatAed(amount)}` : `-${formatAed(amount)}`}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground shrink-0">Description:</span>
              <span className="font-medium truncate max-w-[220px] text-right">
                {transaction.description}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 py-1">
            <Label htmlFor="void-cash-reason">Reason for Voiding *</Label>
            <Textarea
              id="void-cash-reason"
              placeholder="e.g. Duplicate entry, deal cancelled, incorrect amount"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              rows={2}
              required
              autoFocus
            />
            {error && <p className="text-destructive text-xs">{error}</p>}
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
              variant="destructive"
              disabled={isPending || !voidReason.trim()}
            >
              {isPending ? "Voiding..." : "Confirm Void"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
