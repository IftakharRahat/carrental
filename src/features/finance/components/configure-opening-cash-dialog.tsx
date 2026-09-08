"use client";

import { useState, useTransition } from "react";
import { Landmark, Settings } from "lucide-react";
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
import { configureOpeningCashAction } from "../server/finance-actions";

type ConfigureOpeningCashDialogProps = {
  currentOpeningCash: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerButton?: boolean;
};

export function ConfigureOpeningCashDialog({
  currentOpeningCash,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  triggerButton = true,
}: ConfigureOpeningCashDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const onOpenChange = isControlled ? controlledOnOpenChange : setInternalOpen;

  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState(
    currentOpeningCash > 0 ? String(currentOpeningCash) : "0",
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const formData = new FormData();
    formData.append("amount", amount.trim());

    startTransition(async () => {
      const res = await configureOpeningCashAction(formData);
      if (res.ok) {
        toast.success(`Opening Cash updated to AED ${res.data.amount}`);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      {triggerButton && (
        <DialogTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 shadow-xs"
              data-testid="configure-opening-cash-btn"
            >
              <Settings className="size-3.5" />
              Configure Opening Cash
            </Button>
          }
        />
      )}
      <DialogContent className="sm:max-w-[440px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="size-5 text-primary" />
              Configure Opening Cash
            </DialogTitle>
            <DialogDescription>
              Set the starting cash/bank balance for your ledger calculations.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground border">
            <p className="font-semibold text-foreground mb-1">
              Section 12 Core Cash Formula:
            </p>
            <p className="font-mono text-xs">
              Available Cash = Opening Cash + Money In - Money Out
            </p>
            <p className="mt-1 text-[11px]">
              Stock Value is strictly excluded from cash balance. All chronological running balances recalculate from this base amount.
            </p>
          </div>

          <div className="space-y-1.5 py-1">
            <Label htmlFor="opening-cash-amount">Opening Balance (AED) *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                AED
              </span>
              <Input
                id="opening-cash-amount"
                type="number"
                step="0.01"
                min="0"
                className="pl-13"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus
              />
            </div>
            {fieldErrors.amount && (
              <p className="text-destructive text-xs">{fieldErrors.amount[0]}</p>
            )}
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
            <Button type="submit" disabled={isPending || !amount}>
              {isPending ? "Saving..." : "Save Opening Cash"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
