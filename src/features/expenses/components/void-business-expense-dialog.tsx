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
import type { BusinessExpenseItem } from "../domain/expense-types";
import { voidBusinessExpenseAction } from "../server/business-expense-actions";

type VoidBusinessExpenseDialogProps = {
  expense: BusinessExpenseItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function VoidBusinessExpenseDialog({
  expense,
  open,
  onOpenChange,
}: VoidBusinessExpenseDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [voidReason, setVoidReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!expense) return null;

  const handleVoid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidReason.trim()) {
      setError("Please provide a reason for voiding this expense.");
      return;
    }
    setError(null);

    const formData = new FormData();
    formData.append("id", expense.id);
    formData.append("voidReason", voidReason.trim());

    startTransition(async () => {
      const res = await voidBusinessExpenseAction(formData);
      if (res.ok) {
        toast.success(`Expense voided. Finance cash ledger updated.`);
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
      <DialogContent className="sm:max-w-[420px]">
        <form onSubmit={handleVoid} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Void Business Expense
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to void this expense? This action automatically cancels the corresponding Money Out entry in Finance.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category:</span>
              <span className="font-semibold">{expense.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-semibold text-rose-600">
                {formatAed(expense.amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Description:</span>
              <span className="font-medium truncate max-w-[200px]">
                {expense.description}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 py-1">
            <Label htmlFor="void-reason">Reason for Voiding *</Label>
            <Textarea
              id="void-reason"
              placeholder="e.g. Duplicate entry, incorrect amount, refunded payment"
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
