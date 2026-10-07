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
import { voidRecoveryTransactionAction } from "@/features/sales/server/sales-actions";
import { recoveryTypeLabels } from "../domain/car-details-calculations";
import type { CarRecoveryRecord } from "../domain/car-details-types";

type VoidRecoveryDialogProps = {
  recovery: CarRecoveryRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function VoidRecoveryDialog({
  recovery,
  open,
  onOpenChange,
}: VoidRecoveryDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [voidReason, setVoidReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!recovery) return null;

  const itemName = recovery.itemType
    ? `${recoveryTypeLabels[recovery.itemType] ?? recovery.itemType}${
        recovery.itemLabel ? ` - ${recovery.itemLabel}` : ""
      }`
    : "Whole Car";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (voidReason.trim().length < 3) {
      setError("Please enter a reason for cancelling this sale.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const res = await voidRecoveryTransactionAction({
        recoveryId: recovery.id,
        voidReason: voidReason.trim(),
      });
      if (res.ok) {
        toast.success("Sale cancelled. Recovery and Available Cash updated.");
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Cancel Sale / Recovery
            </DialogTitle>
            <DialogDescription>
              The sale will be marked as cancelled and its Money In entry removed
              from Finance. Recovery totals, Available Cash and the car status
              will update automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-1">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Item:</span>
              <span className="font-semibold text-right">{itemName}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Buyer:</span>
              <span className="font-medium text-right">{recovery.buyerName}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Sale Date:</span>
              <span className="font-mono">{recovery.saleDate}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-semibold text-emerald-600">
                {formatAed(recovery.amount)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 py-1">
            <Label htmlFor="void-recovery-reason">Reason for Cancelling *</Label>
            <Textarea
              id="void-recovery-reason"
              placeholder="e.g. Deal cancelled by buyer, wrong entry, duplicate"
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
              Keep Sale
            </Button>
            <Button
              id="confirm-void-recovery"
              type="submit"
              variant="destructive"
              disabled={isPending || voidReason.trim().length < 3}
            >
              {isPending ? "Cancelling..." : "Cancel Sale"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
