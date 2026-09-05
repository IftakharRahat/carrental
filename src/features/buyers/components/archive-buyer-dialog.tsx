"use client";

import { useTransition } from "react";
import { AlertTriangle, Archive, Trash2, Undo } from "lucide-react";
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
import type { BuyerListItem } from "../domain/buyer-types";
import { deleteBuyerAction, toggleBuyerActiveAction } from "../server/buyer-actions";

type ArchiveBuyerDialogProps = {
  buyer: BuyerListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function ArchiveBuyerDialog({
  buyer,
  open,
  onOpenChange,
  onSuccess,
}: ArchiveBuyerDialogProps) {
  const [isPending, startTransition] = useTransition();

  if (!buyer) return null;

  const hasTransactions = buyer.kpis.totalPurchasesCount > 0;

  const handleToggleArchive = () => {
    startTransition(async () => {
      const res = await toggleBuyerActiveAction(buyer.id, !buyer.isActive);
      if (res.ok) {
        toast.success(
          `Buyer "${buyer.name}" ${res.data.isActive ? "restored to active" : "archived"}.`,
        );
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteBuyerAction(buyer.id);
      if (res.ok) {
        toast.success(`Buyer "${buyer.name}" permanently deleted.`);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            {hasTransactions ? (
              <Archive className="size-5 text-amber-600" />
            ) : (
              <AlertTriangle className="size-5 text-destructive" />
            )}
            {buyer.isActive ? "Archive Buyer" : "Restore Buyer"}
          </DialogTitle>
          <DialogDescription>
            Manage visibility and records for <strong className="text-foreground">{buyer.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 text-xs space-y-3">
          {hasTransactions ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-900 dark:text-amber-300 space-y-1.5">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="size-4 shrink-0 text-amber-600" />
                Section 11.3 Rule: Cannot Be Hard-Deleted
              </p>
              <p>
                This buyer has <strong>{buyer.kpis.totalPurchasesCount} recorded transaction(s)</strong>.
                To preserve complete audit and financial integrity, this record cannot be permanently deleted.
              </p>
              <p>
                Archiving will hide this buyer from future sale forms while keeping all historical recovery receipts intact.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/40 p-3 text-muted-foreground space-y-1.5">
              <p>
                This buyer has no recorded transactions. You can safely archive them or delete them permanently.
              </p>
            </div>
          )}
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

          {/* If no transactions, allow permanent deletion */}
          {!hasTransactions && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
              className="gap-1.5"
            >
              <Trash2 className="size-3.5" />
              {isPending ? "Deleting..." : "Delete Permanently"}
            </Button>
          )}

          {/* Toggle Archive / Restore */}
          <Button
            type="button"
            variant={buyer.isActive ? "default" : "outline"}
            onClick={handleToggleArchive}
            disabled={isPending}
            className="gap-1.5"
          >
            {buyer.isActive ? (
              <>
                <Archive className="size-3.5" />
                {isPending ? "Archiving..." : "Archive Buyer"}
              </>
            ) : (
              <>
                <Undo className="size-3.5" />
                {isPending ? "Restoring..." : "Restore to Active"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
